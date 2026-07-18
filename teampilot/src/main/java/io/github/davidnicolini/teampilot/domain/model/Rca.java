package io.github.davidnicolini.teampilot.domain.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "rcas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(nullable = false)
    private String nome;

    private String telefone;

    // Meta comercial do mes vigente. Obs isso é para ser uma
    // entidade propria (MetaMensal) para manter historico mes a mes;
    // mas vou simplificar para o MVP.
    @Column(name = "meta_mensal", precision = 14, scale = 2)
    private BigDecimal metaMensal;
}

