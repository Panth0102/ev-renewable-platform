package com.evrenewable.dto.request;

import lombok.Data;

import javax.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateChargingSessionRequest {

    @NotNull(message = "Vehicle ID is required")
    private UUID vehicleId;

    @NotNull(message = "Charger ID is required")
    private UUID chargerId;

    @DecimalMin("0") @DecimalMax("100")
    private BigDecimal socStart;

    // Optional — links session to an optimisation schedule
    private UUID optRequestId;
}
