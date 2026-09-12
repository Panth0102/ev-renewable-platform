package com.evrenewable.repository;

import com.evrenewable.model.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StationRepository extends JpaRepository<Station, UUID> {

    List<Station> findByStatus(Station.StationStatus status);

    List<Station> findByOperatorId(UUID operatorId);

    // Fetch stations with their chargers in one query (avoids N+1)
    @Query("SELECT DISTINCT s FROM Station s LEFT JOIN FETCH s.chargers WHERE s.status = :status")
    List<Station> findByStatusWithChargers(Station.StationStatus status);

    long countByStatus(Station.StationStatus status);
}
