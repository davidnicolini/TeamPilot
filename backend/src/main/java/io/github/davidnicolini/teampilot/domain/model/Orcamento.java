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

    // Margem de lucro percentual (Luc%)
    @Column(precision = 5, scale = 2)
    private BigDecimal margemLucro;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusOrcamento status;

    @Enumerated(EnumType.STRING)
    private MotivoPerda motivoPerda;

    // Nome do concorrente para quem o orcamento foi perdido.
    // Alimenta o relatorio de "perdas por concorrente", usado pela supervisao
    // para negociar preco/condicao em regioes onde um concorrente especifico domina.
    private String concorrente;

    @Column(nullable = false)
    private LocalDate dataOrcamento;

    private LocalDateTime dataFechamento;

    // Indica se este orcamento faz parte de uma negociacao de venda casada(venda direta com fornecedores).
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

    /**
     * Regra de negocio: um orcamento so pode ser marcado como PERDIDO
     * se um motivo for informado. Mantive a regra na propria entidade
     * para proteger um invariante do dominio, independente de quem chama.
     */
    public void marcarComoPerdido(MotivoPerda motivo, String concorrente) {
        if (motivo == null) {
            throw new IllegalArgumentException("Motivo da perda e obrigatorio para marcar o orcamento como PERDIDO.");
        }
        this.status = StatusOrcamento.PERDIDO;
        this.motivoPerda = motivo;
        this.concorrente = concorrente;
        this.dataFechamento = LocalDateTime.now();
    }

    public void marcarComoFechado() {
        this.status = StatusOrcamento.FECHADO;
        this.motivoPerda = null;
        this.dataFechamento = LocalDateTime.now();
    }
}  

