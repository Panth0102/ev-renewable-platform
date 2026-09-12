package com.evrenewable.controller;

import com.evrenewable.dto.request.OptimisationRequestDto;
import com.evrenewable.dto.response.OptimisationResponse;
import com.evrenewable.service.OptimisationService;
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
@RequestMapping(AppConstants.API_V1 + "/optimise")
@RequiredArgsConstructor
@Tag(name = "Optimisation", description = "Submit and retrieve EV charging optimisation schedules")
public class OptimisationController {

    private final OptimisationService optimisationService;

    @Operation(summary = "Submit a new optimisation request for a single EV")
    @PostMapping
    public ResponseEntity<OptimisationResponse> submit(
            @Valid @RequestBody OptimisationRequestDto req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(optimisationService.submit(req, principal.getUsername()));
    }

    @Operation(summary = "Get an optimisation result by ID")
    @GetMapping("/{id}")
    public ResponseEntity<OptimisationResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(optimisationService.getById(id));
    }

    @Operation(summary = "Get all optimisation requests for a vehicle")
    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<OptimisationResponse>> byVehicle(@PathVariable UUID vehicleId) {
        return ResponseEntity.ok(optimisationService.getByVehicle(vehicleId));
    }
}
