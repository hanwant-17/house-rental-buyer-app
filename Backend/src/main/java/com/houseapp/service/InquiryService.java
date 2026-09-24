package com.houseapp.service;

import com.houseapp.dto.InquiryDto;
import com.houseapp.entity.*;
import com.houseapp.exception.ResourceNotFoundException;
import com.houseapp.repository.InquiryRepository;
import com.houseapp.repository.PropertyRepository;
import com.houseapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    @Transactional
    public InquiryDto createInquiry(InquiryDto dto, Long customerUserId) {
        User customer = userRepository.findById(customerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Property property = propertyRepository.findById(dto.getPropertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        Inquiry inquiry = Inquiry.builder()
                .customer(customer)
                .property(property)
                .message(dto.getMessage())
                .status("PENDING")
                .build();

        Inquiry saved = inquiryRepository.save(inquiry);
        return mapToDto(saved);
    }

    public List<InquiryDto> getCustomerInquiries(Long customerUserId) {
        return inquiryRepository.findByCustomer_UserId(customerUserId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<InquiryDto> getBrokerInquiries(Long brokerUserId) {
        return inquiryRepository.findByProperty_Broker_User_UserId(brokerUserId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public InquiryDto replyInquiry(Long inquiryId, String replyMessage) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new ResourceNotFoundException("Inquiry not found"));

        inquiry.setBrokerReply(replyMessage);
        inquiry.setStatus("REPLIED");
        return mapToDto(inquiryRepository.save(inquiry));
    }

    private InquiryDto mapToDto(Inquiry inq) {
        return InquiryDto.builder()
                .inquiryId(inq.getInquiryId())
                .propertyId(inq.getProperty().getPropertyId())
                .propertyTitle(inq.getProperty().getTitle())
                .customerId(inq.getCustomer().getUserId())
                .customerName(inq.getCustomer().getName())
                .message(inq.getMessage())
                .brokerReply(inq.getBrokerReply())
                .status(inq.getStatus())
                .createdAt(inq.getCreatedAt())
                .build();
    }
}
