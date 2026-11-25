package io.github.davidnicolini.teampilot.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "orcamentos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Orcamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numeroPedido;
    private String numeroNf;

    @Column(precision = 14, scale = 2, nullable = false)
    private BigDecimal valorTotal;

    @Column(precision = 5, scale = 2)
    private BigDecimal margemLucro;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusOrcamento status;

    @Enumerated(EnumType.STRING)
    private MotivoPerda motivoPerda;

    private String concorrente;

    @Column(columnDefinition = "TEXT")
    private String observacao;

    @Column(name = "modificado_manualmente", nullable = false)
    @Builder.Default
    private boolean modificadoManualmente = false;

    @Column(nullable = false)
    private LocalDate dataOrcamento;

    private LocalDateTime dataFechamento;

    @Column(name = "venda_casada")
    private boolean vendaCasada;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rca_id", nullable = false)
    private Rca rca;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linha_produto_id")
    private LinhaProduto linhaProduto;

    public void marcarComoPerdido(MotivoPerda motivo, String concorrente) {
        if (motivo == null) {
            throw new IllegalArgumentException("Motivo da perda e obrigatorio para marcar o orcamento como PERDIDO.");
        }
        this.status = StatusOrcamento.PERDIDO;
        this.motivoPerda = motivo;
        this.concorrente = concorrente;
        this.dataFechamento = LocalDateTime.now();
        this.modificadoManualmente = true;
    }

    public void marcarComoFechado() {
        this.status = StatusOrcamento.FECHADO;
        this.motivoPerda = null;
        this.dataFechamento = LocalDateTime.now();
        this.modificadoManualmente = true;
    }

    public void atualizarObservacao(String observacao) {
        this.observacao = (observacao != null && !observacao.isBlank()) ? observacao.trim() : null;
        this.modificadoManualmente = true;
    }
}
