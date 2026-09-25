package com.houseapp.service;

import com.houseapp.dto.BrokerProfileUpdateDto;
import com.houseapp.dto.CustomerProfileUpdateDto;
import com.houseapp.dto.UserProfileDto;
import com.houseapp.dto.ChangePasswordDto;
import com.houseapp.entity.*;
import com.houseapp.exception.BadRequestException;
import com.houseapp.exception.ResourceNotFoundException;
import com.houseapp.repository.BrokerRepository;
import com.houseapp.repository.CustomerRepository;
import com.houseapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final BrokerRepository brokerRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileDto getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        UserProfileDto.UserProfileDtoBuilder builder = UserProfileDto.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .mobile(user.getMobile())
                .role(user.getRole().name())
                .status(user.getStatus())
                .profileImage(user.getProfileImage() != null ? user.getProfileImage() : defaultAvatar(user.getRole()));

        if (user.getRole() == Role.ROLE_BROKER) {
            Broker broker = brokerRepository.findByUser_UserId(user.getUserId())
                    .orElseGet(() -> brokerRepository.findByUser(user).orElse(null));

            if (broker != null) {
                builder.brokerId(broker.getBrokerId())
                        .brokerCode(broker.getBrokerCode())
                        .agencyName(broker.getAgencyName())
                        .brokerCity(broker.getCity())
                        .experience(broker.getExperience())
                        .verificationStatus(broker.getVerificationStatus().name())
                        .rejectionReason(broker.getRejectionReason());
            }
        } else if (user.getRole() == Role.ROLE_CUSTOMER) {
            Customer customer = customerRepository.findByUser_UserId(user.getUserId())
                    .orElseGet(() -> customerRepository.findByUser(user).orElse(null));

            if (customer != null) {
                builder.customerId(customer.getCustomerId())
                        .preferredCity(customer.getPreferredCity())
                        .preferredPurpose(customer.getPreferredPurpose());
            }
        }

        return builder.build();
    }

    @Transactional
    public UserProfileDto updateCustomerProfile(Long userId, CustomerProfileUpdateDto dto) {
        if (dto.getProfileImage() == null || dto.getProfileImage().isBlank()) {
            throw new BadRequestException("Profile photo is compulsory! Please provide a valid profile image.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        user.setName(dto.getName().trim());
        user.setMobile(dto.getMobile().trim());
        user.setProfileImage(dto.getProfileImage().trim());
        userRepository.save(user);

        Customer customer = customerRepository.findByUser_UserId(userId)
                .orElseGet(() -> customerRepository.findByUser(user).orElse(null));

        if (customer == null) {
            customer = Customer.builder().user(user).build();
        }

        customer.setPreferredCity(dto.getPreferredCity());
        customer.setPreferredPurpose(dto.getPreferredPurpose());
        customerRepository.save(customer);

        return getUserProfile(userId);
    }

    @Transactional
    public UserProfileDto updateBrokerProfile(Long userId, BrokerProfileUpdateDto dto) {
        if (dto.getProfileImage() == null || dto.getProfileImage().isBlank()) {
            throw new BadRequestException("Profile photo is compulsory! Please provide a valid profile image.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        user.setName(dto.getName().trim());
        user.setMobile(dto.getMobile().trim());
        user.setProfileImage(dto.getProfileImage().trim());
        userRepository.save(user);

        Broker broker = brokerRepository.findByUser_UserId(userId)
                .orElseGet(() -> brokerRepository.findByUser(user).orElse(null));

        if (broker == null) {
            broker = Broker.builder().user(user).build();
        }

        broker.setAgencyName(dto.getAgencyName().trim());
        broker.setCity(dto.getCity().trim());
        broker.setExperience(dto.getExperience());

        // RULE ENFORCEMENT: Profile edit triggers re-verification by Admin!
        broker.setVerificationStatus(VerificationStatus.PENDING);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm"));
        broker.setRejectionReason("Profile details modified by broker on " + timestamp + ". Awaiting Admin re-verification.");

        brokerRepository.save(broker);

        return getUserProfile(userId);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect.");
        }

        if (passwordEncoder.matches(dto.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("New password cannot be the same as current password.");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
    }

    private String defaultAvatar(Role role) {
        if (role == Role.ROLE_BROKER) {
            return "https://images.unsplash.com/photo-1560250097-0b93528c311a";
        } else if (role == Role.ROLE_ADMIN) {
            return "https://images.unsplash.com/photo-1534528741775-53994a69daeb";
        }
        return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde";
    }
}
