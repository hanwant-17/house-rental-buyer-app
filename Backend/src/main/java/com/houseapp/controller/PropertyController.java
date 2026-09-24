package com.houseapp.controller;

import com.houseapp.dto.ApiResponse;
import com.houseapp.dto.PropertyRequestDto;
import com.houseapp.entity.Property;
import com.houseapp.entity.PropertyStatus;
import com.houseapp.entity.PropertyType;
import com.houseapp.entity.Purpose;
import com.houseapp.security.UserDetailsImpl;
import com.houseapp.service.PropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;

    // PUBLIC: Get all approved properties
    @GetMapping
    public ResponseEntity<ApiResponse<List<Property>>> getAllApprovedProperties() {
        List<Property> properties = propertyService.getAllPublicProperties();
        return ResponseEntity.ok(ApiResponse.success("Approved properties fetched successfully.", properties));
    }

    // PUBLIC: Search & Filter properties
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Property>>> searchProperties(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Purpose purpose,
            @RequestParam(required = false) PropertyType propertyType,
            @RequestParam(required = false) Integer bhk,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice) {
        List<Property> results = propertyService.searchProperties(city, purpose, propertyType, bhk, minPrice, maxPrice);
        return ResponseEntity.ok(ApiResponse.success("Search results fetched successfully.", results));
    }

    // PUBLIC: Get single property
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Property>> getPropertyById(@PathVariable("id") Long id) {
        Property property = propertyService.getPropertyById(id);
        return ResponseEntity.ok(ApiResponse.success("Property fetched successfully.", property));
    }

    // BROKER: Add new property (Initial Status = PENDING)
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_BROKER')")
    public ResponseEntity<ApiResponse<Property>> addProperty(
            @Valid @RequestBody PropertyRequestDto request,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        Property property = propertyService.addProperty(request, userPrincipal.getId());
        return new ResponseEntity<>(
                ApiResponse.success("Property submitted successfully for Admin verification.", property),
                HttpStatus.CREATED
        );
    }

    // BROKER: Get listings for currently logged-in broker
    @GetMapping("/my-properties")
    @PreAuthorize("hasAuthority('ROLE_BROKER')")
    public ResponseEntity<ApiResponse<List<Property>>> getMyProperties(
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        List<Property> myProperties = propertyService.getPropertiesByBroker(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Broker properties fetched successfully.", myProperties));
    }

    // BROKER: Update lifecycle status (AVAILABLE, RENTED, SOLD)
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_BROKER')")
    public ResponseEntity<ApiResponse<Property>> updateStatus(
            @PathVariable("id") Long id,
            @RequestParam PropertyStatus status,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        Property updated = propertyService.updatePropertyStatus(id, status, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Property status updated to: " + status, updated));
    }
}
