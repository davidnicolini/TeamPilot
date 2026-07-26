package io.github.davidnicolini.teampilot.domain.dto.response;

public record LoginResponse(String token, String tipo) {
    public LoginResponse(String token) {
        this(token, "Bearer");
    }
}
