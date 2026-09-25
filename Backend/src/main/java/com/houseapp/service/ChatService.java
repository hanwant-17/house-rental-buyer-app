package com.houseapp.service;

import com.houseapp.dto.ChatMessageDto;
import com.houseapp.entity.*;
import com.houseapp.exception.BadRequestException;
import com.houseapp.exception.ResourceNotFoundException;
import com.houseapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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
}
