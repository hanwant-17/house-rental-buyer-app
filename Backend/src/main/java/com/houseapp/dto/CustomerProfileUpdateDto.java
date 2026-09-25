package com.houseapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerProfileUpdateDto {
    @NotBlank(message = "Name cannot be empty")
    private String name;

    @NotBlank(message = "Mobile number cannot be empty")
    private String mobile;

    private String preferredCity;
    private String preferredPurpose;

    @NotBlank(message = "Profile photo is compulsory")
    private String profileImage;
}
