package com.houseapp.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private Long userId;
    private String name;
    private String email;
    private String role;
    private String status;
    private String brokerCode;
    private String verificationStatus;
}
