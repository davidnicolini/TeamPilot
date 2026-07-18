package io.github.davidnicolini.teampilot.infrastructure.repository;


import io.github.davidnicolini.teampilot.domain.model.Orcamento;
import io.github.davidnicolini.teampilot.domain.model.StatusOrcamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface OrcamentoRepository extends JpaRepository<Orcamento, Long> {

    List<Orcamento> findByRcaId(Long rcaId);

    /**
     * Soma o valor total de orcamentos FECHADOS de um RCA dentro de um periodo.
     * Usada para calcular o percentual de meta atingida.
     */
    @Query("""
            SELECT COALESCE(SUM(o.valorTotal), 0)
            FROM Orcamento o
            WHERE o.rca.id = :rcaId
              AND o.status = io.github.davidnicolini.teampilot.domain.model.StatusOrcamento.FECHADO
              AND o.dataFechamento BETWEEN :inicio AND :fim
            """)
    BigDecimal somarFaturadoPorRcaNoPeriodo(@Param("rcaId") Long rcaId,
                                             @Param("inicio") java.time.LocalDateTime inicio,
                                             @Param("fim") java.time.LocalDateTime fim);

    /**
     * Taxa de conversao (fechados vs. total decidido) por RCA em um periodo.
     * Retorna [rcaNome, totalFechados, totalPerdidos].
     */
    @Query("""
            SELECT o.rca.nome,
                   SUM(CASE WHEN o.status = io.github.davidnicolini.teampilot.domain.model.StatusOrcamento.FECHADO THEN 1 ELSE 0 END),
                   SUM(CASE WHEN o.status = io.github.davidnicolini.teampilot.domain.model.StatusOrcamento.PERDIDO THEN 1 ELSE 0 END)
            FROM Orcamento o
            WHERE o.dataOrcamento BETWEEN :inicio AND :fim
            GROUP BY o.rca.nome
            """)
    List<Object[]> taxaConversaoPorRca(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    /**
     * Ticket medio dos orcamentos fechados por linha de produto.
     */
    @Query("""
            SELECT o.linhaProduto.nome, AVG(o.valorTotal)
            FROM Orcamento o
            WHERE o.status = io.github.davidnicolini.teampilot.domain.model.StatusOrcamento.FECHADO
            GROUP BY o.linhaProduto.nome
            """)
    List<Object[]> ticketMedioPorLinhaProduto();
}

