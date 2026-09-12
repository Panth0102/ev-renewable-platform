package com.evrenewable.util;

public final class AppConstants {

    private AppConstants() {}

    public static final String API_V1 = "/api/v1";

    // Auth
    public static final String AUTH_PREFIX  = API_V1 + "/auth";
    public static final String BEARER_PREFIX = "Bearer ";

    // Pagination defaults
    public static final int    DEFAULT_PAGE      = 0;
    public static final int    DEFAULT_PAGE_SIZE = 20;
    public static final String DEFAULT_SORT_BY   = "createdAt";
    public static final String DEFAULT_SORT_DIR  = "desc";

    // Roles
    public static final String ROLE_ADMIN    = "ADMIN";
    public static final String ROLE_OPERATOR = "OPERATOR";
    public static final String ROLE_DRIVER   = "DRIVER";
}
