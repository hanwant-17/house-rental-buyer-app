package com.houseapp.repository;

import com.houseapp.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChat_ChatIdOrderBySentAtAsc(Long chatId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.isRead = false AND m.sender.userId <> :userId AND (m.chat.customer.userId = :userId OR m.chat.broker.user.userId = :userId)")
    long countUnreadMessagesForUser(@Param("userId") Long userId);
}
