package com.evrenewable.service;

import com.evrenewable.dto.request.FleetOptimisationRequestDto;
import com.evrenewable.dto.response.FleetOptimisationResponse;
import com.evrenewable.exception.BadRequestException;
import com.evrenewable.exception.ResourceNotFoundException;
import com.evrenewable.model.*;
import com.evrenewable.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Fleet charging optimisation.
 *
 * Strategy: greedy peak-shaving scheduler.
 * 1. Fetch active energy signals for the window now → departureTime.
 * 2. For each 1-hour slot, rank vehicles by energy needed (descending).
 * 3. Assign as much power as possible to each vehicle without breaching stationCapKw.
 * 4. Record naive (all-at-once) vs. optimised peak and renewable stats.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FleetOptimisationService {

    private final FleetOptimisationRunRepository runRepository;
    private final FleetRepository                fleetRepository;
    private final VehicleRepository              vehicleRepository;
    private final UserRepository                 userRepository;
    private final EnergySignalRepository         energySignalRepository;
    private final AuditLogService                auditLogService;

    // ── Submit ───────────────────────────────────────────────
    @Transactional
    public FleetOptimisationResponse submit(FleetOptimisationRequestDto req, String userEmail) {
        Fleet fleet = fleetRepository.findById(req.getFleetId())
                .orElseThrow(() -> new ResourceNotFoundException("Fleet", "id", req.getFleetId()));

        User requestedBy = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        List<Vehicle> vehicles = vehicleRepository.findByFleetIdAndIsActiveTrue(req.getFleetId());
        if (vehicles.isEmpty()) {
            throw new BadRequestException("Fleet has no active vehicles");
        }

        FleetOptimisationRun run = FleetOptimisationRun.builder()
                .fleet(fleet)
                .requestedBy(requestedBy)
                .status(OptimisationRequest.OptStatus.RUNNING)
                .stationCapKw(req.getStationCapKw())
                .vehiclesCount((short) vehicles.size())
                .vehicleSchedules(new ArrayList<>())
                .build();
        run = runRepository.save(run);

        run = solve(run, vehicles, req.getStationCapKw().doubleValue(), req.getDepartureTime());
        run = runRepository.save(run);

        log.info("Fleet optimisation completed: runId={} vehicles={} peakOpt={}kW",
                run.getId(), vehicles.size(), run.getPeakOptKw());

        auditLogService.record(requestedBy.getId(), "FLEET_OPTIMISATION_SUBMIT",
                "FleetOptimisationRun", run.getId().toString(),
                "{\"fleetId\":\"" + fleet.getId() + "\",\"vehicles\":" + vehicles.size() + "}");

        return FleetOptimisationResponse.from(
                runRepository.findByIdWithSchedules(run.getId()).orElse(run));
    }

    // ── Get by ID ────────────────────────────────────────────
    @Transactional(readOnly = true)
    public FleetOptimisationResponse getById(UUID id) {
        FleetOptimisationRun run = runRepository.findByIdWithSchedules(id)
                .orElseThrow(() -> new ResourceNotFoundException("FleetOptimisationRun", "id", id));
        return FleetOptimisationResponse.from(run);
    }

    // ── History for a fleet ──────────────────────────────────
    @Transactional(readOnly = true)
    public List<FleetOptimisationResponse> getByFleet(UUID fleetId) {
        return runRepository.findByFleetIdOrderByCreatedAtDesc(fleetId)
                .stream().map(FleetOptimisationResponse::from).collect(Collectors.toList());
    }

    // ── Greedy peak-shaving solver ───────────────────────────
    private FleetOptimisationRun solve(FleetOptimisationRun run,
                                       List<Vehicle> vehicles,
                                       double stationCapKw,
                                       Instant departureTime) {
        Instant now = Instant.now();

        List<EnergySignal> signals = energySignalRepository
                .findBySignalTimeBetweenOrderBySignalTimeAsc(now, departureTime);

        // energy still needed per vehicle (kWh) — initialise from current SOC vs. 100%
        Map<UUID, Double> remaining = new LinkedHashMap<>();
        for (Vehicle v : vehicles) {
            double socGap  = (100.0 - v.getCurrentSoc().doubleValue()) / 100.0;
            double needed  = socGap * v.getBatteryCapacityKwh().doubleValue();
            if (needed > 0) remaining.put(v.getId(), needed);
        }
        Map<UUID, Vehicle> vehicleMap = vehicles.stream()
                .collect(Collectors.toMap(Vehicle::getId, v -> v));

        List<FleetVehicleSchedule> schedules = new ArrayList<>();

        // ── Naive stats: all vehicles charge simultaneously at max rate ──
        double naivePeakKw   = vehicles.stream()
                .mapToDouble(v -> v.getMaxChargeRateKw().doubleValue()).sum();
        double naivePeakCapped = Math.min(naivePeakKw, stationCapKw);
        double totalNaiveRenewable = 0, totalNaiveEnergy = 0;
        if (!signals.isEmpty()) {
            EnergySignal first = signals.get(0);
            totalNaiveEnergy    = naivePeakCapped;
            totalNaiveRenewable = naivePeakCapped * first.getRenewablePct().doubleValue();
        }

        // ── Optimised scheduling: one slot per energy signal ──────────────
        double totalOptEnergy    = 0;
        double totalOptRenewable = 0;
        double peakOptKw         = 0;

        for (int slotIdx = 0; slotIdx < signals.size(); slotIdx++) {
            EnergySignal signal = signals.get(slotIdx);
            double slotBudget   = stationCapKw; // power available this slot

            // Sort remaining vehicles by energy needed desc (most-needy first)
            List<UUID> sorted = remaining.entrySet().stream()
                    .filter(e -> e.getValue() > 0)
                    .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toList());

            double slotUsed = 0;
            for (UUID vid : sorted) {
                if (slotBudget <= 0) break;
                Vehicle v  = vehicleMap.get(vid);
                double maxRate = v.getMaxChargeRateKw().doubleValue();
                double power   = Math.min(Math.min(maxRate, slotBudget), remaining.get(vid));
                if (power <= 0) continue;

                slotBudget           -= power;
                slotUsed             += power;
                remaining.merge(vid, -power, Double::sum);
                totalOptEnergy       += power;
                totalOptRenewable    += power * signal.getRenewablePct().doubleValue();

                schedules.add(FleetVehicleSchedule.builder()
                        .run(run)
                        .vehicle(v)
                        .slotStart(signal.getSignalTime())
                        .slotEnd(signal.getSignalTime().plus(1, ChronoUnit.HOURS))
                        .powerKw(BigDecimal.valueOf(power).setScale(2, RoundingMode.HALF_UP))
                        .renewablePct(signal.getRenewablePct())
                        .slotOrder((short) slotIdx)
                        .build());
            }
            if (slotUsed > peakOptKw) peakOptKw = slotUsed;
        }

        // Any vehicle still with remaining energy: schedule immediately (no signals case)
        remaining.entrySet().stream()
                .filter(e -> e.getValue() > 0.01)
                .forEach(e -> {
                    Vehicle v   = vehicleMap.get(e.getKey());
                    double power = Math.min(v.getMaxChargeRateKw().doubleValue(), e.getValue());
                    schedules.add(FleetVehicleSchedule.builder()
                            .run(run)
                            .vehicle(v)
                            .slotStart(now)
                            .slotEnd(now.plus(1, ChronoUnit.HOURS))
                            .powerKw(BigDecimal.valueOf(power).setScale(2, RoundingMode.HALF_UP))
                            .renewablePct(BigDecimal.ZERO)
                            .slotOrder((short) 0)
                            .build());
                });

        double naiveRenewPct = totalNaiveEnergy > 0
                ? totalNaiveRenewable / totalNaiveEnergy : 0;
        double optRenewPct   = totalOptEnergy > 0
                ? totalOptRenewable / totalOptEnergy : 0;

        run.setStatus(OptimisationRequest.OptStatus.COMPLETED);
        run.setCompletedAt(Instant.now());
        run.setPeakNaiveKw(BigDecimal.valueOf(naivePeakCapped).setScale(2, RoundingMode.HALF_UP));
        run.setPeakOptKw(BigDecimal.valueOf(peakOptKw).setScale(2, RoundingMode.HALF_UP));
        run.setRenewableNaivePct(BigDecimal.valueOf(naiveRenewPct).setScale(2, RoundingMode.HALF_UP));
        run.setRenewableOptPct(BigDecimal.valueOf(optRenewPct).setScale(2, RoundingMode.HALF_UP));
        run.getVehicleSchedules().clear();
        run.getVehicleSchedules().addAll(schedules);
        return run;
    }
}
