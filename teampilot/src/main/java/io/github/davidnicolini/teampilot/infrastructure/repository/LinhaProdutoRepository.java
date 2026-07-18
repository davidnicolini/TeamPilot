package io.github.davidnicolini.teampilot.infrastructure.repository;

import io.github.davidnicolini.teampilot.domain.model.LinhaProduto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LinhaProdutoRepository extends JpaRepository<LinhaProduto, Long> {
}
