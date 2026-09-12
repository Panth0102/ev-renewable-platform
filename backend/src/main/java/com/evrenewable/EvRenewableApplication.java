package com.evrenewable;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * GreenCharge — EV Renewable Platform
 * Spring Boot entry point.
 */
@SpringBootApplication
@EnableJpaAuditing
public class EvRenewableApplication {

    public static void main(String[] args) {
        SpringApplication.run(EvRenewableApplication.class, args);
    }
}
