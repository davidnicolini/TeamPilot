package io.github.davidnicolini.teampilot.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "linhas_produto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LinhaProduto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String departamento; 

    private String marca; 
}