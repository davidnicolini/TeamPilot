package io.github.davidnicolini.teampilot.domain.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OrcamentoRequest(
        String numeroPedido,
        @NotNull @Positive BigDecimal valorTotal,
        BigDecimal margemLucro,
        @NotNull LocalDate dataOrcamento,
        boolean vendaCasada,
        @NotNull Long clienteId,
        Long linhaProdutoId
) {
}
