package com.evrenewable.dto.response;

import com.evrenewable.model.Charger;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ChargerResponse {
    private UUID                  id;
    private String                chargerCode;
    private Charger.ChargerType   chargerType;
    private BigDecimal            powerKw;
    private Charger.ChargerStatus status;
    private String                connectorType;
    private boolean               isSmart;

    public static ChargerResponse from(Charger c) {
        return ChargerResponse.builder()
                .id(c.getId())
                .chargerCode(c.getChargerCode())
                .chargerType(c.getChargerType())
                .powerKw(c.getPowerKw())
                .status(c.getStatus())
                .connectorType(c.getConnectorType())
                .isSmart(c.isSmart())
                .build();
    }
}
