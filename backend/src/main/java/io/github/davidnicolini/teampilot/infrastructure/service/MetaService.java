package io.github.davidnicolini.teampilot.infrastructure.service;


import io.github.davidnicolini.teampilot.domain.model.Rca;
import io.github.davidnicolini.teampilot.domain.dto.response.MetaResponse;
import io.github.davidnicolini.teampilot.exception.ResourceNotFoundException;
import io.github.davidnicolini.teampilot.infrastructure.repository.OrcamentoRepository;
import io.github.davidnicolini.teampilot.infrastructure.repository.RcaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;

@Service
@RequiredArgsConstructor
public class MetaService {

    private final RcaRepository rcaRepository;
    private final OrcamentoRepository orcamentoRepository;

    /**
     * Calcula o percentual da meta mensal atingido por um RCA, com base
     * no total faturado (orcamentos FECHADOS) dentro do mes corrente.
     *
     * Regra de negocio original da planilha: % Atingido = Faturado / Meta.
     * Tratamos meta zerada/nula separadamente para nao gerar divisao por zero.
     */
    public MetaResponse calcularPercentualMeta(Long rcaId, YearMonth mesReferencia) {
        Rca rca = rcaRepository.findById(rcaId)
                .orElseThrow(() -> new ResourceNotFoundException("RCA nao encontrado: " + rcaId));

        LocalDateTime inicioMes = mesReferencia.atDay(1).atStartOfDay();
        LocalDateTime fimMes = mesReferencia.atEndOfMonth().atTime(23, 59, 59);

        BigDecimal faturado = orcamentoRepository.somarFaturadoPorRcaNoPeriodo(rcaId, inicioMes, fimMes);
        BigDecimal meta = rca.getMetaMensal();

        BigDecimal percentual = calcularPercentual(faturado, meta);

        return new MetaResponse(rca.getNome(), meta, faturado, percentual);
    }

    private BigDecimal calcularPercentual(BigDecimal faturado, BigDecimal meta) {
        if (meta == null || meta.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return faturado
                .divide(meta, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }
}

