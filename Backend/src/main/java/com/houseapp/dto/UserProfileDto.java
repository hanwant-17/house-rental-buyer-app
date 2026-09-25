package com.houseapp.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {
    private Long userId;
    private String name;
    private String email;
    private String mobile;
    private String role;
    private String status;
    private String profileImage;

    // Broker specific fields
    private Long brokerId;
    private String brokerCode;
    private String agencyName;
    private String brokerCity;
    private String experience;
    private String verificationStatus;
    private String rejectionReason;

    // Customer specific fields
    private Long customerId;
    private String preferredCity;
    private String preferredPurpose;
}
