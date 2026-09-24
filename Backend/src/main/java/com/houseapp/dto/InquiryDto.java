package com.houseapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InquiryDto {
    private Long inquiryId;
    @NotNull(message = "Property ID is required")
    private Long propertyId;
    private String propertyTitle;
    private Long customerId;
    private String customerName;
    @NotBlank(message = "Inquiry message is required")
    private String message;
    private String brokerReply;
    private String status;
    private LocalDateTime createdAt;
}
