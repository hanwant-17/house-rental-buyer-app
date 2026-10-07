package com.houseapp.dto;

import com.houseapp.entity.Broker;
import com.houseapp.entity.Property;
import com.houseapp.entity.User;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSummaryDto {
    private Long chatId;
    private User customer;
    private Broker broker;
    private Property property;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private String lastMessageSenderName;
    private Long unreadCount;
    private LocalDateTime createdAt;
}
