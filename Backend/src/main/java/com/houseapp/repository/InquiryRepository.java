package com.houseapp.repository;

import com.houseapp.entity.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    List<Inquiry> findByCustomer_UserId(Long customerUserId);
    List<Inquiry> findByProperty_Broker_BrokerId(Long brokerId);
    List<Inquiry> findByProperty_Broker_User_UserId(Long brokerUserId);
}
