package com.evrenewable.repository;

import com.evrenewable.model.Charger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChargerRepository extends JpaRepository<Charger, UUID> {

    List<Charger> findByStationId(UUID stationId);

    List<Charger> findByStationIdAndStatus(UUID stationId, Charger.ChargerStatus status);

    Optional<Charger> findByChargerCode(String chargerCode);

    long countByStatus(Charger.ChargerStatus status);
}
