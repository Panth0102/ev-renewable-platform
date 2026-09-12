package com.evrenewable.service;

import com.evrenewable.model.*;
import com.evrenewable.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Runs the optimisation algorithm in a background thread.
 * Lives in a separate bean so that @Async proxying works correctly
 * (self-invocation on OptimisationService would bypass the proxy).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AsyncOptimisationRunner {

    private final OptimisationRequestRepository optRepository;
    private final EnergySignalRepository        energySignalRepository;
    private final RestTemplate                  restTemplate;
    private final AuditLogService               auditLogService;

    @Value("${optimization.service.url}")
    private String optimizationServiceUrl;

    // ── Entry point called by OptimisationService ─────────────────
    @Async
    @Transactional
    public void run(UUID requestId, UUID actorId) {
        OptimisationRequest optReq = optRepository.findByIdWithSlots(requestId).orElse(null);
        if (optReq == null) {
            log.error("Async optimisation: request {} not found", requestId);
            return;
        }

        try {
            try {
                optReq = callFastApiOptimizer(optReq);
            } catch (RestClientException e) {
                log.warn("FastAPI optimizer unreachable for {}, using built-in solver: {}",
                        requestId, e.getMessage());
                optReq = runBuiltInSolver(optReq);
            }
        } catch (Exception e) {
            log.error("Optimisation failed for {}: {}", requestId, e.getMessage(), e);
            optReq.setStatus(OptimisationRequest.OptStatus.FAILED);
            optReq.setErrorMessage(e.getMessage());
        }

        optRepository.save(optReq);
        log.info("Async optimisation completed: id={} status={} score={}",
                requestId, optReq.getStatus(), optReq.getGreenScore());

        auditLogService.record(actorId, "OPTIMISATION_COMPLETE", "OptimisationRequest",
                requestId.toString(),
                "{\"status\":\"" + optReq.getStatus()
                        + "\",\"greenScore\":" + optReq.getGreenScore() + "}");
    }

    // ── FastAPI call ──────────────────────────────────────────────
    private OptimisationRequest callFastApiOptimizer(OptimisationRequest r) {
        String url = optimizationServiceUrl + "/optimize";

        Map<String, Object> payload = new HashMap<>();
        payload.put("vehicle_id",           r.getVehicle().getId().toString());
        payload.put("current_soc",          r.getCurrentSoc());
        payload.put("target_soc",           r.getTargetSoc());
        payload.put("battery_capacity_kwh", r.getBatteryCapacityKwh());
        payload.put("charger_limit_kw",     r.getChargerLimitKw());
        payload.put("departure_time",       r.getDepartureTime().toString());

        ResponseEntity<Map> resp = restTemplate.postForEntity(url, payload, Map.class);
        Map<?, ?> body = resp.getBody();
        if (body == null) throw new RestClientException("Empty response from optimizer");

        return applyFastApiResult(r, body);
    }

    @SuppressWarnings("unchecked")
    private OptimisationRequest applyFastApiResult(OptimisationRequest r, Map<?, ?> body) {
        r.setStatus(OptimisationRequest.OptStatus.COMPLETED);
        r.setCompletedAt(Instant.now());

        if (body.get("green_score") != null)
            r.setGreenScore(((Number) body.get("green_score")).shortValue());
        if (body.get("renewable_alignment_pct") != null)
            r.setRenewableAlignmentPct(new BigDecimal(body.get("renewable_alignment_pct").toString()));
        if (body.get("estimated_cost_inr") != null)
            r.setEstimatedCostInr(new BigDecimal(body.get("estimated_cost_inr").toString()));
        if (body.get("estimated_co2_kg") != null)
            r.setEstimatedCo2Kg(new BigDecimal(body.get("estimated_co2_kg").toString()));
        if (body.get("total_energy_kwh") != null)
            r.setTotalEnergyKwh(new BigDecimal(body.get("total_energy_kwh").toString()));
        if (body.get("best_window_start") != null)
            r.setBestWindowStart(Instant.parse(body.get("best_window_start").toString()));
        if (body.get("best_window_end") != null)
            r.setBestWindowEnd(Instant.parse(body.get("best_window_end").toString()));

        Object rawSlots = body.get("slots");
        List<Map<String, Object>> slots = rawSlots instanceof List
                ? (List<Map<String, Object>>) rawSlots : new ArrayList<>();
        List<OptimisationScheduleSlot> slotEntities = new ArrayList<>();
        for (int i = 0; i < slots.size(); i++) {
            Map<String, Object> s = slots.get(i);
            slotEntities.add(OptimisationScheduleSlot.builder()
                    .request(r)
                    .slotStart(Instant.parse(s.get("slot_start").toString()))
                    .slotEnd(Instant.parse(s.get("slot_end").toString()))
                    .powerKw(new BigDecimal(s.get("power_kw").toString()))
                    .renewablePct(s.get("renewable_pct") != null
                            ? new BigDecimal(s.get("renewable_pct").toString()) : null)
                    .slotOrder((short) i)
                    .build());
        }
        r.getSlots().clear();
        r.getSlots().addAll(slotEntities);
        return r;
    }

    // ── Built-in greedy solver ────────────────────────────────────
    private OptimisationRequest runBuiltInSolver(OptimisationRequest r) {
        final double FALLBACK_RATE = 8.5;

        double socNeeded  = r.getTargetSoc().subtract(r.getCurrentSoc()).doubleValue();
        double batteryKwh = (socNeeded / 100.0) * r.getBatteryCapacityKwh().doubleValue();
        double chargerKw  = r.getChargerLimitKw().doubleValue();
        Instant now       = Instant.now();
        long hoursUntilDeparture = ChronoUnit.HOURS.between(now, r.getDepartureTime());

        List<EnergySignal> signals = energySignalRepository
                .findBySignalTimeBetweenOrderBySignalTimeAsc(now, r.getDepartureTime());

        List<EnergySignal> ranked = signals.stream()
                .sorted(Comparator.comparingDouble(s -> -s.getRenewablePct().doubleValue()))
                .collect(Collectors.toList());

        List<OptimisationScheduleSlot> slots = new ArrayList<>();
        double remaining = batteryKwh, totalRenewable = 0, totalEnergy = 0, totalCost = 0;
        Instant bestStart = null, bestEnd = null;
        double bestRenew = -1;

        for (EnergySignal signal : ranked) {
            if (remaining <= 0) break;
            double power = Math.min(chargerKw, remaining);
            remaining      -= power;
            totalEnergy    += power;
            totalRenewable += power * signal.getRenewablePct().doubleValue();
            double rate = signal.getElectricityPricePerKwh() != null
                    ? signal.getElectricityPricePerKwh().doubleValue() : FALLBACK_RATE;
            totalCost += power * rate;

            if (signal.getRenewablePct().doubleValue() > bestRenew) {
                bestRenew = signal.getRenewablePct().doubleValue();
                bestStart = signal.getSignalTime();
                bestEnd   = signal.getSignalTime().plus(1, ChronoUnit.HOURS);
            }

            int order = signals.indexOf(signal);
            slots.add(OptimisationScheduleSlot.builder()
                    .request(r)
                    .slotStart(signal.getSignalTime())
                    .slotEnd(signal.getSignalTime().plus(1, ChronoUnit.HOURS))
                    .powerKw(BigDecimal.valueOf(power).setScale(2, RoundingMode.HALF_UP))
                    .renewablePct(signal.getRenewablePct())
                    .slotOrder((short) (order >= 0 ? order : slots.size()))
                    .build());
        }

        if (slots.isEmpty() && hoursUntilDeparture > 0) {
            slots.add(OptimisationScheduleSlot.builder()
                    .request(r)
                    .slotStart(now).slotEnd(now.plus(1, ChronoUnit.HOURS))
                    .powerKw(BigDecimal.valueOf(Math.min(chargerKw, batteryKwh)).setScale(2, RoundingMode.HALF_UP))
                    .renewablePct(BigDecimal.ZERO).slotOrder((short) 0).build());
            totalEnergy = batteryKwh;
            totalCost   = batteryKwh * FALLBACK_RATE;
            bestStart   = now;
            bestEnd     = now.plus(1, ChronoUnit.HOURS);
        }

        double renewAlign = totalEnergy > 0 ? totalRenewable / totalEnergy : 0;
        double co2        = totalEnergy * (1.0 - (renewAlign / 100.0)) * 0.82;
        short  score      = (short) Math.min(100,
                (int)(renewAlign * 0.6 + (hoursUntilDeparture > 3 ? 20 : 10) + 10));

        r.setStatus(OptimisationRequest.OptStatus.COMPLETED);
        r.setCompletedAt(Instant.now());
        r.setGreenScore(score);
        r.setRenewableAlignmentPct(BigDecimal.valueOf(renewAlign).setScale(2, RoundingMode.HALF_UP));
        r.setEstimatedCostInr(BigDecimal.valueOf(totalCost).setScale(2, RoundingMode.HALF_UP));
        r.setEstimatedCo2Kg(BigDecimal.valueOf(co2).setScale(3, RoundingMode.HALF_UP));
        r.setTotalEnergyKwh(BigDecimal.valueOf(totalEnergy).setScale(3, RoundingMode.HALF_UP));
        r.setBestWindowStart(bestStart);
        r.setBestWindowEnd(bestEnd);
        r.getSlots().clear();
        r.getSlots().addAll(slots);
        return r;
    }
}
