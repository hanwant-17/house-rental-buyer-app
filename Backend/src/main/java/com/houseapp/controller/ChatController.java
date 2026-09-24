package com.houseapp.controller;

import com.houseapp.dto.ApiResponse;
import com.houseapp.dto.ChatMessageDto;
import com.houseapp.entity.Chat;
import com.houseapp.entity.Role;
import com.houseapp.security.UserDetailsImpl;
import com.houseapp.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // CUSTOMER: Initiate or fetch chat room for a property
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<Chat>> createOrGetChat(
            @RequestParam Long propertyId,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        Chat chat = chatService.getOrCreateChat(userPrincipal.getId(), propertyId);
        return new ResponseEntity<>(
                ApiResponse.success("Chat conversation opened.", chat),
                HttpStatus.OK
        );
    }

    // CUSTOMER & BROKER: Get all active chats for logged-in user
    @GetMapping
    public ResponseEntity<ApiResponse<List<Chat>>> getUserChats(
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        String roleStr = userPrincipal.getAuthorities().iterator().next().getAuthority();
        Role role = Role.valueOf(roleStr);
        List<Chat> chats = chatService.getUserChats(userPrincipal.getId(), role);
        return ResponseEntity.ok(ApiResponse.success("User chats fetched successfully.", chats));
    }

    // PARTICIPANTS: Get message history (Phone/Email hidden)
    @GetMapping("/{chatId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getChatMessages(
            @PathVariable Long chatId,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        List<ChatMessageDto> messages = chatService.getChatMessages(chatId, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Messages fetched.", messages));
    }

    // PARTICIPANTS: Send message in chat room
    @PostMapping("/{chatId}/messages")
    public ResponseEntity<ApiResponse<ChatMessageDto>> sendMessage(
            @PathVariable Long chatId,
            @Valid @RequestBody ChatMessageDto messageDto,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        ChatMessageDto sent = chatService.sendMessage(chatId, userPrincipal.getId(), messageDto.getMessage());
        return new ResponseEntity<>(ApiResponse.success("Message sent.", sent), HttpStatus.CREATED);
    }

    // PARTICIPANTS: Mark chat messages as read
    @PutMapping("/{chatId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long chatId,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        chatService.markMessagesAsRead(chatId, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Messages marked as read.", null));
    }
}
