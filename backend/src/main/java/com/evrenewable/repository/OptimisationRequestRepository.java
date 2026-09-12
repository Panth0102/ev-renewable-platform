package com.evrenewable.repository;

import com.evrenewable.model.OptimisationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OptimisationRequestRepository extends JpaRepository<OptimisationRequest, UUID> {

    List<OptimisationRequest> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    List<OptimisationRequest> findByStatus(OptimisationRequest.OptStatus status);

    // Fetch request with its schedule slots eagerly
    @Query("SELECT r FROM OptimisationRequest r LEFT JOIN FETCH r.slots WHERE r.id = :id")
    java.util.Optional<OptimisationRequest> findByIdWithSlots(UUID id);

    List<OptimisationRequest> findByRequestedByIdOrderByCreatedAtDesc(UUID userId);
}
