package io.github.davidnicolini.teampilot.service;


import io.github.davidnicolini.teampilot.domain.model.MotivoPerda;
import io.github.davidnicolini.teampilot.domain.model.Orcamento;
import io.github.davidnicolini.teampilot.domain.model.StatusOrcamento;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OrcamentoDomainTest {

    @Test
    void naoDevePermitirMarcarComoPerdidoSemMotivo() {
        Orcamento orcamento = Orcamento.builder()
                .valorTotal(new BigDecimal("1000.00"))
                .status(StatusOrcamento.EM_NEGOCIACAO)
                .dataOrcamento(LocalDate.now())
                .build();

        assertThatThrownBy(() -> orcamento.marcarComoPerdido(null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Motivo da perda e obrigatorio");
    }

    @Test
    void devePermitirMarcarComoPerdidoComMotivoValido() {
        Orcamento orcamento = Orcamento.builder()
                .valorTotal(new BigDecimal("1000.00"))
                .status(StatusOrcamento.EM_NEGOCIACAO)
                .dataOrcamento(LocalDate.now())
                .build();

        orcamento.marcarComoPerdido(MotivoPerda.PRECO, "CONDOR");

        assertThat(orcamento.getStatus()).isEqualTo(StatusOrcamento.PERDIDO);
        assertThat(orcamento.getMotivoPerda()).isEqualTo(MotivoPerda.PRECO);
        assertThat(orcamento.getConcorrente()).isEqualTo("CONDOR");
        assertThat(orcamento.getDataFechamento()).isNotNull();
    }

    @Test
    void deveLimparMotivoDePerdaAoFechar() {
        Orcamento orcamento = Orcamento.builder()
                .valorTotal(new BigDecimal("1000.00"))
                .status(StatusOrcamento.EM_NEGOCIACAO)
                .dataOrcamento(LocalDate.now())
                .build();

        orcamento.marcarComoFechado();

        assertThat(orcamento.getStatus()).isEqualTo(StatusOrcamento.FECHADO);
        assertThat(orcamento.getMotivoPerda()).isNull();
    }
}

