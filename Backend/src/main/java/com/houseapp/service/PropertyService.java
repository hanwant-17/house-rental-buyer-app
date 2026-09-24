package com.houseapp.service;

import com.houseapp.dto.PropertyApprovalDto;
import com.houseapp.dto.PropertyRequestDto;
import com.houseapp.entity.*;
import com.houseapp.exception.BadRequestException;
import com.houseapp.exception.ResourceNotFoundException;
import com.houseapp.repository.BrokerRepository;
import com.houseapp.repository.PropertyImageRepository;
import com.houseapp.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyImageRepository propertyImageRepository;
    private final BrokerRepository brokerRepository;

    @Transactional
    public Property addProperty(PropertyRequestDto dto, Long brokerUserId) {
        Broker broker = brokerRepository.findByUser_UserId(brokerUserId)
                .orElseThrow(() -> new BadRequestException("Broker profile not found."));

        // RULE 1 Guard: Broker must be APPROVED by Admin
        if (broker.getVerificationStatus() != VerificationStatus.APPROVED) {
            throw new BadRequestException("Only Admin-approved brokers can list properties.");
        }

        // RULE 2: Property initial status is always PENDING Admin Verification
        Property property = Property.builder()
                .broker(broker)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .propertyType(dto.getPropertyType())
                .purpose(dto.getPurpose())
                .price(dto.getPrice())
                .address(dto.getAddress())
                .city(dto.getCity())
                .state(dto.getState())
                .bhk(dto.getBhk())
                .bathrooms(dto.getBathrooms())
                .areaSqft(dto.getAreaSqft())
                .furnishedStatus(dto.getFurnishedStatus())
                .parking(dto.getParking() != null ? dto.getParking() : false)
                .amenities(dto.getAmenities())
                .verificationStatus(VerificationStatus.PENDING) // Awaiting Admin
                .propertyStatus(PropertyStatus.AVAILABLE)
                .build();

        Property savedProperty = propertyRepository.save(property);

        // Save Images if provided
        if (dto.getImageUrls() != null && !dto.getImageUrls().isEmpty()) {
            List<PropertyImage> images = new ArrayList<>();
            for (int i = 0; i < dto.getImageUrls().size(); i++) {
                images.add(PropertyImage.builder()
                        .property(savedProperty)
                        .imageUrl(dto.getImageUrls().get(i))
                        .isPrimary(i == 0)
                        .build());
            }
            propertyImageRepository.saveAll(images);
            savedProperty.setImages(images);
        }

        return savedProperty;
    }

    public List<Property> getAllPublicProperties() {
        // RULE 2: Only Admin APPROVED properties are publicly accessible
        return propertyRepository.findByVerificationStatus(VerificationStatus.APPROVED);
    }

    public Property getPropertyById(Long propertyId) {
        return propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with ID: " + propertyId));
    }

    public List<Property> searchProperties(String city, Purpose purpose, PropertyType propertyType,
                                          Integer bhk, Double minPrice, Double maxPrice) {
        // Enforces RULE 2: Only APPROVED properties
        return propertyRepository.searchProperties(city, purpose, propertyType, bhk, minPrice, maxPrice);
    }

    public List<Property> getPropertiesByBroker(Long brokerUserId) {
        Broker broker = brokerRepository.findByUser_UserId(brokerUserId)
                .orElseThrow(() -> new BadRequestException("Broker profile not found."));
        return propertyRepository.findByBroker_BrokerId(broker.getBrokerId());
    }

    public List<Property> getPendingProperties() {
        return propertyRepository.findByVerificationStatus(VerificationStatus.PENDING);
    }

    @Transactional
    public Property approveProperty(Long propertyId, PropertyApprovalDto dto, Long adminUserId) {
        Property property = getPropertyById(propertyId);

        property.setVerificationStatus(VerificationStatus.APPROVED);
        property.setApprovedBy(adminUserId);
        property.setApprovedAt(LocalDateTime.now());
        property.setRejectionReason(null);

        return propertyRepository.save(property);
    }

    @Transactional
    public Property rejectProperty(Long propertyId, String reason, Long adminUserId) {
        Property property = getPropertyById(propertyId);

        property.setVerificationStatus(VerificationStatus.REJECTED);
        property.setRejectionReason(reason);
        property.setApprovedBy(adminUserId);
        property.setApprovedAt(LocalDateTime.now());

        return propertyRepository.save(property);
    }

    @Transactional
    public Property updatePropertyStatus(Long propertyId, PropertyStatus newStatus, Long brokerUserId) {
        Property property = getPropertyById(propertyId);

        // Security check: Broker must own this property
        if (!property.getBroker().getUser().getUserId().equals(brokerUserId)) {
            throw new BadRequestException("You can only update the status of your own properties.");
        }

        property.setPropertyStatus(newStatus);
        return propertyRepository.save(property);
    }
}
