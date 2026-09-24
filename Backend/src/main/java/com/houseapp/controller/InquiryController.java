package com.houseapp.controller;

import com.houseapp.dto.ApiResponse;
import com.houseapp.dto.InquiryDto;
import com.houseapp.security.UserDetailsImpl;
import com.houseapp.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<InquiryDto>> createInquiry(
            @Valid @RequestBody InquiryDto dto,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        InquiryDto created = inquiryService.createInquiry(dto, userPrincipal.getId());
        return new ResponseEntity<>(ApiResponse.success("Inquiry sent successfully.", created), HttpStatus.CREATED);
    }

    @GetMapping("/customer")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<List<InquiryDto>>> getCustomerInquiries(
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        List<InquiryDto> inquiries = inquiryService.getCustomerInquiries(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Customer inquiries fetched.", inquiries));
    }

    @GetMapping("/broker")
    @PreAuthorize("hasAuthority('ROLE_BROKER')")
    public ResponseEntity<ApiResponse<List<InquiryDto>>> getBrokerInquiries(
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        List<InquiryDto> inquiries = inquiryService.getBrokerInquiries(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Broker inquiries fetched.", inquiries));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_BROKER')")
    public ResponseEntity<ApiResponse<InquiryDto>> replyInquiry(
            @PathVariable Long id,
            @RequestParam String reply) {
        InquiryDto updated = inquiryService.replyInquiry(id, reply);
        return ResponseEntity.ok(ApiResponse.success("Inquiry replied successfully.", updated));
    }
}
