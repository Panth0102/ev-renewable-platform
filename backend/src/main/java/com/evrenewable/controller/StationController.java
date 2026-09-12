package com.evrenewable.controller;

import com.evrenewable.dto.request.CreateChargerRequest;
import com.evrenewable.dto.request.CreateStationRequest;
import com.evrenewable.dto.response.ChargerResponse;
import com.evrenewable.dto.response.StationResponse;
import com.evrenewable.model.Charger;
import com.evrenewable.model.Station;
import com.evrenewable.service.StationService;
import com.evrenewable.util.AppConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(AppConstants.API_V1 + "/stations")
@RequiredArgsConstructor
@Tag(name = "Stations", description = "Manage EV charging stations and chargers")
public class StationController {

    private final StationService stationService;

    // ── Stations ─────────────────────────────────────────────
    @Operation(summary = "List all active stations with their chargers")
    @GetMapping
    public ResponseEntity<List<StationResponse>> list() {
        return ResponseEntity.ok(stationService.getAllStations());
    }

    @Operation(summary = "Get a station by ID")
    @GetMapping("/{id}")
    public ResponseEntity<StationResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(stationService.getStation(id));
    }

    @Operation(summary = "Create a new station (ADMIN / OPERATOR only)")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<StationResponse> create(@Valid @RequestBody CreateStationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stationService.createStation(req));
    }

    @Operation(summary = "Update station status (ADMIN / OPERATOR only)")
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<StationResponse> updateStatus(
            @PathVariable UUID id,
            @RequestParam Station.StationStatus status) {
        return ResponseEntity.ok(stationService.updateStatus(id, status));
    }

    // ── Chargers ─────────────────────────────────────────────
    @Operation(summary = "List chargers for a station")
    @GetMapping("/{stationId}/chargers")
    public ResponseEntity<List<ChargerResponse>> listChargers(@PathVariable UUID stationId) {
        return ResponseEntity.ok(stationService.getChargersForStation(stationId));
    }

    @Operation(summary = "Add a charger to a station (ADMIN / OPERATOR only)")
    @PostMapping("/{stationId}/chargers")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<ChargerResponse> addCharger(
            @PathVariable UUID stationId,
            @Valid @RequestBody CreateChargerRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(stationService.addCharger(stationId, req));
    }

    @Operation(summary = "Update charger status (ADMIN / OPERATOR only)")
    @PatchMapping("/chargers/{chargerId}/status")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<ChargerResponse> updateChargerStatus(
            @PathVariable UUID chargerId,
            @RequestParam Charger.ChargerStatus status) {
        return ResponseEntity.ok(stationService.updateChargerStatus(chargerId, status));
    }
}
