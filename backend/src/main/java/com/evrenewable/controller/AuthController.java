package com.evrenewable.controller;

import com.evrenewable.dto.request.LoginRequest;
import com.evrenewable.dto.request.RefreshTokenRequest;
import com.evrenewable.dto.request.RegisterRequest;
import com.evrenewable.dto.request.UpdateProfileRequest;
import com.evrenewable.dto.response.ApiResponse;
import com.evrenewable.dto.response.AuthResponse;
import com.evrenewable.dto.response.UserResponse;
import com.evrenewable.exception.ResourceNotFoundException;
import com.evrenewable.repository.UserRepository;
import com.evrenewable.service.AuthService;
import com.evrenewable.util.AppConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping(AppConstants.AUTH_PREFIX)
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, token refresh and logout")
public class AuthController {

    private final AuthService    authService;
    private final UserRepository userRepository;

    @Operation(summary = "Register a new user")
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @Operation(summary = "Login and receive JWT tokens")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @Operation(summary = "Refresh access token using a valid refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest req) {
        return ResponseEntity.ok(authService.refresh(req));
    }

    @Operation(summary = "Logout — revokes all refresh tokens for the current user")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(@AuthenticationPrincipal UserDetails user) {
        authService.logout(user.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully"));
    }

    @Operation(summary = "Get the currently authenticated user's profile")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(
                UserResponse.from(
                        userRepository.findByEmail(principal.getUsername())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                        "User", "email", principal.getUsername()))));
    }

    @Operation(summary = "Update the current user's profile (name, email, organisation, phone)")
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMe(
            @Valid @RequestBody UpdateProfileRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(authService.updateProfile(principal.getUsername(), req));
    }
}
