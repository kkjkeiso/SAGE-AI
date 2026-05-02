package com.sageai.controller;

import com.sageai.dto.UpdateProfileRequest;
import com.sageai.entity.User;
import com.sageai.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/* Controlador de perfil do usuário */
@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /* Atualiza nome, username e/ou foto de perfil */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest request, Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Não autenticado"));
        }
        String email = (String) authentication.getPrincipal();
        Optional<User> userOptional = userService.findByEmail(email);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Usuário não encontrado"));
        }

        User user = userOptional.get();

        /* Atualiza nome de exibição se fornecido */
        if (request.displayName() != null && !request.displayName().isBlank()) {
            user.setDisplayName(request.displayName().trim());
        }

        /* Atualiza username se fornecido e diferente */
        if (request.username() != null && !request.username().equals(user.getUsername())) {
            if (userService.existsByUsername(request.username())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Nome de usuário já está em uso"));
            }
            user.setUsername(request.username());
        }

        /* Atualiza foto de perfil se fornecida */
        if (request.profilePictureUrl() != null) {
            user.setProfilePictureUrl(request.profilePictureUrl());
        }

        userService.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Perfil atualizado com sucesso",
                "name", user.getName(),
                "displayName", user.getDisplayName() != null ? user.getDisplayName() : user.getName(),
                "username", user.getUsername(),
                "profilePictureUrl", user.getProfilePictureUrl() != null ? user.getProfilePictureUrl() : ""
        ));
    }
}
