package com.evrenewable.config;

import com.evrenewable.security.JwtAuthEntryPoint;
import com.evrenewable.security.JwtAuthFilter;
import com.evrenewable.security.UserDetailsServiceImpl;
import com.evrenewable.util.AppConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthFilter          jwtAuthFilter;
    private final JwtAuthEntryPoint      entryPoint;

    // ── Public POST endpoints (no token required) ────────────
    private static final String[] PUBLIC_POST = {
            AppConstants.AUTH_PREFIX + "/login",
            AppConstants.AUTH_PREFIX + "/register",
            AppConstants.AUTH_PREFIX + "/refresh"
    };

    // ── Public GET endpoints (no token required) ─────────────
    private static final String[] PUBLIC_GET = {
            "/swagger-ui.html",
            "/swagger-ui/**",
            "/api-docs/**",
            "/actuator/health"
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            // Let Spring MVC's CorsConfig handle CORS; Spring Security must not block preflight
            .cors()
            .and()
            .exceptionHandling()
                .authenticationEntryPoint(entryPoint)
            .and()
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeRequests()
                // Permit CORS preflight for all endpoints
                .antMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Auth endpoints open to all
                .antMatchers(HttpMethod.POST, PUBLIC_POST).permitAll()
                // Static / infra GET endpoints open to all
                .antMatchers(HttpMethod.GET, PUBLIC_GET).permitAll()
                // /api/v1/auth/me requires a valid JWT — falls through to anyRequest().authenticated()
                // All other requests require authentication
                .anyRequest().authenticated()
            .and()
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
