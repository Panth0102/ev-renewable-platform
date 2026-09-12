package com.evrenewable.service;

import com.evrenewable.dto.request.CreateChargingSessionRequest;
import com.evrenewable.dto.response.ChargingSessionResponse;
import com.evrenewable.exception.BadRequestException;
import com.evrenewable.exception.ResourceNotFoundException;
import com.evrenewable.model.*;
import com.evrenewable.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChargingSessionService {

    private final ChargingSessionRepository     sessionRepository;
    private final VehicleRepository             vehicleRepository;
    private final ChargerRepository             chargerRepository;
    private final StationRepository             stationRepository;
    private final UserRepository                userRepository;
    private final OptimisationRequestRepository optRepository;
    private final AuditLogService               auditLogService;

    // ── Start session ────────────────────────────────────────
    @Transactional
    public ChargingSessionResponse start(CreateChargingSessionRequest req, String userEmail) {
        Vehicle vehicle = vehicleRepository.findById(req.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", req.getVehicleId()));

        Charger charger = chargerRepository.findById(req.getChargerId())
                .orElseThrow(() -> new ResourceNotFoundException("Charger", "id", req.getChargerId()));

        if (charger.getStatus() != Charger.ChargerStatus.AVAILABLE) {
            throw new BadRequestException("Charger " + charger.getChargerCode() + " is not available");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        OptimisationRequest optReq = null;
        if (req.getOptRequestId() != null) {
            optReq = optRepository.findById(req.getOptRequestId()).orElse(null);
        }

        ChargingSession session = ChargingSession.builder()
                .vehicle(vehicle)
                .charger(charger)
                .station(charger.getStation())
                .user(user)
                .optRequest(optReq)
                .status(ChargingSession.SessionStatus.ACTIVE)
                .socStart(req.getSocStart() != null ? req.getSocStart() : vehicle.getCurrentSoc())
                .startedAt(Instant.now())
                .build();

        session = sessionRepository.save(session);

        // Mark charger as occupied
        charger.setStatus(Charger.ChargerStatus.OCCUPIED);
        chargerRepository.save(charger);

        log.info("Session started: vehicle={} charger={}", vehicle.getVehicleCode(), charger.getChargerCode());

        auditLogService.record(user.getId(), "SESSION_START", "ChargingSession",
                session.getId().toString(),
                "{\"vehicleCode\":\"" + vehicle.getVehicleCode() + "\","
                        + "\"chargerCode\":\"" + charger.getChargerCode() + "\"}");

        return ChargingSessionResponse.from(session);
    }

    // ── Stop session ─────────────────────────────────────────
    @Transactional
    public ChargingSessionResponse stop(UUID sessionId, BigDecimal socEnd,
                                        BigDecimal energyKwh, BigDecimal renewablePct,
                                        BigDecimal costInr, BigDecimal co2Kg) {
        ChargingSession session = findSession(sessionId);

        if (session.getStatus() != ChargingSession.SessionStatus.ACTIVE) {
            throw new BadRequestException("Session is not active");
        }

        session.setStatus(ChargingSession.SessionStatus.COMPLETED);
        session.setSocEnd(socEnd);
        session.setEnergyDeliveredKwh(energyKwh);
        session.setRenewablePct(renewablePct);
        session.setCostInr(costInr);
        session.setCo2SavedKg(co2Kg);
        session.setEndedAt(Instant.now());

        // Green score: renewable alignment (70%) + cost savings ratio (30%)
        // Savings ratio: how much cheaper this session was vs. worst-case grid rate (₹12/kWh).
        if (renewablePct != null) {
            double renewScore = renewablePct.doubleValue() * 0.70;
            double savingsScore = 0.0;
            if (costInr != null && energyKwh != null && energyKwh.compareTo(BigDecimal.ZERO) > 0) {
                double actualRatePerKwh = costInr.doubleValue() / energyKwh.doubleValue();
                double worstCaseRate    = 12.0; // ₹12/kWh grid peak rate
                double savingsRatio     = Math.max(0, (worstCaseRate - actualRatePerKwh) / worstCaseRate);
                savingsScore = Math.min(savingsRatio * 100, 100) * 0.30;
            }
            session.setGreenScore((short) Math.min(100, (int)(renewScore + savingsScore)));
        }

        session = sessionRepository.save(session);

        // Free the charger
        Charger charger = session.getCharger();
        charger.setStatus(Charger.ChargerStatus.AVAILABLE);
        chargerRepository.save(charger);

        // Update vehicle SOC — persist the change
        if (socEnd != null) {
            Vehicle vehicle = session.getVehicle();
            vehicle.setCurrentSoc(socEnd);
            vehicleRepository.save(vehicle);   // FIX: was missing, SOC change was never persisted
        }

        log.info("Session completed: id={} energy={}kWh greenScore={}", sessionId, energyKwh, session.getGreenScore());

        auditLogService.record(session.getUser() != null ? session.getUser().getId() : null,
                "SESSION_STOP", "ChargingSession",
                sessionId.toString(),
                "{\"energyKwh\":" + energyKwh + ",\"greenScore\":" + session.getGreenScore() + "}");

        return ChargingSessionResponse.from(session);
    }

    // ── Queries ──────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ChargingSessionResponse> getByVehicle(UUID vehicleId) {
        return sessionRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                .stream().map(ChargingSessionResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChargingSessionResponse> getByStation(UUID stationId) {
        return sessionRepository.findByStationIdOrderByCreatedAtDesc(stationId)
                .stream().map(ChargingSessionResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChargingSessionResponse> getActive() {
        return sessionRepository.findByStatus(ChargingSession.SessionStatus.ACTIVE)
                .stream().map(ChargingSessionResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChargingSessionResponse getById(UUID id) {
        return ChargingSessionResponse.from(findSession(id));
    }

    private ChargingSession findSession(UUID id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChargingSession", "id", id));
    }
}
