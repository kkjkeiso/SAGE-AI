package com.sageai.controller;

import com.sageai.dto.ChatMessageDTO;
import com.sageai.dto.ChatRequest;
import com.sageai.dto.ChatResponse;
import com.sageai.dto.ChatSessionDTO;
import com.sageai.entity.User;
import com.sageai.repository.UserRepository;
import com.sageai.service.ChatService;
import com.sageai.service.GroqService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final GroqService groqService;
    private final UserRepository userRepository;

    public ChatController(ChatService chatService, GroqService groqService, UserRepository userRepository) {
        this.chatService = chatService;
        this.groqService = groqService;
        this.userRepository = userRepository;
    }

    private Long getUserId(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) return null;
        String email = (String) auth.getPrincipal();
        return userRepository.findByEmail(email).map(User::getId).orElse(null);
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getSessions(Authentication auth) {
        Long userId = getUserId(auth);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Não autenticado"));
        List<ChatSessionDTO> sessions = chatService.getUserSessions(userId);
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/sessions/{id}/messages")
    public ResponseEntity<?> getSessionMessages(@PathVariable Long id, Authentication auth) {
        Long userId = getUserId(auth);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Não autenticado"));
        try {
            List<ChatMessageDTO> messages = chatService.getSessionMessages(id, userId);
            return ResponseEntity.ok(messages);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> chat(@Valid @RequestBody ChatRequest request, Authentication auth) {
        Long userId = getUserId(auth);
        
        // Se usuário não estiver logado (Guest), apenas chama a IA sem persistir
        if (userId == null) {
            String reply = groqService.chat(request.message());
            return ResponseEntity.ok(new ChatResponse(null, reply));
        }

        // Se logado, passa pelo serviço que gerencia histórico
        try {
            Long sessionId = chatService.processMessage(userId, request.sessionId(), request.message());
            // A resposta do bot já foi gerada e salva no banco de dados durante o processMessage.
            // Precisamos retornar a última mensagem salva (ou buscar de forma mais limpa).
            // Para não refatorar muito, vou buscar a última mensagem da sessão no ChatService.
            List<ChatMessageDTO> messages = chatService.getSessionMessages(sessionId, userId);
            String lastBotReply = messages.get(messages.size() - 1).content();
            
            return ResponseEntity.ok(new ChatResponse(sessionId, lastBotReply));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
