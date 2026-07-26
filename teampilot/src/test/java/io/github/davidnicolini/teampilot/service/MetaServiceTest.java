package io.github.davidnicolini.teampilot.service;



import io.github.davidnicolini.teampilot.domain.model.Rca;
import io.github.davidnicolini.teampilot.domain.dto.response.MetaResponse;
import io.github.davidnicolini.teampilot.infrastructure.repository.OrcamentoRepository;
import io.github.davidnicolini.teampilot.infrastructure.repository.RcaRepository;
import io.github.davidnicolini.teampilot.infrastructure.service.MetaService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MetaServiceTest {

    @Mock
    private RcaRepository rcaRepository;

    @Mock
    private OrcamentoRepository orcamentoRepository;

    @InjectMocks
    private MetaService metaService;

    @Test
    void deveCalcularPercentualDeMetaCorretamente() {
        Rca rca = Rca.builder()
                .id(1L)
                .nome("Joao da Silva")
                .metaMensal(new BigDecimal("100000.00"))
                .build();

        when(rcaRepository.findById(1L)).thenReturn(Optional.of(rca));
        when(orcamentoRepository.somarFaturadoPorRcaNoPeriodo(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("75000.00"));

        MetaResponse resultado = metaService.calcularPercentualMeta(1L, YearMonth.of(2026, 7));

        assertThat(resultado.percentualAtingido()).isEqualByComparingTo("75.00");
        assertThat(resultado.rcaNome()).isEqualTo("Joao da Silva");
    }

    @Test
    void deveRetornarZeroQuandoMetaNaoEstiverDefinida() {
        Rca rca = Rca.builder()
                .id(2L)
                .nome("Maria Souza")
                .metaMensal(null)
                .build();

        when(rcaRepository.findById(2L)).thenReturn(Optional.of(rca));
        when(orcamentoRepository.somarFaturadoPorRcaNoPeriodo(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("50000.00"));

        MetaResponse resultado = metaService.calcularPercentualMeta(2L, YearMonth.of(2026, 7));

        assertThat(resultado.percentualAtingido()).isEqualByComparingTo("0");
    }

    @Test
    void deveCalcularPercentualAcimaDeCemQuandoMetaForSuperada() {
        Rca rca = Rca.builder()
                .id(3L)
                .nome("Carlos Pereira")
                .metaMensal(new BigDecimal("50000.00"))
                .build();

        when(rcaRepository.findById(3L)).thenReturn(Optional.of(rca));
        when(orcamentoRepository.somarFaturadoPorRcaNoPeriodo(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("60000.00"));

        MetaResponse resultado = metaService.calcularPercentualMeta(3L, YearMonth.of(2026, 7));

        assertThat(resultado.percentualAtingido()).isEqualByComparingTo("120.00");
    }
}

