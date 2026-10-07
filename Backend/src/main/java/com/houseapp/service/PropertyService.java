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
import org.springframework.scheduling.annotation.Scheduled;
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
                .rooms(dto.getRooms() != null ? dto.getRooms() : dto.getBhk())
                .bathrooms(dto.getBathrooms() != null ? dto.getBathrooms() : 1)
                .kitchen(dto.getKitchen() != null && !dto.getKitchen().isBlank() ? dto.getKitchen() : "Modular Kitchen")
                .floorNo(dto.getFloorNo() != null && !dto.getFloorNo().isBlank() ? dto.getFloorNo() : "Ground Floor")
                .totalFloors(dto.getTotalFloors())
                .hall(dto.getHall() != null && !dto.getHall().isBlank() ? dto.getHall() : "1 Living Hall")
                .balconies(dto.getBalconies() != null ? dto.getBalconies() : 1)
                .facing(dto.getFacing() != null && !dto.getFacing().isBlank() ? dto.getFacing() : "East Facing")
                .propertyAge(dto.getPropertyAge() != null && !dto.getPropertyAge().isBlank() ? dto.getPropertyAge() : "New Construction")
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
        // RULE 2: Only Admin APPROVED properties are publicly accessible and not deleted
        return propertyRepository.findByVerificationStatusAndIsDeletedFalse(VerificationStatus.APPROVED);
    }

    public Property getPropertyById(Long propertyId) {
        return propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with ID: " + propertyId));
    }

    public List<Property> searchProperties(String city, Purpose purpose, PropertyType propertyType,
                                          Integer bhk, Double minPrice, Double maxPrice) {
        // Enforces RULE 2: Only APPROVED and non-deleted properties
        return propertyRepository.searchProperties(city, purpose, propertyType, bhk, minPrice, maxPrice);
    }

    public List<Property> getPropertiesByBroker(Long brokerUserId) {
        autoPurgeOldDeletedProperties();
        Broker broker = brokerRepository.findByUser_UserId(brokerUserId)
                .orElseThrow(() -> new BadRequestException("Broker profile not found."));
        return propertyRepository.findByBroker_BrokerIdAndIsDeletedFalse(broker.getBrokerId());
    }

    public List<Property> getTrashPropertiesByBroker(Long brokerUserId) {
        autoPurgeOldDeletedProperties();
        Broker broker = brokerRepository.findByUser_UserId(brokerUserId)
                .orElseThrow(() -> new BadRequestException("Broker profile not found."));
        return propertyRepository.findByBroker_BrokerIdAndIsDeletedTrue(broker.getBrokerId());
    }

    public List<Property> getPendingProperties() {
        return propertyRepository.findByVerificationStatusAndIsDeletedFalse(VerificationStatus.PENDING);
    }

    @Transactional
    public void softDeleteProperty(Long propertyId, Long brokerUserId) {
        Property property = getPropertyById(propertyId);
        if (!property.getBroker().getUser().getUserId().equals(brokerUserId)) {
            throw new BadRequestException("You can only delete your own properties.");
        }
        property.setIsDeleted(true);
        property.setDeletedAt(LocalDateTime.now());
        propertyRepository.save(property);
    }

    @Transactional
    public Property restoreProperty(Long propertyId, Long brokerUserId) {
        Property property = getPropertyById(propertyId);
        if (!property.getBroker().getUser().getUserId().equals(brokerUserId)) {
            throw new BadRequestException("You can only restore your own properties.");
        }
        property.setIsDeleted(false);
        property.setDeletedAt(null);
        return propertyRepository.save(property);
    }

    @Transactional
    public void permanentDeleteProperty(Long propertyId, Long brokerUserId) {
        Property property = getPropertyById(propertyId);
        if (!property.getBroker().getUser().getUserId().equals(brokerUserId)) {
            throw new BadRequestException("You can only delete your own properties.");
        }
        propertyRepository.delete(property);
    }

    @Transactional
    public void emptyTrash(Long brokerUserId) {
        Broker broker = brokerRepository.findByUser_UserId(brokerUserId)
                .orElseThrow(() -> new BadRequestException("Broker profile not found."));
        List<Property> trashItems = propertyRepository.findByBroker_BrokerIdAndIsDeletedTrue(broker.getBrokerId());
        if (!trashItems.isEmpty()) {
            propertyRepository.deleteAll(trashItems);
        }
    }

    @Transactional
    @Scheduled(cron = "0 0 2 * * ?")
    public void autoPurgeOldDeletedProperties() {
        // Permanently purge any property in trash older than 15 days
        LocalDateTime cutoff = LocalDateTime.now().minusDays(15);
        List<Property> expired = propertyRepository.findByIsDeletedTrueAndDeletedAtBefore(cutoff);
        if (!expired.isEmpty()) {
            propertyRepository.deleteAll(expired);
        }
    }

    @Transactional
    public Property updateProperty(Long propertyId, PropertyRequestDto dto, Long brokerUserId) {
        Property property = getPropertyById(propertyId);
        if (!property.getBroker().getUser().getUserId().equals(brokerUserId)) {
            throw new BadRequestException("You can only edit your own properties.");
        }

        if (dto.getTitle() != null && !dto.getTitle().isBlank()) property.setTitle(dto.getTitle());
        if (dto.getDescription() != null) property.setDescription(dto.getDescription());
        if (dto.getPrice() != null) property.setPrice(dto.getPrice());
        if (dto.getCity() != null && !dto.getCity().isBlank()) property.setCity(dto.getCity());
        if (dto.getAddress() != null && !dto.getAddress().isBlank()) property.setAddress(dto.getAddress());
        if (dto.getState() != null) property.setState(dto.getState());
        if (dto.getBhk() != null) property.setBhk(dto.getBhk());
        if (dto.getRooms() != null) property.setRooms(dto.getRooms());
        if (dto.getBathrooms() != null) property.setBathrooms(dto.getBathrooms());
        if (dto.getKitchen() != null && !dto.getKitchen().isBlank()) property.setKitchen(dto.getKitchen());
        if (dto.getFloorNo() != null && !dto.getFloorNo().isBlank()) property.setFloorNo(dto.getFloorNo());
        if (dto.getTotalFloors() != null) property.setTotalFloors(dto.getTotalFloors());
        if (dto.getHall() != null && !dto.getHall().isBlank()) property.setHall(dto.getHall());
        if (dto.getBalconies() != null) property.setBalconies(dto.getBalconies());
        if (dto.getFacing() != null && !dto.getFacing().isBlank()) property.setFacing(dto.getFacing());
        if (dto.getPropertyAge() != null && !dto.getPropertyAge().isBlank()) property.setPropertyAge(dto.getPropertyAge());
        if (dto.getAreaSqft() != null) property.setAreaSqft(dto.getAreaSqft());
        if (dto.getFurnishedStatus() != null) property.setFurnishedStatus(dto.getFurnishedStatus());
        if (dto.getParking() != null) property.setParking(dto.getParking());
        if (dto.getAmenities() != null) property.setAmenities(dto.getAmenities());

        return propertyRepository.save(property);
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
