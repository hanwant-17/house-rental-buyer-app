package com.houseapp.service;

import com.houseapp.dto.AuthResponse;
import com.houseapp.dto.BrokerRegisterRequest;
import com.houseapp.dto.CustomerRegisterRequest;
import com.houseapp.dto.LoginRequest;
import com.houseapp.entity.*;
import com.houseapp.exception.BadRequestException;
import com.houseapp.repository.BrokerRepository;
import com.houseapp.repository.CustomerRepository;
import com.houseapp.repository.UserRepository;
import com.houseapp.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final BrokerRepository brokerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @Transactional
    public AuthResponse registerCustomer(CustomerRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }
        if (userRepository.existsByMobile(request.getMobile())) {
            throw new BadRequestException("Mobile number is already registered: " + request.getMobile());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .mobile(request.getMobile())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_CUSTOMER)
                .status("ACTIVE")
                .build();

        User savedUser = userRepository.save(user);

        Customer customer = Customer.builder()
                .user(savedUser)
                .preferredCity(request.getCity())
                .preferredPurpose(request.getUserType())
                .build();

        customerRepository.save(customer);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtUtils.generateJwtToken(authentication);

        return AuthResponse.builder()
                .token(jwt)
                .userId(savedUser.getUserId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role("CUSTOMER")
                .status(savedUser.getStatus())
                .build();
    }

    @Transactional
    public Broker registerBroker(BrokerRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }
        if (userRepository.existsByMobile(request.getMobile())) {
            throw new BadRequestException("Mobile number is already registered: " + request.getMobile());
        }

        // RULE 1: Broker is created with status = PENDING and verificationStatus = PENDING
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .mobile(request.getMobile())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_BROKER)
                .status("PENDING") // Pending Admin Verification
                .build();

        User savedUser = userRepository.save(user);

        Broker broker = Broker.builder()
                .user(savedUser)
                .agencyName(request.getAgencyName())
                .address(request.getAddress())
                .city(request.getCity())
                .experience(request.getExperience())
                .idProofUrl(request.getIdProofUrl())
                .addressProofUrl(request.getAddressProofUrl())
                .verificationStatus(VerificationStatus.PENDING)
                .build();

        return brokerRepository.save(broker);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password."));

        // Enforce RULE 1: Pending broker cannot log in until approved by Admin
        if (user.getRole() == Role.ROLE_BROKER) {
            Broker broker = brokerRepository.findByUser(user)
                    .orElseThrow(() -> new BadRequestException("Broker profile not found."));

            if (broker.getVerificationStatus() == VerificationStatus.PENDING) {
                throw new BadRequestException("Your broker account is currently PENDING Admin verification. Please wait for Admin approval.");
            } else if (broker.getVerificationStatus() == VerificationStatus.REJECTED) {
                throw new BadRequestException("Your broker registration was rejected. Reason: " + 
                        (broker.getRejectionReason() != null ? broker.getRejectionReason() : "Please contact Admin."));
            } else if (broker.getVerificationStatus() == VerificationStatus.SUSPENDED) {
                throw new BadRequestException("Your broker account is suspended. Please contact Admin.");
            }
        }

        if ("SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            throw new BadRequestException("Your account is suspended. Please contact Admin.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtUtils.generateJwtToken(authentication);

        String roleStr = user.getRole().name().replace("ROLE_", "");
        String brokerCode = null;
        String verificationStatus = null;

        if (user.getRole() == Role.ROLE_BROKER) {
            Broker b = brokerRepository.findByUser(user).orElse(null);
            if (b != null) {
                brokerCode = b.getBrokerCode();
                verificationStatus = b.getVerificationStatus().name();
            }
        }

        return AuthResponse.builder()
                .token(jwt)
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .role(roleStr)
                .status(user.getStatus())
                .brokerCode(brokerCode)
                .verificationStatus(verificationStatus)
                .build();
    }
}
