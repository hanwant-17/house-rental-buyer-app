package com.houseapp.controller;

import com.houseapp.dto.*;
import com.houseapp.entity.Broker;
import com.houseapp.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/customer/register")
    public ResponseEntity<ApiResponse<AuthResponse>> registerCustomer(
            @Valid @RequestBody CustomerRegisterRequest request) {
        AuthResponse response = authService.registerCustomer(request);
        return new ResponseEntity<>(
                ApiResponse.success("Customer registration successful.", response),
                HttpStatus.CREATED
        );
    }

    @PostMapping("/broker/register")
    public ResponseEntity<ApiResponse<String>> registerBroker(
            @Valid @RequestBody BrokerRegisterRequest request) {
        Broker broker = authService.registerBroker(request);
        return new ResponseEntity<>(
                ApiResponse.success(
                        "Broker registration submitted successfully. Your account is PENDING Admin verification.",
                        "Broker ID will be assigned after Admin approval. Profile Status: " + broker.getVerificationStatus()
                ),
                HttpStatus.CREATED
        );
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful.", response));
    }
}
