package com.sageai.dto;

public record ChatRequest(
        Long sessionId,
        String message,
        String image
) {}
