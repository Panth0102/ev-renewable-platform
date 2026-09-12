package com.evrenewable.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Bounded thread pool for @Async methods (optimisation runs, audit log writes).
 * Named "taskExecutor" so Spring picks it up as the default async executor.
 */
@Configuration
public class AsyncConfig {

    @Value("${async.executor.core-pool-size:4}")
    private int corePoolSize;

    @Value("${async.executor.max-pool-size:8}")
    private int maxPoolSize;

    @Value("${async.executor.queue-capacity:50}")
    private int queueCapacity;

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("async-opt-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
