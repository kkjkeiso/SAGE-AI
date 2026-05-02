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
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;

@Service
public class GroqService {

    private static final Logger log = LoggerFactory.getLogger(GroqService.class);

    /* Prompt do sistema — define o comportamento pedagógico da SAGE AI */
    private static final String SYSTEM_PROMPT = """
            Você é SAGE AI (Specialized AI for General Education and Accessibility Integration), \
            um tutor educacional inteligente criado para ajudar estudantes de todos os níveis.
            
            REGRAS DE COMPORTAMENTO:
            1. Sempre responda em português brasileiro.
            2. Explique conceitos de forma clara, passo a passo, como um professor paciente.
            3. Use analogias do cotidiano para simplificar ideias complexas.
            4. Estruture respostas longas com tópicos e subtópicos.
            5. Quando apropriado, inclua um exemplo prático resolvido.
            6. Ao final de explicações, sugira 1-2 exercícios de fixação para o aluno praticar.
            7. Adapte a complexidade ao nível aparente do estudante.
            8. Nunca invente informações — se não souber, diga que não sabe.
            9. Seja encorajador: elogie o esforço e incentive a curiosidade.
            10. Formate suas respostas em HTML simples (use <br>, <b>, <i>, <ul>, <li>) para exibição no chat.
            
            EXEMPLO DE ESTRUTURA IDEAL:
            - Comece com uma explicação objetiva do conceito
            - Dê um exemplo prático
            - Finalize com um exercício ou pergunta para reflexão
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
        return chat(userMessage, null);
    }

    public String chat(String userMessage, String base64Image) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GROQ_API_KEY não configurada. Retornando resposta mock.");
            return getMockResponse(userMessage);
        }

        try {
            String currentModel = model;
            Object content;

            if (base64Image != null && !base64Image.isBlank()) {
                currentModel = "meta-llama/llama-4-scout-17b-16e-instruct";
                content = List.of(
                        Map.of("type", "text", "text", userMessage != null && !userMessage.isBlank() ? userMessage : "O que tem nesta imagem?"),
                        Map.of("type", "image_url", "image_url", Map.of("url", base64Image))
                );
            } else {
                content = userMessage;
            }

            Map<String, Object> requestBody = Map.of(
                    "model", currentModel,
                    "messages", List.of(
                            Map.of("role", "system", "content", SYSTEM_PROMPT),
                            Map.of("role", "user", "content", content)
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

        } catch (org.springframework.web.client.RestClientResponseException e) {
            log.error("Groq API Http Error: {}", e.getResponseBodyAsString(), e);
            return "⚠️ <i>Erro Groq API: " + e.getResponseBodyAsString() + "</i>";
        } catch (Exception e) {
            log.error("Erro ao chamar Groq API: {}", e.getMessage(), e);
            return "⚠️ <i>Erro ao processar sua solicitação: " + e.getMessage() + "</i>";
        }
    }

    /** Resposta quando a API key não está configurada */
    private String getMockResponse(String userMessage) {
        return "⚠️ <b>API key not found.</b><br><br>" +
               "Configure a variável <code>GROQ_API_KEY</code> e reinicie o servidor.";
    }

    public String transcribeAudio(MultipartFile file) {
        if (apiKey == null || apiKey.isBlank()) {
            return "Modo de demonstração: Áudio recebido, mas chave API não configurada.";
        }
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "audio.webm";
                }
            };
            
            body.add("file", fileResource);
            body.add("model", "whisper-large-v3");
            body.add("response_format", "json");
            body.add("language", "pt");

            String responseJson = restClient.post()
                    .uri("https://api.groq.com/openai/v1/audio/transcriptions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseJson);
            return root.path("text").asText();
        } catch (Exception e) {
            log.error("Erro ao transcrever áudio com Groq Whisper: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao processar o áudio.");
        }
    }
}
