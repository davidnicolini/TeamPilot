package io.github.davidnicolini.teampilot.infrastructure.repository;

import io.github.davidnicolini.teampilot.domain.model.Orcamento;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface OrcamentoRepository extends JpaRepository<Orcamento, Long> {

    @Override
    @EntityGraph(attributePaths = {"rca", "cliente"})
    List<Orcamento> findAll();

    @EntityGraph(attributePaths = {"rca", "cliente"})
    List<Orcamento> findByRcaId(Long rcaId);

    Optional<Orcamento> findFirstByNumeroPedidoAndClienteIdAndDataOrcamentoAndRcaId(
            String numeroPedido, Long clienteId, LocalDate dataOrcamento, Long rcaId);

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

    @Query("""
            SELECT o.rca.nome,
                   SUM(CASE WHEN o.status = io.github.davidnicolini.teampilot.domain.model.StatusOrcamento.FECHADO THEN 1 ELSE 0 END),
                   SUM(CASE WHEN o.status = io.github.davidnicolini.teampilot.domain.model.StatusOrcamento.PERDIDO THEN 1 ELSE 0 END)
            FROM Orcamento o
            WHERE o.dataOrcamento BETWEEN :inicio AND :fim
            GROUP BY o.rca.nome
            """)
    List<Object[]> taxaConversaoPorRca(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("""
            SELECT o.linhaProduto.departamento, AVG(o.valorTotal)
            FROM Orcamento o
            WHERE o.status = io.github.davidnicolini.teampilot.domain.model.StatusOrcamento.FECHADO
              AND o.linhaProduto IS NOT NULL
            GROUP BY o.linhaProduto.departamento
            """)
    List<Object[]> ticketMedioPorLinhaProduto();
}
