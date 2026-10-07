package com.houseapp.controller;

import com.houseapp.dto.ApiResponse;
import com.houseapp.dto.BrokerApprovalDto;
import com.houseapp.dto.PropertyApprovalDto;
import com.houseapp.dto.ReportDto;
import com.houseapp.entity.*;
import com.houseapp.exception.ResourceNotFoundException;
import com.houseapp.repository.*;
import com.houseapp.security.UserDetailsImpl;
import com.houseapp.service.BrokerService;
import com.houseapp.service.PropertyService;
import com.houseapp.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
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
    private final ChatRepository chatRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final InquiryRepository inquiryRepository;
    private final VisitRepository visitRepository;
    private final WishlistRepository wishlistRepository;
    private final ReportRepository reportRepository;

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
    // BROKER REMOVAL / DELETION (ADMIN)
    // ==========================================

    @DeleteMapping("/brokers/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> removeBroker(@PathVariable("id") Long brokerId) {
        Broker broker = brokerRepository.findById(brokerId)
                .orElseGet(() -> brokerRepository.findByUser_UserId(brokerId)
                        .orElseThrow(() -> new ResourceNotFoundException("Broker not found with ID: " + brokerId)));

        Long actualBrokerId = broker.getBrokerId();
        User brokerUser = broker.getUser();
        Long brokerUserId = (brokerUser != null) ? brokerUser.getUserId() : null;

        // 1. Delete all properties belonging to this broker & their dependencies
        List<Property> properties = propertyRepository.findByBroker_BrokerId(actualBrokerId);
        for (Property p : properties) {
            Long propId = p.getPropertyId();

            // Wishlists for this property
            List<Wishlist> wishlists = wishlistRepository.findAll().stream()
                    .filter(w -> w.getProperty() != null && w.getProperty().getPropertyId().equals(propId))
                    .toList();
            wishlistRepository.deleteAll(wishlists);

            // Inquiries for this property
            List<Inquiry> inquiries = inquiryRepository.findAll().stream()
                    .filter(inq -> inq.getProperty() != null && inq.getProperty().getPropertyId().equals(propId))
                    .toList();
            inquiryRepository.deleteAll(inquiries);

            // Visits for this property
            List<Visit> visits = visitRepository.findAll().stream()
                    .filter(v -> v.getProperty() != null && v.getProperty().getPropertyId().equals(propId))
                    .toList();
            visitRepository.deleteAll(visits);

            // Chats for this property
            List<Chat> propChats = chatRepository.findAll().stream()
                    .filter(c -> c.getProperty() != null && c.getProperty().getPropertyId().equals(propId))
                    .toList();
            for (Chat c : propChats) {
                List<ChatMessage> msgs = chatMessageRepository.findByChat_ChatIdOrderBySentAtAsc(c.getChatId());
                chatMessageRepository.deleteAll(msgs);
                chatRepository.delete(c);
            }

            propertyRepository.delete(p);
        }

        // 2. Delete any remaining chats where this broker is participant
        List<Chat> remainingBrokerChats = chatRepository.findByBroker_BrokerId(actualBrokerId);
        for (Chat c : remainingBrokerChats) {
            List<ChatMessage> msgs = chatMessageRepository.findByChat_ChatIdOrderBySentAtAsc(c.getChatId());
            chatMessageRepository.deleteAll(msgs);
            chatRepository.delete(c);
        }

        // 3. Delete any messages sent by broker user
        if (brokerUserId != null) {
            List<ChatMessage> sentMsgs = chatMessageRepository.findAll().stream()
                    .filter(m -> m.getSender() != null && m.getSender().getUserId().equals(brokerUserId))
                    .toList();
            chatMessageRepository.deleteAll(sentMsgs);

            // Delete reports filed by broker or targeting broker
            List<Report> userReports = reportRepository.findAll().stream()
                    .filter(r -> (r.getReporter() != null && r.getReporter().getUserId().equals(brokerUserId)) ||
                            ("BROKER".equalsIgnoreCase(r.getTargetType()) && actualBrokerId.equals(r.getTargetId())))
                    .toList();
            reportRepository.deleteAll(userReports);
        }

        // 4. Delete the broker entity
        brokerRepository.delete(broker);

        // 5. Delete associated User account
        if (brokerUser != null) {
            userRepository.delete(brokerUser);
        }

        return ResponseEntity.ok(ApiResponse.success("Broker and all associated listings and data removed successfully.", null));
    }

    // ==========================================
    // CUSTOMER MANAGEMENT & REMOVAL
    // ==========================================

    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<List<Customer>>> getAllCustomers() {
        List<Customer> customers = customerRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("All customers fetched successfully.", customers));
    }

    @DeleteMapping("/customers/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> removeCustomer(@PathVariable("id") Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseGet(() -> customerRepository.findByUser_UserId(customerId)
                        .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId)));

        User customerUser = customer.getUser();
        Long customerUserId = (customerUser != null) ? customerUser.getUserId() : null;

        if (customerUserId != null) {
            // 1. Delete customer wishlists
            List<Wishlist> wishlists = wishlistRepository.findByCustomer_UserId(customerUserId);
            wishlistRepository.deleteAll(wishlists);

            // 2. Delete customer visits
            List<Visit> visits = visitRepository.findByCustomer_UserId(customerUserId);
            visitRepository.deleteAll(visits);

            // 3. Delete customer inquiries
            List<Inquiry> inquiries = inquiryRepository.findByCustomer_UserId(customerUserId);
            inquiryRepository.deleteAll(inquiries);

            // 4. Delete customer chats and their messages
            List<Chat> chats = chatRepository.findByCustomer_UserId(customerUserId);
            for (Chat c : chats) {
                List<ChatMessage> msgs = chatMessageRepository.findByChat_ChatIdOrderBySentAtAsc(c.getChatId());
                chatMessageRepository.deleteAll(msgs);
                chatRepository.delete(c);
            }

            // 5. Delete any remaining messages sent by this customer
            List<ChatMessage> sentMsgs = chatMessageRepository.findAll().stream()
                    .filter(m -> m.getSender() != null && m.getSender().getUserId().equals(customerUserId))
                    .toList();
            chatMessageRepository.deleteAll(sentMsgs);

            // 6. Delete reports filed by customer
            List<Report> reports = reportRepository.findAll().stream()
                    .filter(r -> r.getReporter() != null && r.getReporter().getUserId().equals(customerUserId))
                    .toList();
            reportRepository.deleteAll(reports);
        }

        // 7. Delete customer entity
        customerRepository.delete(customer);

        // 8. Delete associated User account
        if (customerUser != null) {
            userRepository.delete(customerUser);
        }

        return ResponseEntity.ok(ApiResponse.success("Customer account and all associated inquiries and visits removed successfully.", null));
    }

    // ==========================================
    // PROPERTY VERIFICATION (RULE 2 & 4)
    // ==========================================

    @GetMapping("/properties/pending")
    public ResponseEntity<ApiResponse<List<Property>>> getPendingProperties() {
        List<Property> pending = propertyService.getPendingProperties();
        return ResponseEntity.ok(ApiResponse.success("Pending properties fetched successfully.", pending));
    }

    @GetMapping("/properties/approved")
    public ResponseEntity<ApiResponse<List<Property>>> getApprovedProperties() {
        List<Property> approved = propertyRepository.findByVerificationStatus(VerificationStatus.APPROVED);
        return ResponseEntity.ok(ApiResponse.success("Approved properties fetched successfully.", approved));
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
