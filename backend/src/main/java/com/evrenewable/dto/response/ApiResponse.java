package com.evrenewable.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic wrapper for simple success / message responses.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ApiResponse {
    private boolean success;
    private String  message;

    public static ApiResponse ok(String message) {
        return ApiResponse.builder().success(true).message(message).build();
    }

    public static ApiResponse error(String message) {
        return ApiResponse.builder().success(false).message(message).build();
    }
}
