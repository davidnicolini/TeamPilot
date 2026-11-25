package io.github.davidnicolini.teampilot.domain.dto.response;

import java.math.BigDecimal;

public record MetaResponse(
        String rcaNome,
        BigDecimal metaMensal,
        BigDecimal valorFaturado,
        BigDecimal percentualAtingido
) {
}
