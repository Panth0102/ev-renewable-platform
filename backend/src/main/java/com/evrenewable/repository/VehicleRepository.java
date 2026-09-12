package com.evrenewable.repository;

import com.evrenewable.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {

    List<Vehicle> findByFleetId(UUID fleetId);

    List<Vehicle> findByOwnerId(UUID ownerId);

    Optional<Vehicle> findByVehicleCode(String vehicleCode);

    List<Vehicle> findByFleetIdAndIsActiveTrue(UUID fleetId);
}
