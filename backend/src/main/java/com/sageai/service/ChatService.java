package com.sageai.service;

import com.sageai.dto.ChatMessageDTO;
import com.sageai.dto.ChatSessionDTO;
import com.sageai.entity.ChatMessage;
import com.sageai.entity.ChatSession;
import com.sageai.repository.ChatMessageRepository;
import com.sageai.repository.ChatSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final GroqService groqService;

    public ChatService(ChatSessionRepository chatSessionRepository, ChatMessageRepository chatMessageRepository, GroqService groqService) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.groqService = groqService;
    }

    public List<ChatSessionDTO> getUserSessions(Long userId) {
        return chatSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(ChatSessionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ChatMessageDTO> getSessionMessages(Long sessionId, Long userId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Sessão não encontrada"));
        
        if (!session.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Acesso negado à sessão");
        }

        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(ChatMessageDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public Long processMessage(Long userId, Long sessionId, String userMessage) {
        ChatSession session;

        if (sessionId == null) {
            // Nova sessão
            session = new ChatSession();
            session.setUserId(userId);
            // Título baseado nas primeiras palavras da mensagem do usuário
            String title = userMessage.length() > 30 ? userMessage.substring(0, 30) + "..." : userMessage;
            session.setTitle(title);
            session = chatSessionRepository.save(session);
        } else {
            session = chatSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new IllegalArgumentException("Sessão não encontrada"));
            if (!session.getUserId().equals(userId)) {
                throw new IllegalArgumentException("Acesso negado à sessão");
            }
            // Atualiza o timestamp
            session = chatSessionRepository.save(session);
        }

        // Salvar mensagem do usuário
        ChatMessage userMsgEntity = new ChatMessage();
        userMsgEntity.setSession(session);
        userMsgEntity.setRole("user");
        userMsgEntity.setContent(userMessage);
        chatMessageRepository.save(userMsgEntity);

        // Chamar a IA (aqui idealmente passaríamos o histórico para ter contexto, mas vamos manter simples por agora)
        String botReply = groqService.chat(userMessage);

        // Salvar resposta do bot
        ChatMessage botMsgEntity = new ChatMessage();
        botMsgEntity.setSession(session);
        botMsgEntity.setRole("bot");
        botMsgEntity.setContent(botReply);
        chatMessageRepository.save(botMsgEntity);

        return session.getId();
    }
}
