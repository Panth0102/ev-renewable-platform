package com.evrenewable.dto.request;

import lombok.Data;

import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;
import java.math.BigDecimal;

@Data
public class StopChargingSessionRequest {

    @DecimalMin("0") @DecimalMax("100")
    private BigDecimal socEnd;

    @DecimalMin("0")
    private BigDecimal energyKwh;

    /** Renewable percentage of energy delivered (0–100). */
    @DecimalMin("0") @DecimalMax("100")
    private BigDecimal renewablePct;

    @DecimalMin("0")
    private BigDecimal costInr;

    @DecimalMin("0")
    private BigDecimal co2Kg;
}
