package com.houseapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportDto {
    private Long reportId;
    private Long reporterId;
    private String reporterName;
    private String reporterEmail;
    
    @NotBlank(message = "Target type is required (BROKER or PROPERTY)")
    private String targetType;
    
    private Long targetId;
    private String targetTitle;
    
    @NotBlank(message = "Reason is required")
    private String reason;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    private String status;
    private String adminRemarks;
    private LocalDateTime createdAt;
}
