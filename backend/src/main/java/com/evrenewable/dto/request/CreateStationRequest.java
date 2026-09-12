package com.evrenewable.dto.request;

import lombok.Data;

import javax.validation.constraints.*;
import java.math.BigDecimal;

@Data
public class CreateStationRequest {

    @NotBlank(message = "Station name is required")
    @Size(max = 120)
    private String name;

    @NotBlank(message = "City is required")
    private String city;

    private String state;
    private String address;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    private BigDecimal latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    private BigDecimal longitude;

    private String timezone = "Asia/Kolkata";
    private String notes;
}
