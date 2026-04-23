package com.sageai.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(
        Long sessionId,
        @NotBlank String message
) {}
