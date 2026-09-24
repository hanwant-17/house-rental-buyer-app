package com.houseapp.controller;

import com.houseapp.dto.ApiResponse;
import com.houseapp.dto.VisitDto;
import com.houseapp.security.UserDetailsImpl;
import com.houseapp.service.VisitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visits")
@RequiredArgsConstructor
public class VisitController {

    private final VisitService visitService;

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<VisitDto>> scheduleVisit(
            @Valid @RequestBody VisitDto dto,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        VisitDto created = visitService.scheduleVisit(dto, userPrincipal.getId());
        return new ResponseEntity<>(ApiResponse.success("Visit scheduled successfully.", created), HttpStatus.CREATED);
    }

    @GetMapping("/customer")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<List<VisitDto>>> getCustomerVisits(
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        List<VisitDto> visits = visitService.getCustomerVisits(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Customer visits fetched.", visits));
    }

    @GetMapping("/broker")
    @PreAuthorize("hasAuthority('ROLE_BROKER')")
    public ResponseEntity<ApiResponse<List<VisitDto>>> getBrokerVisits(
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        List<VisitDto> visits = visitService.getBrokerVisits(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Broker visits fetched.", visits));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_BROKER')")
    public ResponseEntity<ApiResponse<VisitDto>> updateVisitStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        VisitDto updated = visitService.updateVisitStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Visit status updated to: " + status, updated));
    }
}
