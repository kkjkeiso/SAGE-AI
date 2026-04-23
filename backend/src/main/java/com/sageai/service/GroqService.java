package com.sageai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class GroqService {

    private static final Logger log = LoggerFactory.getLogger(GroqService.class);

    private static final String SYSTEM_PROMPT = """
            Você é SAGE AI (Specialized AI for General Education and Accessibility Integration), \
            um assistente educacional inteligente criado para ajudar estudantes. \
            Você explica conceitos de forma clara, didática e acessível. \
            Sempre que possível, use exemplos práticos e analogias simples. \
            Adapte suas respostas ao nível do estudante. \
            Responda sempre em português brasileiro. \
            Seja conciso mas completo. Quando apropriado, sugira exercícios de fixação ao final. \
            Nunca invente informações — se não souber, diga que não sabe. \
            Formate suas respostas em HTML simples (use <br>, <b>, <i>, <ul>, <li>) para exibição no chat.
            """;

    private final String apiKey;
    private final String apiUrl;
    private final String model;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GroqService(
            @Value("${groq.api.key}") String apiKey,
            @Value("${groq.api.url}") String apiUrl,
            @Value("${groq.api.model}") String model
    ) {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.model = model;
        this.restClient = RestClient.create();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Envia uma mensagem do usuário para a API do Groq e retorna a resposta.
     * Se a API key não estiver configurada, retorna um fallback mock.
     */
    public String chat(String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GROQ_API_KEY não configurada. Retornando resposta mock.");
            return getMockResponse(userMessage);
        }

        try {
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content", SYSTEM_PROMPT),
                            Map.of("role", "user", "content", userMessage)
                    ),
                    "temperature", 0.7,
                    "max_tokens", 2048
            );

            String responseJson = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(objectMapper.writeValueAsString(requestBody))
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseJson);
            return root.path("choices").get(0).path("message").path("content").asText();

        } catch (Exception e) {
            log.error("Erro ao chamar Groq API: {}", e.getMessage(), e);
            return "⚠️ <i>Erro ao processar sua solicitação. Tente novamente em instantes.</i>";
        }
    }

    /** Resposta mock para quando a API key não está configurada */
    private String getMockResponse(String userMessage) {
        return """
                <b>SAGE AI</b> — Modo de demonstração<br><br>
                A chave da API Groq (<code>GROQ_API_KEY</code>) ainda não foi configurada. \
                Quando configurada, eu responderei sua pergunta usando inteligência artificial real.<br><br>
                <i>Sua mensagem foi:</i> "%s"<br><br>
                Para ativar, defina a variável de ambiente <code>GROQ_API_KEY</code> e reinicie o servidor.
                """.formatted(userMessage);
    }
}
