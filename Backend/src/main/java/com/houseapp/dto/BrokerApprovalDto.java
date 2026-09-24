package com.houseapp.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrokerApprovalDto {
    private String remarks;
    private String customBrokerCode; // Optional: If admin wants to specify or let system auto-generate
}
