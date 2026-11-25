package io.github.davidnicolini.teampilot.infrastructure.service;


import io.github.davidnicolini.teampilot.infrastructure.repository.OrcamentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RelatorioService {

    private final OrcamentoRepository orcamentoRepository;

    public List<Map<String, Object>> taxaConversaoPorRca(LocalDate inicio, LocalDate fim) {
        return orcamentoRepository.taxaConversaoPorRca(inicio, fim).stream()
                .map(linha -> {
                    String rcaNome = (String) linha[0];
                    long fechados = ((Number) linha[1]).longValue();
                    long perdidos = ((Number) linha[2]).longValue();
                    long totalDecidido = fechados + perdidos;

                    double taxaConversao = totalDecidido == 0
                            ? 0.0
                            : (fechados * 100.0) / totalDecidido;

                    return Map.<String, Object>of(
                            "rca", rcaNome,
                            "fechados", fechados,
                            "perdidos", perdidos,
                            "taxaConversaoPercentual", Math.round(taxaConversao * 100.0) / 100.0
                    );
                })
                .toList();
    }

    public List<Map<String, Object>> ticketMedioPorLinhaProduto() {
        return orcamentoRepository.ticketMedioPorLinhaProduto().stream()
                .map(linha -> Map.<String, Object>of(
                        "linhaProduto", linha[0],
                        "ticketMedio", (BigDecimal) linha[1]
                ))
                .toList();
    }
}

