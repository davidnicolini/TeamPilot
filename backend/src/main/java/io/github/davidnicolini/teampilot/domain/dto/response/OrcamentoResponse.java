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
        String observacao,
        LocalDate dataOrcamento,
        boolean vendaCasada,
        String rcaCodigo,
        String rcaNome,
        BigDecimal rcaMetaMensal,
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
                o.getObservacao(),
                o.getDataOrcamento(),
                o.isVendaCasada(),
                o.getRca().getCodigo(),
                o.getRca().getNome(),
                o.getRca().getMetaMensal(),
                o.getCliente().getRazaoSocial()
        );
    }
}
