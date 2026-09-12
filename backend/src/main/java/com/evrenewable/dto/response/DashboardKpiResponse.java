package com.evrenewable.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardKpiResponse {
    private long       activeStations;
    private long       activeSessions;
    private BigDecimal energyTodayKwh;
    private BigDecimal solarSharePct;
    private BigDecimal co2SavedMonthKg;
}
