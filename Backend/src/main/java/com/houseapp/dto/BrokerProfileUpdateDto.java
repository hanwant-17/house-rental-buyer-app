package com.houseapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrokerProfileUpdateDto {
    @NotBlank(message = "Name cannot be empty")
    private String name;

    @NotBlank(message = "Mobile number cannot be empty")
    private String mobile;

    @NotBlank(message = "Agency name cannot be empty")
    private String agencyName;

    @NotBlank(message = "City cannot be empty")
    private String city;

    private String experience;

    @NotBlank(message = "Profile photo is compulsory")
    private String profileImage;
}
