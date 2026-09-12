package com.evrenewable.dto.request;

import com.evrenewable.model.Charger;
import lombok.Data;

import javax.validation.constraints.*;
import java.math.BigDecimal;

@Data
public class CreateChargerRequest {

    @NotBlank(message = "Charger code is required")
    @Size(max = 40)
    private String chargerCode;

    @NotNull(message = "Charger type is required")
    private Charger.ChargerType chargerType;

    @NotNull(message = "Power rating is required")
    @DecimalMin(value = "0.1")
    private BigDecimal powerKw;

    @Size(max = 30)
    private String connectorType;

    private boolean isSmart = true;
}
