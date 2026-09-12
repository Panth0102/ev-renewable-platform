package com.evrenewable.repository;

import com.evrenewable.model.FleetOptimisationRun;
import com.evrenewable.model.OptimisationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FleetOptimisationRunRepository extends JpaRepository<FleetOptimisationRun, UUID> {

    List<FleetOptimisationRun> findByFleetIdOrderByCreatedAtDesc(UUID fleetId);

    List<FleetOptimisationRun> findByStatus(OptimisationRequest.OptStatus status);

    // Fetch run with all vehicle schedules in one query
    @Query("SELECT r FROM FleetOptimisationRun r LEFT JOIN FETCH r.vehicleSchedules WHERE r.id = :id")
    Optional<FleetOptimisationRun> findByIdWithSchedules(UUID id);
}
