package com.evrenewable.controller;

import com.evrenewable.dto.request.CreateChargingSessionRequest;
import com.evrenewable.dto.request.StopChargingSessionRequest;
import com.evrenewable.dto.response.ChargingSessionResponse;
import com.evrenewable.service.ChargingSessionService;
import com.evrenewable.util.AppConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(AppConstants.API_V1 + "/sessions")
@RequiredArgsConstructor
@Tag(name = "Charging Sessions", description = "Start, stop and query EV charging sessions")
public class ChargingSessionController {

    private final ChargingSessionService sessionService;

    @Operation(summary = "Get all active sessions")
    @GetMapping("/active")
    public ResponseEntity<List<ChargingSessionResponse>> active() {
        return ResponseEntity.ok(sessionService.getActive());
    }

    @Operation(summary = "Get a session by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ChargingSessionResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.getById(id));
    }

    @Operation(summary = "Get sessions for a vehicle")
    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<ChargingSessionResponse>> byVehicle(@PathVariable UUID vehicleId) {
        return ResponseEntity.ok(sessionService.getByVehicle(vehicleId));
    }

    @Operation(summary = "Get sessions for a station")
    @GetMapping("/station/{stationId}")
    public ResponseEntity<List<ChargingSessionResponse>> byStation(@PathVariable UUID stationId) {
        return ResponseEntity.ok(sessionService.getByStation(stationId));
    }

    @Operation(summary = "Start a new charging session")
    @PostMapping("/start")
    public ResponseEntity<ChargingSessionResponse> start(
            @Valid @RequestBody CreateChargingSessionRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sessionService.start(req, principal.getUsername()));
    }

    @Operation(summary = "Stop a charging session and record final metrics")
    @PostMapping("/{id}/stop")
    public ResponseEntity<ChargingSessionResponse> stop(
            @PathVariable UUID id,
            @Valid @RequestBody StopChargingSessionRequest req) {
        return ResponseEntity.ok(
                sessionService.stop(id, req.getSocEnd(), req.getEnergyKwh(),
                        req.getRenewablePct(), req.getCostInr(), req.getCo2Kg()));
    }
}
