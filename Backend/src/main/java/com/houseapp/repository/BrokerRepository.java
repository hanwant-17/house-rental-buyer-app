package com.houseapp.repository;

import com.houseapp.entity.Broker;
import com.houseapp.entity.User;
import com.houseapp.entity.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BrokerRepository extends JpaRepository<Broker, Long> {
    Optional<Broker> findByUser(User user);
    Optional<Broker> findByUser_UserId(Long userId);
    List<Broker> findByVerificationStatus(VerificationStatus status);
    Optional<Broker> findByBrokerCode(String brokerCode);
    Boolean existsByBrokerCode(String brokerCode);
}
