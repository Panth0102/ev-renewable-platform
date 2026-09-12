package com.evrenewable.service;

import com.evrenewable.dto.request.CreateVehicleRequest;
import com.evrenewable.dto.response.VehicleResponse;
import com.evrenewable.exception.ConflictException;
import com.evrenewable.exception.ResourceNotFoundException;
import com.evrenewable.model.Fleet;
import com.evrenewable.model.User;
import com.evrenewable.model.Vehicle;
import com.evrenewable.repository.FleetRepository;
import com.evrenewable.repository.UserRepository;
import com.evrenewable.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final FleetRepository   fleetRepository;
    private final UserRepository    userRepository;

    @Transactional(readOnly = true)
    public List<VehicleResponse> getAll() {
        return vehicleRepository.findAll()
                .stream().map(VehicleResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleResponse getById(UUID id) {
        return VehicleResponse.from(findVehicle(id));
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getByFleet(UUID fleetId) {
        return vehicleRepository.findByFleetId(fleetId)
                .stream().map(VehicleResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public VehicleResponse create(CreateVehicleRequest req, String ownerEmail) {
        if (vehicleRepository.findByVehicleCode(req.getVehicleCode()).isPresent()) {
            throw new ConflictException("Vehicle code already exists: " + req.getVehicleCode());
        }

        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", ownerEmail));

        Fleet fleet = null;
        if (req.getFleetId() != null) {
            fleet = fleetRepository.findById(req.getFleetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Fleet", "id", req.getFleetId()));
        }

        Vehicle vehicle = Vehicle.builder()
                .vehicleCode(req.getVehicleCode())
                .displayName(req.getDisplayName())
                .vehicleType(req.getVehicleType())
                .make(req.getMake())
                .model(req.getModel())
                .batteryCapacityKwh(req.getBatteryCapacityKwh())
                .maxChargeRateKw(req.getMaxChargeRateKw())
                .currentSoc(BigDecimal.ZERO)
                .isActive(true)
                .fleet(fleet)
                .owner(owner)
                .build();

        vehicle = vehicleRepository.save(vehicle);
        log.info("Created vehicle: {} owned by {}", vehicle.getVehicleCode(), ownerEmail);
        return VehicleResponse.from(vehicle);
    }

    @Transactional
    public VehicleResponse updateSoc(UUID id, BigDecimal soc) {
        Vehicle vehicle = findVehicle(id);
        vehicle.setCurrentSoc(soc);
        return VehicleResponse.from(vehicleRepository.save(vehicle));
    }

    // ── Internal helper ──────────────────────────────────────
    Vehicle findVehicle(UUID id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
    }
}
