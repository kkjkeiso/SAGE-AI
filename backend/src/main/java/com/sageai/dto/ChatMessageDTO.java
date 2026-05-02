package com.sageai.dto;

import com.sageai.entity.ChatMessage;
import java.time.LocalDateTime;

public record ChatMessageDTO(
        Long id,
        String role,
        String content,
        LocalDateTime createdAt
) {
    public static ChatMessageDTO fromEntity(ChatMessage message) {
        return new ChatMessageDTO(
                message.getId(),
                message.getRole(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
