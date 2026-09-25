package com.houseapp.service;

import com.houseapp.dto.BrokerApprovalDto;
import com.houseapp.entity.Broker;
import com.houseapp.entity.User;
import com.houseapp.entity.VerificationStatus;
import com.houseapp.exception.BadRequestException;
import com.houseapp.exception.ResourceNotFoundException;
import com.houseapp.repository.BrokerRepository;
import com.houseapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BrokerService {

    private final BrokerRepository brokerRepository;
    private final UserRepository userRepository;

    public List<Broker> getPendingBrokers() {
        return brokerRepository.findByVerificationStatus(VerificationStatus.PENDING);
    }

    public List<Broker> getAllBrokers() {
        return brokerRepository.findAll();
    }

    public Broker getBrokerById(Long brokerId) {
        return brokerRepository.findById(brokerId)
                .orElseThrow(() -> new ResourceNotFoundException("Broker not found with ID: " + brokerId));
    }

    public Broker getBrokerByUserId(Long userId) {
        return brokerRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Broker profile not found for user ID: " + userId));
    }

    @Transactional
    public Broker approveBroker(Long brokerId, BrokerApprovalDto dto, Long adminUserId) {
        Broker broker = getBrokerById(brokerId);

        if (broker.getVerificationStatus() == VerificationStatus.APPROVED) {
            throw new BadRequestException("Broker is already approved with Broker ID: " + broker.getBrokerCode());
        }

        // Keep existing broker code on re-verification, or generate new if none exists
        String generatedCode = (dto != null && dto.getCustomBrokerCode() != null && !dto.getCustomBrokerCode().isBlank())
                ? dto.getCustomBrokerCode()
                : (broker.getBrokerCode() != null && !broker.getBrokerCode().isBlank() ? broker.getBrokerCode() : generateUniqueBrokerCode());

        broker.setBrokerCode(generatedCode);
        broker.setVerificationStatus(VerificationStatus.APPROVED);
        broker.setApprovedBy(adminUserId);
        broker.setApprovedAt(LocalDateTime.now());
        broker.setRejectionReason(null);

        // Activate User account
        User user = broker.getUser();
        user.setStatus("ACTIVE");
        userRepository.save(user);

        return brokerRepository.save(broker);
    }

    @Transactional
    public Broker rejectBroker(Long brokerId, String reason, Long adminUserId) {
        Broker broker = getBrokerById(brokerId);

        broker.setVerificationStatus(VerificationStatus.REJECTED);
        broker.setRejectionReason(reason);
        broker.setApprovedBy(adminUserId);
        broker.setApprovedAt(LocalDateTime.now());

        // Update User account status
        User user = broker.getUser();
        user.setStatus("REJECTED");
        userRepository.save(user);

        return brokerRepository.save(broker);
    }

    private String generateUniqueBrokerCode() {
        int currentYear = Year.now().getValue();
        long count = brokerRepository.count() + 1001;
        String code = "BRK-" + currentYear + "-" + count;
        while (brokerRepository.existsByBrokerCode(code)) {
            count++;
            code = "BRK-" + currentYear + "-" + count;
        }
        return code;
    }
}
