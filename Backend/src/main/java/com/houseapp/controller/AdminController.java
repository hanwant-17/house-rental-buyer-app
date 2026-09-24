package com.houseapp.controller;

import com.houseapp.dto.ApiResponse;
import com.houseapp.dto.BrokerApprovalDto;
import com.houseapp.dto.PropertyApprovalDto;
import com.houseapp.dto.ReportDto;
import com.houseapp.entity.Broker;
import com.houseapp.entity.Customer;
import com.houseapp.entity.Property;
import com.houseapp.entity.VerificationStatus;
import com.houseapp.repository.BrokerRepository;
import com.houseapp.repository.CustomerRepository;
import com.houseapp.repository.PropertyRepository;
import com.houseapp.repository.UserRepository;
import com.houseapp.security.UserDetailsImpl;
import com.houseapp.service.BrokerService;
import com.houseapp.service.PropertyService;
import com.houseapp.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final BrokerService brokerService;
    private final PropertyService propertyService;
    private final ReportService reportService;
    private final UserRepository userRepository;
    private final BrokerRepository brokerRepository;
    private final CustomerRepository customerRepository;
    private final PropertyRepository propertyRepository;

    // ==========================================
    // BROKER VERIFICATION (RULE 1 & 4)
    // ==========================================

    @GetMapping("/brokers/pending")
    public ResponseEntity<ApiResponse<List<Broker>>> getPendingBrokers() {
        List<Broker> pending = brokerService.getPendingBrokers();
        return ResponseEntity.ok(ApiResponse.success("Pending brokers fetched successfully.", pending));
    }

    @PutMapping("/brokers/{id}/approve")
    public ResponseEntity<ApiResponse<Broker>> approveBroker(
            @PathVariable("id") Long brokerId,
            @RequestBody(required = false) BrokerApprovalDto dto,
            @AuthenticationPrincipal UserDetailsImpl adminPrincipal) {
        Broker approved = brokerService.approveBroker(brokerId, dto, adminPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(
                "Broker approved successfully. Broker ID assigned: " + approved.getBrokerCode(), approved));
    }

    @PutMapping("/brokers/{id}/reject")
    public ResponseEntity<ApiResponse<Broker>> rejectBroker(
            @PathVariable("id") Long brokerId,
            @RequestParam(name = "reason", defaultValue = "Submitted documents could not be verified.") String reason,
            @AuthenticationPrincipal UserDetailsImpl adminPrincipal) {
        Broker rejected = brokerService.rejectBroker(brokerId, reason, adminPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Broker application rejected.", rejected));
    }

    // ==========================================
    // APPROVED BROKERS
    // ==========================================

    @GetMapping("/brokers/approved")
    public ResponseEntity<ApiResponse<List<Broker>>> getApprovedBrokers() {
        List<Broker> approved = brokerRepository.findByVerificationStatus(VerificationStatus.APPROVED);
        return ResponseEntity.ok(ApiResponse.success("Approved brokers fetched successfully.", approved));
    }

    // ==========================================
    // CUSTOMER MANAGEMENT
    // ==========================================

    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<List<Customer>>> getAllCustomers() {
        List<Customer> customers = customerRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("All customers fetched successfully.", customers));
    }

    // ==========================================
    // PROPERTY VERIFICATION (RULE 2 & 4)
    // ==========================================

    @GetMapping("/properties/pending")
    public ResponseEntity<ApiResponse<List<Property>>> getPendingProperties() {
        List<Property> pending = propertyService.getPendingProperties();
        return ResponseEntity.ok(ApiResponse.success("Pending properties fetched successfully.", pending));
    }

    @PutMapping("/properties/{id}/approve")
    public ResponseEntity<ApiResponse<Property>> approveProperty(
            @PathVariable("id") Long propertyId,
            @RequestBody(required = false) PropertyApprovalDto dto,
            @AuthenticationPrincipal UserDetailsImpl adminPrincipal) {
        Property approved = propertyService.approveProperty(propertyId, dto, adminPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(
                "Property approved successfully and is now LIVE for customers.", approved));
    }

    @PutMapping("/properties/{id}/reject")
    public ResponseEntity<ApiResponse<Property>> rejectProperty(
            @PathVariable("id") Long propertyId,
            @RequestParam(name = "reason", defaultValue = "Listing details or photos did not meet guidelines.") String reason,
            @AuthenticationPrincipal UserDetailsImpl adminPrincipal) {
        Property rejected = propertyService.rejectProperty(propertyId, reason, adminPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Property listing rejected.", rejected));
    }

    // ==========================================
    // REPORTS & COMPLAINTS
    // ==========================================

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<ReportDto>>> getAllReports() {
        List<ReportDto> reports = reportService.getAllReports();
        return ResponseEntity.ok(ApiResponse.success("All reports fetched successfully.", reports));
    }

    @PutMapping("/reports/{id}/status")
    public ResponseEntity<ApiResponse<ReportDto>> updateReportStatus(
            @PathVariable("id") Long reportId,
            @RequestParam String status,
            @RequestParam(required = false, defaultValue = "") String remarks) {
        ReportDto updated = reportService.updateReportStatus(reportId, status, remarks);
        return ResponseEntity.ok(ApiResponse.success("Report status updated to: " + status, updated));
    }

    // ==========================================
    // ADMIN DASHBOARD STATS
    // ==========================================

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalBrokers", brokerRepository.count());
        stats.put("totalCustomers", customerRepository.count());
        stats.put("totalProperties", propertyRepository.count());
        stats.put("pendingBrokersCount", brokerService.getPendingBrokers().size());
        stats.put("approvedBrokersCount", brokerRepository.findByVerificationStatus(VerificationStatus.APPROVED).size());
        stats.put("pendingPropertiesCount", propertyService.getPendingProperties().size());
        stats.put("activePropertiesCount", propertyService.getAllPublicProperties().size());
        stats.put("totalReportsCount", reportService.getAllReports().size());
        stats.put("pendingReportsCount", reportService.getAllReports().stream().filter(r -> "PENDING".equalsIgnoreCase(r.getStatus())).count());

        return ResponseEntity.ok(ApiResponse.success("Admin dashboard statistics.", stats));
    }
}
