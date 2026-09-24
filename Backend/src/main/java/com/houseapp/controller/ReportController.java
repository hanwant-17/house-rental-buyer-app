package com.houseapp.controller;

import com.houseapp.dto.ApiResponse;
import com.houseapp.dto.ReportDto;
import com.houseapp.security.UserDetailsImpl;
import com.houseapp.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReportDto>> submitReport(
            @Valid @RequestBody ReportDto dto,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        ReportDto created = reportService.createReport(dto, userPrincipal.getId());
        return new ResponseEntity<>(ApiResponse.success("Report submitted successfully. Admin will review.", created), HttpStatus.CREATED);
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ReportDto>>> getMyReports(
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        List<ReportDto> list = reportService.getUserReports(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Your submitted reports.", list));
    }
}
