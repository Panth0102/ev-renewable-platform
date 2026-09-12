package com.evrenewable.service;

import com.evrenewable.dto.response.DashboardKpiResponse;
import com.evrenewable.model.ChargingSession;
import com.evrenewable.model.Station;
import com.evrenewable.repository.ChargingSessionRepository;
import com.evrenewable.repository.StationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final StationRepository         stationRepository;
    private final ChargingSessionRepository sessionRepository;

    @Transactional(readOnly = true)
    public DashboardKpiResponse getKpi() {
        ZonedDateTime startOfDay = LocalDate.now(ZoneId.of("Asia/Kolkata"))
                .atStartOfDay(ZoneId.of("Asia/Kolkata"));
        Instant dayStart  = startOfDay.toInstant();
        Instant dayEnd    = startOfDay.plusDays(1).toInstant();
        Instant monthStart = startOfDay.withDayOfMonth(1).toInstant();

        long activeStations = stationRepository.countByStatus(Station.StationStatus.ACTIVE);
        long activeSessions = sessionRepository.countByStatus(ChargingSession.SessionStatus.ACTIVE);

        BigDecimal energyToday  = sessionRepository.sumEnergyDeliveredBetween(dayStart, dayEnd);
        BigDecimal solarShare   = sessionRepository.avgRenewablePctBetween(dayStart, dayEnd);
        BigDecimal co2Saved     = sessionRepository.sumCo2SavedSince(monthStart);

        return DashboardKpiResponse.builder()
                .activeStations(activeStations)
                .activeSessions(activeSessions)
                .energyTodayKwh(energyToday)
                .solarSharePct(solarShare)
                .co2SavedMonthKg(co2Saved)
                .build();
    }
}
