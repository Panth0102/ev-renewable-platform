package com.evrenewable.controller;

import com.evrenewable.dto.request.FleetOptimisationRequestDto;
import com.evrenewable.dto.response.FleetOptimisationResponse;
import com.evrenewable.service.FleetOptimisationService;
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
@RequestMapping(AppConstants.API_V1 + "/fleet-optimise")
@RequiredArgsConstructor
@Tag(name = "Fleet Optimisation", description = "Submit and retrieve fleet-level EV charging optimisation runs")
public class FleetOptimisationController {

    private final FleetOptimisationService fleetOptimisationService;

    @Operation(summary = "Submit a fleet optimisation run — schedules all active vehicles to charge within station capacity")
    @PostMapping
    public ResponseEntity<FleetOptimisationResponse> submit(
            @Valid @RequestBody FleetOptimisationRequestDto req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fleetOptimisationService.submit(req, principal.getUsername()));
    }

    @Operation(summary = "Get a fleet optimisation run by ID")
    @GetMapping("/{id}")
    public ResponseEntity<FleetOptimisationResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(fleetOptimisationService.getById(id));
    }

    @Operation(summary = "Get all optimisation runs for a fleet")
    @GetMapping("/fleet/{fleetId}")
    public ResponseEntity<List<FleetOptimisationResponse>> byFleet(@PathVariable UUID fleetId) {
        return ResponseEntity.ok(fleetOptimisationService.getByFleet(fleetId));
    }
}
