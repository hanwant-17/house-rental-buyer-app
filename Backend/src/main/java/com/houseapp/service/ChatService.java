package com.houseapp.service;

import com.houseapp.dto.ChatMessageDto;
import com.houseapp.dto.ChatSummaryDto;
import com.houseapp.entity.*;
import com.houseapp.exception.BadRequestException;
import com.houseapp.exception.ResourceNotFoundException;
import com.houseapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final BrokerRepository brokerRepository;

    @Transactional
    public Chat getOrCreateChat(Long customerUserId, Long propertyId) {
        User customer = userRepository.findById(customerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        Broker broker = property.getBroker();

        return chatRepository.findByCustomer_UserIdAndBroker_BrokerIdAndProperty_PropertyId(
                        customerUserId, broker.getBrokerId(), propertyId)
                .orElseGet(() -> {
                    Chat newChat = Chat.builder()
                            .customer(customer)
                            .broker(broker)
                            .property(property)
                            .build();
                    return chatRepository.save(newChat);
                });
    }

    public List<ChatSummaryDto> getUserChatSummaries(Long userId, Role role) {
        List<Chat> chats;
        if (role == Role.ROLE_CUSTOMER) {
            chats = chatRepository.findByCustomer_UserId(userId);
        } else if (role == Role.ROLE_BROKER) {
            chats = chatRepository.findByBroker_User_UserId(userId);
        } else {
            chats = chatRepository.findAll();
        }

        return chats.stream().map(chat -> {
            Optional<ChatMessage> lastMsgOpt = chatMessageRepository.findTopByChat_ChatIdOrderBySentAtDesc(chat.getChatId());
            long unread = chatMessageRepository.countByChat_ChatIdAndIsReadFalseAndSender_UserIdNot(chat.getChatId(), userId);

            String lastMsgText = lastMsgOpt.map(ChatMessage::getMessage).orElse("No messages yet");
            LocalDateTime lastMsgTime = lastMsgOpt.map(ChatMessage::getSentAt).orElse(chat.getCreatedAt());
            String senderName = lastMsgOpt.map(m -> m.getSender().getName()).orElse("");

            return ChatSummaryDto.builder()
                    .chatId(chat.getChatId())
                    .customer(chat.getCustomer())
                    .broker(chat.getBroker())
                    .property(chat.getProperty())
                    .lastMessage(lastMsgText)
                    .lastMessageTime(lastMsgTime)
                    .lastMessageSenderName(senderName)
                    .unreadCount(unread)
                    .createdAt(chat.getCreatedAt())
                    .build();
        }).sorted((c1, c2) -> {
            if (c1.getLastMessageTime() == null && c2.getLastMessageTime() == null) return 0;
            if (c1.getLastMessageTime() == null) return 1;
            if (c2.getLastMessageTime() == null) return -1;
            return c2.getLastMessageTime().compareTo(c1.getLastMessageTime());
        }).collect(Collectors.toList());
    }

    public List<Chat> getUserChats(Long userId, Role role) {
        if (role == Role.ROLE_CUSTOMER) {
            return chatRepository.findByCustomer_UserId(userId);
        } else if (role == Role.ROLE_BROKER) {
            return chatRepository.findByBroker_User_UserId(userId);
        }
        return chatRepository.findAll();
    }

    public List<ChatMessageDto> getChatMessages(Long chatId, Long requestingUserId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found with ID: " + chatId));

        // Privacy check: User must be customer or broker in this chat
        boolean isCustomer = chat.getCustomer().getUserId().equals(requestingUserId);
        boolean isBroker = chat.getBroker().getUser().getUserId().equals(requestingUserId);

        if (!isCustomer && !isBroker) {
            throw new BadRequestException("Unauthorized access to this chat room.");
        }

        List<ChatMessage> messages = chatMessageRepository.findByChat_ChatIdOrderBySentAtAsc(chatId);

        return messages.stream().map(msg -> ChatMessageDto.builder()
                .messageId(msg.getMessageId())
                .chatId(chatId)
                .senderId(msg.getSender().getUserId())
                .senderName(msg.getSender().getName())
                .senderRole(msg.getSender().getRole().name().replace("ROLE_", ""))
                .message(msg.getMessage())
                .isRead(msg.getIsRead())
                .sentAt(msg.getSentAt())
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageDto sendMessage(Long chatId, Long senderUserId, String messageText) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found with ID: " + chatId));

        User sender = userRepository.findById(senderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + senderUserId));

        // Security check
        boolean isCustomer = chat.getCustomer().getUserId().equals(senderUserId);
        boolean isBroker = chat.getBroker().getUser().getUserId().equals(senderUserId);

        if (!isCustomer && !isBroker) {
            throw new BadRequestException("You are not a participant in this conversation.");
        }

        ChatMessage chatMessage = ChatMessage.builder()
                .chat(chat)
                .sender(sender)
                .message(messageText)
                .isRead(false)
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);

        return ChatMessageDto.builder()
                .messageId(savedMessage.getMessageId())
                .chatId(chatId)
                .senderId(sender.getUserId())
                .senderName(sender.getName())
                .senderRole(sender.getRole().name().replace("ROLE_", ""))
                .message(savedMessage.getMessage())
                .isRead(savedMessage.getIsRead())
                .sentAt(savedMessage.getSentAt())
                .build();
    }

    @Transactional
    public void markMessagesAsRead(Long chatId, Long currentUserId) {
        List<ChatMessage> messages = chatMessageRepository.findByChat_ChatIdOrderBySentAtAsc(chatId);
        for (ChatMessage msg : messages) {
            if (!msg.getSender().getUserId().equals(currentUserId) && !msg.getIsRead()) {
                msg.setIsRead(true);
            }
        }
        chatMessageRepository.saveAll(messages);
    }

    public long getUnreadMessageCount(Long userId) {
        return chatMessageRepository.countUnreadMessagesForUser(userId);
    }

    @Transactional
    public void clearChatMessages(Long chatId, Long requestingUserId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found with ID: " + chatId));

        boolean isCustomer = chat.getCustomer().getUserId().equals(requestingUserId);
        boolean isBroker = chat.getBroker().getUser().getUserId().equals(requestingUserId);

        if (!isCustomer && !isBroker) {
            throw new BadRequestException("Unauthorized access to this chat room.");
        }

        List<ChatMessage> messages = chatMessageRepository.findByChat_ChatIdOrderBySentAtAsc(chatId);
        chatMessageRepository.deleteAll(messages);
    }
}
