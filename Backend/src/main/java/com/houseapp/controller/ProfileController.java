package com.houseapp.controller;

import com.houseapp.dto.ApiResponse;
import com.houseapp.dto.BrokerProfileUpdateDto;
import com.houseapp.dto.CustomerProfileUpdateDto;
import com.houseapp.dto.UserProfileDto;
import com.houseapp.security.UserDetailsImpl;
import com.houseapp.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> getMyProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        UserProfileDto profile = profileService.getUserProfile(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully.", profile));
    }

    @PutMapping("/customer")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateCustomerProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CustomerProfileUpdateDto dto) {
        UserProfileDto updated = profileService.updateCustomerProfile(userDetails.getId(), dto);
        return ResponseEntity.ok(ApiResponse.success("Customer profile updated successfully.", updated));
    }

    @PutMapping("/broker")
    @PreAuthorize("hasAuthority('ROLE_BROKER')")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateBrokerProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody BrokerProfileUpdateDto dto) {
        UserProfileDto updated = profileService.updateBrokerProfile(userDetails.getId(), dto);
        return ResponseEntity.ok(ApiResponse.success(
                "Profile updated successfully! NOTE: Your broker account is now PENDING Admin re-verification.",
                updated
        ));
    }
}
