package com.evrenewable.dto.response;

import com.evrenewable.model.Vehicle;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VehicleResponse {
    private UUID                 id;
    private String               vehicleCode;
    private String               displayName;
    private Vehicle.VehicleType  vehicleType;
    private String               make;
    private String               model;
    private BigDecimal           batteryCapacityKwh;
    private BigDecimal           maxChargeRateKw;
    private BigDecimal           currentSoc;
    private boolean              isActive;
    private UUID                 fleetId;
    private Instant              createdAt;

    public static VehicleResponse from(Vehicle v) {
        return VehicleResponse.builder()
                .id(v.getId())
                .vehicleCode(v.getVehicleCode())
                .displayName(v.getDisplayName())
                .vehicleType(v.getVehicleType())
                .make(v.getMake())
                .model(v.getModel())
                .batteryCapacityKwh(v.getBatteryCapacityKwh())
                .maxChargeRateKw(v.getMaxChargeRateKw())
                .currentSoc(v.getCurrentSoc())
                .isActive(v.isActive())
                .fleetId(v.getFleet() != null ? v.getFleet().getId() : null)
                .createdAt(v.getCreatedAt())
                .build();
    }
}
