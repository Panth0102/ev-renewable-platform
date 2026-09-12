package com.evrenewable.service;

import com.evrenewable.dto.request.OptimisationRequestDto;
import com.evrenewable.dto.response.OptimisationResponse;
import com.evrenewable.exception.BadRequestException;
import com.evrenewable.exception.ResourceNotFoundException;
import com.evrenewable.model.*;
import com.evrenewable.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Handles validation, entity creation and result retrieval.
 * Heavy optimisation work is delegated to {@link AsyncOptimisationRunner}
 * which runs in a background thread so the HTTP request returns immediately.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OptimisationService {

    private final OptimisationRequestRepository optRepository;
    private final VehicleRepository             vehicleRepository;
    private final StationRepository             stationRepository;
    private final ChargerRepository             chargerRepository;
    private final UserRepository                userRepository;
    private final AuditLogService               auditLogService;
    private final AsyncOptimisationRunner       asyncRunner;

    // ── Submit — returns immediately with status=PENDING ─────────
    @Transactional
    public OptimisationResponse submit(OptimisationRequestDto req, String userEmail) {
        if (req.getTargetSoc().compareTo(req.getCurrentSoc()) <= 0) {
            throw new BadRequestException("Target SOC must be greater than current SOC");
        }

        Vehicle vehicle = vehicleRepository.findById(req.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", req.getVehicleId()));

        User requestedBy = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        Station station = req.getStationId() != null
                ? stationRepository.findById(req.getStationId()).orElse(null)
                : null;

        Charger charger = req.getChargerId() != null
                ? chargerRepository.findById(req.getChargerId()).orElse(null)
                : null;

        // Persist with PENDING — the async runner will flip this to RUNNING then COMPLETED/FAILED
        OptimisationRequest optReq = OptimisationRequest.builder()
                .vehicle(vehicle)
                .station(station)
                .charger(charger)
                .requestedBy(requestedBy)
                .currentSoc(req.getCurrentSoc())
                .targetSoc(req.getTargetSoc())
                .batteryCapacityKwh(req.getBatteryCapacityKwh())
                .chargerLimitKw(req.getChargerLimitKw())
                .departureTime(req.getDepartureTime())
                .status(OptimisationRequest.OptStatus.PENDING)
                .slots(new ArrayList<>())
                .build();

        optReq = optRepository.save(optReq);
        log.info("Optimisation request created: id={} vehicle={}", optReq.getId(), vehicle.getId());

        auditLogService.record(requestedBy.getId(), "OPTIMISATION_SUBMIT", "OptimisationRequest",
                optReq.getId().toString(),
                "{\"vehicleId\":\"" + vehicle.getId() + "\",\"status\":\"PENDING\"}");

        // Fire-and-forget: runs in Spring's async executor, separate transaction
        asyncRunner.run(optReq.getId(), requestedBy.getId());

        return OptimisationResponse.from(optReq);
    }

    // ── Get by ID (used as the poll endpoint) ─────────────────────
    @Transactional(readOnly = true)
    public OptimisationResponse getById(UUID id) {
        OptimisationRequest r = optRepository.findByIdWithSlots(id)
                .orElseThrow(() -> new ResourceNotFoundException("OptimisationRequest", "id", id));
        return OptimisationResponse.from(r);
    }

    // ── Get history for a vehicle ─────────────────────────────────
    @Transactional(readOnly = true)
    public List<OptimisationResponse> getByVehicle(UUID vehicleId) {
        return optRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                .stream().map(OptimisationResponse::from).collect(Collectors.toList());
    }
}
