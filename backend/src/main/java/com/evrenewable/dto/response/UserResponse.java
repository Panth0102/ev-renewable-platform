package com.evrenewable.dto.response;

import com.evrenewable.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private UUID          id;
    private String        name;
    private String        email;
    private User.UserRole role;
    private String        organisation;
    private boolean       isActive;
    private boolean       emailVerified;
    private Instant       createdAt;

    public static UserResponse from(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .role(u.getRole())
                .organisation(u.getOrganisation())
                .isActive(u.isActive())
                .emailVerified(u.isEmailVerified())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
