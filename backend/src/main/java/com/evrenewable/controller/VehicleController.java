package com.evrenewable.controller;

import com.evrenewable.dto.request.CreateVehicleRequest;
import com.evrenewable.dto.response.VehicleResponse;
import com.evrenewable.service.VehicleService;
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
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(AppConstants.API_V1 + "/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehicles", description = "Manage EV vehicles and fleet assignments")
public class VehicleController {

    private final VehicleService vehicleService;

    @Operation(summary = "List all vehicles")
    @GetMapping
    public ResponseEntity<List<VehicleResponse>> list() {
        return ResponseEntity.ok(vehicleService.getAll());
    }

    @Operation(summary = "Get a vehicle by ID")
    @GetMapping("/{id}")
    public ResponseEntity<VehicleResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(vehicleService.getById(id));
    }

    @Operation(summary = "List vehicles belonging to a fleet")
    @GetMapping("/fleet/{fleetId}")
    public ResponseEntity<List<VehicleResponse>> byFleet(@PathVariable UUID fleetId) {
        return ResponseEntity.ok(vehicleService.getByFleet(fleetId));
    }

    @Operation(summary = "Register a new vehicle")
    @PostMapping
    public ResponseEntity<VehicleResponse> create(
            @Valid @RequestBody CreateVehicleRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(vehicleService.create(req, principal.getUsername()));
    }

    @Operation(summary = "Update vehicle state-of-charge (SOC)")
    @PatchMapping("/{id}/soc")
    public ResponseEntity<VehicleResponse> updateSoc(
            @PathVariable UUID id,
            @RequestParam BigDecimal soc) {
        return ResponseEntity.ok(vehicleService.updateSoc(id, soc));
    }
}
