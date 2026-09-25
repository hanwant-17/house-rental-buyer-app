package com.houseapp.service;

import com.houseapp.dto.VisitDto;
import com.houseapp.entity.*;
import com.houseapp.exception.ResourceNotFoundException;
import com.houseapp.repository.PropertyRepository;
import com.houseapp.repository.UserRepository;
import com.houseapp.repository.VisitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VisitService {

    private final VisitRepository visitRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    @Transactional
    public VisitDto scheduleVisit(VisitDto dto, Long customerUserId) {
        User customer = userRepository.findById(customerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Property property = propertyRepository.findById(dto.getPropertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        Visit visit = Visit.builder()
                .customer(customer)
                .property(property)
                .visitDate(dto.getVisitDate())
                .timeSlot(dto.getTimeSlot())
                .notes(dto.getNotes())
                .status("PENDING")
                .build();

        Visit saved = visitRepository.save(visit);
        return mapToDto(saved);
    }

    public List<VisitDto> getCustomerVisits(Long customerUserId) {
        return visitRepository.findByCustomer_UserId(customerUserId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<VisitDto> getBrokerVisits(Long brokerUserId) {
        return visitRepository.findByProperty_Broker_User_UserId(brokerUserId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public VisitDto updateVisitStatus(Long visitId, String status) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Visit not found"));

        visit.setStatus(status.toUpperCase());
        return mapToDto(visitRepository.save(visit));
    }

    private VisitDto mapToDto(Visit v) {
        Property p = v.getProperty();
        Broker b = (p != null) ? p.getBroker() : null;

        return VisitDto.builder()
                .visitId(v.getVisitId())
                .propertyId(p != null ? p.getPropertyId() : null)
                .propertyTitle(p != null ? p.getTitle() : "Property Listing")
                .propertyAddress(p != null ? p.getAddress() : "")
                .propertyCity(p != null ? p.getCity() : "")
                .propertyPrice(p != null ? p.getPrice() : null)
                .propertyPurpose(p != null && p.getPurpose() != null ? p.getPurpose().name() : "RENT")
                .brokerName(b != null && b.getUser() != null ? b.getUser().getName() : "Verified Agent")
                .brokerAgency(b != null ? b.getAgencyName() : "HouseHub Verified")
                .brokerCode(b != null ? b.getBrokerCode() : "BRK-VERIFIED")
                .customerId(v.getCustomer().getUserId())
                .customerName(v.getCustomer().getName())
                .visitDate(v.getVisitDate())
                .timeSlot(v.getTimeSlot())
                .notes(v.getNotes())
                .status(v.getStatus())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
