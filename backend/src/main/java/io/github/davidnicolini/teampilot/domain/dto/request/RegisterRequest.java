package io.github.davidnicolini.teampilot.domain.dto.request;

import io.github.davidnicolini.teampilot.domain.model.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record RegisterRequest(
        @NotBlank String login,
        @NotBlank String senha,
        @NotNull Role role,
        String codigoRca,
        String nomeRca,
        String telefoneRca,
        BigDecimal metaMensal
) {}
