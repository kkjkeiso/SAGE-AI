package com.sageai.dto;

import jakarta.validation.constraints.Size;

/* DTO para atualização de perfil: nome, username e foto */
public record UpdateProfileRequest(
        @Size(min = 2, max = 100) String displayName,
        @Size(min = 3, max = 50) String username,
        String profilePictureUrl
) {}
