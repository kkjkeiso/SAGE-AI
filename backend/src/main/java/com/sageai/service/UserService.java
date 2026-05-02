package com.sageai.service;

import com.sageai.entity.User;
import com.sageai.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public String generateUniqueUsername(String baseName) {
        // Convert base name to lowercase, replace spaces with underscores, and keep only alphanumeric chars
        String baseUsername = baseName.toLowerCase().replaceAll("[^a-z0-9]", "");
        if (baseUsername.isEmpty()) {
            baseUsername = "user";
        }
        
        String username = baseUsername;
        int counter = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + counter;
            counter++;
        }
        return username;
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }
}
