package com.houseapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
    private Long messageId;
    private Long chatId;
    private Long senderId;
    private String senderName;
    private String senderRole;

    @NotBlank(message = "Message text cannot be empty")
    private String message;

    private Boolean isRead;
    private LocalDateTime sentAt;
}
