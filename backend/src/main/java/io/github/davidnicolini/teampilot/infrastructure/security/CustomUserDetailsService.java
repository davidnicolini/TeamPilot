package io.github.davidnicolini.teampilot.infrastructure.security;


import io.github.davidnicolini.teampilot.domain.model.Usuario;
import io.github.davidnicolini.teampilot.infrastructure.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;

import org.jspecify.annotations.Nullable;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsPasswordService;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService, UserDetailsPasswordService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String login) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByLogin(login)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario nao encontrado: " + login));

        return new User(
                usuario.getLogin(),
                usuario.getSenha(),
                java.util.List.of(new SimpleGrantedAuthority(usuario.getRole().name()))
        );
    }

    @Override
public UserDetails updatePassword(UserDetails user, String newPassword) {
    Usuario usuario = usuarioRepository.findByLogin(user.getUsername())
            .orElseThrow(() -> new UsernameNotFoundException("Usuario nao encontrado: " + user.getUsername()));

    usuario.setPassword(newPassword);
    usuarioRepository.save(usuario);

    return User.builder()
            .username(usuario.getLogin())
            .password(newPassword)
            .authorities(user.getAuthorities())
            .build();
}
}

