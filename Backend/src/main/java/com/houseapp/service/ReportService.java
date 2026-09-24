package com.houseapp.service;

import com.houseapp.dto.ReportDto;
import com.houseapp.entity.Report;
import com.houseapp.entity.User;
import com.houseapp.exception.ResourceNotFoundException;
import com.houseapp.repository.ReportRepository;
import com.houseapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReportDto createReport(ReportDto dto, Long reporterUserId) {
        User reporter = userRepository.findById(reporterUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + reporterUserId));

        Report report = Report.builder()
                .reporter(reporter)
                .targetType(dto.getTargetType().toUpperCase())
                .targetId(dto.getTargetId())
                .targetTitle(dto.getTargetTitle())
                .reason(dto.getReason())
                .description(dto.getDescription())
                .status("PENDING")
                .build();

        Report saved = reportRepository.save(report);
        return toDto(saved);
    }

    public List<ReportDto> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ReportDto> getUserReports(Long userId) {
        return reportRepository.findByReporter_UserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReportDto updateReportStatus(Long reportId, String status, String remarks) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        report.setStatus(status.toUpperCase());
        if (remarks != null && !remarks.isBlank()) {
            report.setAdminRemarks(remarks);
        }

        Report updated = reportRepository.save(report);
        return toDto(updated);
    }

    private ReportDto toDto(Report r) {
        return ReportDto.builder()
                .reportId(r.getReportId())
                .reporterId(r.getReporter() != null ? r.getReporter().getUserId() : null)
                .reporterName(r.getReporter() != null ? r.getReporter().getName() : "Anonymous")
                .reporterEmail(r.getReporter() != null ? r.getReporter().getEmail() : "")
                .targetType(r.getTargetType())
                .targetId(r.getTargetId())
                .targetTitle(r.getTargetTitle())
                .reason(r.getReason())
                .description(r.getDescription())
                .status(r.getStatus())
                .adminRemarks(r.getAdminRemarks())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
