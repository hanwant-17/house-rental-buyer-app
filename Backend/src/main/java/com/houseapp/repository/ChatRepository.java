package com.houseapp.repository;

import com.houseapp.entity.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {
    List<Chat> findByCustomer_UserId(Long customerUserId);
    List<Chat> findByBroker_BrokerId(Long brokerId);
    List<Chat> findByBroker_User_UserId(Long brokerUserId);
    Optional<Chat> findByCustomer_UserIdAndBroker_BrokerIdAndProperty_PropertyId(
            Long customerUserId, Long brokerId, Long propertyId);
}
