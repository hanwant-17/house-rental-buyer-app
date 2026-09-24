package com.houseapp.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitDto {
    private Long visitId;
    @NotNull(message = "Property ID is required")
    private Long propertyId;
    private String propertyTitle;
    private Long customerId;
    private String customerName;

    @NotNull(message = "Visit date is required")
    @FutureOrPresent(message = "Visit date must be today or in the future")
    private LocalDate visitDate;

    @NotBlank(message = "Time slot is required")
    private String timeSlot;

    private String notes;
    private String status;
    private LocalDateTime createdAt;
}
