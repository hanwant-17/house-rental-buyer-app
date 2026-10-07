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

    // BROKER: Get deleted properties in Trash Bin
    @GetMapping("/trash")
    @PreAuthorize("hasAuthority('ROLE_BROKER')")
    public ResponseEntity<ApiResponse<List<Property>>> getTrashProperties(
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        List<Property> trashProperties = propertyService.getTrashPropertiesByBroker(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Trash properties fetched successfully.", trashProperties));
    }

    // BROKER: Soft delete property (Move to Trash Bin - 15 days retention)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_BROKER')")
    public ResponseEntity<ApiResponse<Void>> deleteProperty(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        propertyService.softDeleteProperty(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Property moved to Trash Bin. It will be permanently removed in 15 days unless restored.", null));
    }

    // BROKER: Restore property from Trash Bin
    @PutMapping("/{id}/restore")
    @PreAuthorize("hasAuthority('ROLE_BROKER')")
    public ResponseEntity<ApiResponse<Property>> restoreProperty(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        Property restored = propertyService.restoreProperty(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Property restored successfully from Trash Bin.", restored));
    }

    // BROKER: Permanently delete single property from Trash Bin
    @DeleteMapping("/{id}/permanent")
    @PreAuthorize("hasAuthority('ROLE_BROKER')")
    public ResponseEntity<ApiResponse<Void>> permanentDeleteProperty(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        propertyService.permanentDeleteProperty(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Property permanently deleted.", null));
    }

    // BROKER: Empty entire Trash Bin
    @DeleteMapping("/trash/empty")
    @PreAuthorize("hasAuthority('ROLE_BROKER')")
    public ResponseEntity<ApiResponse<Void>> emptyTrash(
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        propertyService.emptyTrash(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Trash Bin emptied successfully.", null));
    }

    // BROKER: Update existing property details
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_BROKER')")
    public ResponseEntity<ApiResponse<Property>> updateProperty(
            @PathVariable("id") Long id,
            @RequestBody PropertyRequestDto request,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        Property updated = propertyService.updateProperty(id, request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Property updated successfully.", updated));
    }
}
