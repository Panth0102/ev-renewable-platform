package com.evrenewable.dto.request;

import lombok.Data;
import org.hibernate.validator.constraints.Length;

import javax.validation.constraints.Email;

@Data
public class UpdateProfileRequest {

    @Length(min = 1, max = 120, message = "Name must be between 1 and 120 characters")
    private String name;

    @Email(message = "Invalid email address")
    @Length(max = 255)
    private String email;

    @Length(max = 120)
    private String organisation;

    @Length(max = 20)
    private String phone;
}
