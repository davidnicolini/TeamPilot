package io.github.davidnicolini.teampilot.domain.dto.response;


import io.github.davidnicolini.teampilot.domain.model.MotivoPerda;
import io.github.davidnicolini.teampilot.domain.model.Orcamento;
import io.github.davidnicolini.teampilot.domain.model.StatusOrcamento;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OrcamentoResponse(
        Long id,
        String numeroPedido,
        BigDecimal valorTotal,
        BigDecimal margemLucro,
        StatusOrcamento status,
        MotivoPerda motivoPerda,
        String concorrente,
        LocalDate dataOrcamento,
        boolean vendaCasada,
        String rcaNome,
        String clienteRazaoSocial
) {
    public static OrcamentoResponse fromEntity(Orcamento o) {
        return new OrcamentoResponse(
                o.getId(),
                o.getNumeroPedido(),
                o.getValorTotal(),
                o.getMargemLucro(),
                o.getStatus(),
                o.getMotivoPerda(),
                o.getConcorrente(),
                o.getDataOrcamento(),
                o.isVendaCasada(),
                o.getRca().getNome(),
                o.getCliente().getRazaoSocial()
        );
    }
}

