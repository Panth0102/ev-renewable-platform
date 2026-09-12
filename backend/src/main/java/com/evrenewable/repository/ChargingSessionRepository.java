package com.evrenewable.repository;

import com.evrenewable.model.ChargingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ChargingSessionRepository extends JpaRepository<ChargingSession, UUID> {

    List<ChargingSession> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    List<ChargingSession> findByStationIdOrderByCreatedAtDesc(UUID stationId);

    List<ChargingSession> findByStatus(ChargingSession.SessionStatus status);

    List<ChargingSession> findByUserIdOrderByCreatedAtDesc(UUID userId);

    // Dashboard KPI: energy delivered today across all sessions
    @Query("SELECT COALESCE(SUM(s.energyDeliveredKwh), 0) FROM ChargingSession s " +
           "WHERE s.startedAt >= :dayStart AND s.startedAt < :dayEnd")
    java.math.BigDecimal sumEnergyDeliveredBetween(Instant dayStart, Instant dayEnd);

    // Dashboard KPI: average renewable % today
    @Query("SELECT COALESCE(AVG(s.renewablePct), 0) FROM ChargingSession s " +
           "WHERE s.startedAt >= :dayStart AND s.startedAt < :dayEnd")
    java.math.BigDecimal avgRenewablePctBetween(Instant dayStart, Instant dayEnd);

    // CO2 saved this month
    @Query("SELECT COALESCE(SUM(s.co2SavedKg), 0) FROM ChargingSession s " +
           "WHERE s.startedAt >= :monthStart")
    java.math.BigDecimal sumCo2SavedSince(Instant monthStart);

    long countByStatus(ChargingSession.SessionStatus status);
}
