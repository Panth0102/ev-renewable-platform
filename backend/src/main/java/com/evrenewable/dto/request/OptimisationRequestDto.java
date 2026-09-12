package com.evrenewable.dto.request;

import lombok.Data;

import javax.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
public class OptimisationRequestDto {

    @NotNull(message = "Vehicle ID is required")
    private UUID vehicleId;

    private UUID stationId;
    private UUID chargerId;

    @NotNull @DecimalMin("0") @DecimalMax("100")
    private BigDecimal currentSoc;

    @NotNull @DecimalMin("0") @DecimalMax("100")
    private BigDecimal targetSoc;

    @NotNull @DecimalMin("0.1")
    private BigDecimal batteryCapacityKwh;

    @NotNull @DecimalMin("0.1")
    private BigDecimal chargerLimitKw;

    @NotNull(message = "Departure time is required")
    @Future(message = "Departure time must be in the future")
    private Instant departureTime;
}
