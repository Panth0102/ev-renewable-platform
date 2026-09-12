package com.evrenewable.dto.request;

import com.evrenewable.model.Vehicle;
import lombok.Data;

import javax.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateVehicleRequest {

    @NotBlank(message = "Vehicle code is required")
    @Size(max = 40)
    private String vehicleCode;

    @NotBlank(message = "Display name is required")
    @Size(max = 80)
    private String displayName;

    @NotNull(message = "Vehicle type is required")
    private Vehicle.VehicleType vehicleType;

    private String make;
    private String model;

    @NotNull(message = "Battery capacity is required")
    @DecimalMin(value = "1.0")
    private BigDecimal batteryCapacityKwh;

    @NotNull(message = "Max charge rate is required")
    @DecimalMin(value = "1.0")
    private BigDecimal maxChargeRateKw;

    private UUID fleetId;
}
