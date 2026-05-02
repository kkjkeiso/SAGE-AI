package com.sageai.dto;

import com.sageai.entity.ChatSession;
import java.time.LocalDateTime;

public record ChatSessionDTO(
        Long id,
        String title,
        LocalDateTime updatedAt
) {
    public static ChatSessionDTO fromEntity(ChatSession session) {
        return new ChatSessionDTO(session.getId(), session.getTitle(), session.getUpdatedAt());
    }
}
