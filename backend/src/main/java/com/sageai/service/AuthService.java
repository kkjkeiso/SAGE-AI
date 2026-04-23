package com.sageai.service;

import com.sageai.config.JwtUtil;
import com.sageai.dto.AuthResponse;
import com.sageai.dto.LoginRequest;
import com.sageai.dto.RegisterRequest;
import com.sageai.entity.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuthService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserService userService, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /** Registra um novo usuário e retorna o token JWT */
    public AuthResponse register(RegisterRequest request) {
        if (userService.existsByEmail(request.email())) {
            throw new IllegalArgumentException("E-mail já cadastrado");
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .build();

        user = userService.save(user);
        String token = jwtUtil.generateToken(user.getEmail());

        return new AuthResponse(token, userToMap(user));
    }

    /** Autentica o usuário e retorna o token JWT */
    public AuthResponse login(LoginRequest request) {
        User user = userService.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("E-mail ou senha incorretos"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("E-mail ou senha incorretos");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, userToMap(user));
    }

    /** Retorna dados do usuário pelo e-mail (usado no endpoint /me) */
    public Map<String, Object> getUserData(String email) {
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        return userToMap(user);
    }

    private Map<String, Object> userToMap(User user) {
        return Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail()
        );
    }
}
