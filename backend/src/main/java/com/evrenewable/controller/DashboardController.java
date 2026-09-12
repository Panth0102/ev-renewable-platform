package com.evrenewable.controller;

import com.evrenewable.dto.response.DashboardKpiResponse;
import com.evrenewable.service.DashboardService;
import com.evrenewable.util.AppConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(AppConstants.API_V1 + "/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Aggregated KPI data for the operator dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    @Operation(summary = "Get live KPI snapshot — active stations, sessions, energy today, solar share, CO2 saved")
    @GetMapping("/kpi")
    public ResponseEntity<DashboardKpiResponse> kpi() {
        return ResponseEntity.ok(dashboardService.getKpi());
    }
}
