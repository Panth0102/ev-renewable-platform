package com.evrenewable.service;

import com.evrenewable.dto.request.LoginRequest;
import com.evrenewable.dto.request.RefreshTokenRequest;
import com.evrenewable.dto.request.RegisterRequest;
import com.evrenewable.dto.request.UpdateProfileRequest;
import com.evrenewable.dto.response.AuthResponse;
import com.evrenewable.dto.response.UserResponse;
import com.evrenewable.exception.ConflictException;
import com.evrenewable.exception.ResourceNotFoundException;
import com.evrenewable.exception.UnauthorizedException;
import com.evrenewable.model.RefreshToken;
import com.evrenewable.model.User;
import com.evrenewable.repository.RefreshTokenRepository;
import com.evrenewable.repository.UserRepository;
import com.evrenewable.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository         userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder        passwordEncoder;
    private final AuthenticationManager  authManager;
    private final JwtUtil                jwtUtil;
    private final AuditLogService        auditLogService;

    @Value("${jwt.expiration-ms}")
    private long accessTokenExpiryMs;

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshTokenExpiryMs;

    // ── Register ─────────────────────────────────────────────
    @Transactional
    public UserResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ConflictException("Email already registered: " + req.getEmail());
        }
        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(req.getRole() != null ? req.getRole() : User.UserRole.DRIVER)
                .organisation(req.getOrganisation())
                .phone(req.getPhone())
                .isActive(true)
                .emailVerified(false)
                .build();
        user = userRepository.save(user);
        log.info("Registered new user: {} ({})", user.getEmail(), user.getRole());

        auditLogService.record(user.getId(), "USER_REGISTER", "User",
                user.getId().toString(),
                "{\"email\":\"" + user.getEmail() + "\",\"role\":\"" + user.getRole() + "\"}");

        return UserResponse.from(user);
    }

    // ── Login ────────────────────────────────────────────────
    @Transactional
    public AuthResponse login(LoginRequest req) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        req.getEmail().toLowerCase(), req.getPassword()));

        UserDetails principal = (UserDetails) auth.getPrincipal();
        User user = userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", req.getEmail()));

        // Update last login
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String accessToken  = jwtUtil.generateAccessToken(principal);
        String refreshToken = jwtUtil.generateRefreshToken(principal);

        storeRefreshToken(user, refreshToken);

        log.info("User logged in: {}", user.getEmail());

        auditLogService.record(user.getId(), "USER_LOGIN", "User",
                user.getId().toString(),
                "{\"email\":\"" + user.getEmail() + "\"}");

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(accessTokenExpiryMs / 1000)
                .user(UserResponse.from(user))
                .build();
    }

    // ── Refresh ──────────────────────────────────────────────
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest req) {
        String hash = hashToken(req.getRefreshToken());
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (stored.isRevoked()) {
            throw new UnauthorizedException("Refresh token has been revoked");
        }
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token has expired");
        }

        User user = stored.getUser();
        UserDetails principal = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities("ROLE_" + user.getRole().name())
                .build();

        String newAccess  = jwtUtil.generateAccessToken(principal);
        String newRefresh = jwtUtil.generateRefreshToken(principal);

        // Revoke old, store new (rotation)
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);
        storeRefreshToken(user, newRefresh);

        auditLogService.record(user.getId(), "TOKEN_REFRESH", "User",
                user.getId().toString(), null);

        return AuthResponse.builder()
                .accessToken(newAccess)
                .refreshToken(newRefresh)
                .tokenType("Bearer")
                .expiresIn(accessTokenExpiryMs / 1000)
                .user(UserResponse.from(user))
                .build();
    }

    // ── Update profile ───────────────────────────────────────
    @Transactional
    public UserResponse updateProfile(String currentEmail, UpdateProfileRequest req) {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", currentEmail));

        // Only update fields that were provided (non-null)
        if (req.getName() != null && !req.getName().isBlank()) {
            user.setName(req.getName().trim());
        }
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            String newEmail = req.getEmail().toLowerCase().trim();
            if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new ConflictException("Email already in use: " + newEmail);
            }
            user.setEmail(newEmail);
        }
        if (req.getOrganisation() != null) {
            user.setOrganisation(req.getOrganisation().trim());
        }
        if (req.getPhone() != null) {
            user.setPhone(req.getPhone().trim());
        }

        user = userRepository.save(user);
        log.info("Profile updated for: {}", user.getEmail());

        auditLogService.record(user.getId(), "PROFILE_UPDATE", "User",
                user.getId().toString(), "{\"email\":\"" + user.getEmail() + "\"}");

        return UserResponse.from(user);
    }

    // ── Logout ───────────────────────────────────────────────
    @Transactional
    public void logout(String email) {
        userRepository.findByEmail(email).ifPresent(u -> {
            refreshTokenRepository.revokeAllByUserId(u.getId());
            auditLogService.record(u.getId(), "USER_LOGOUT", "User",
                    u.getId().toString(), null);
        });
        log.info("User logged out: {}", email);
    }

    // ── Helpers ──────────────────────────────────────────────
    private void storeRefreshToken(User user, String rawToken) {
        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .tokenHash(hashToken(rawToken))
                .expiresAt(Instant.now().plusMillis(refreshTokenExpiryMs))
                .revoked(false)
                .build();
        refreshTokenRepository.save(rt);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
