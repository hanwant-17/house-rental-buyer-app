package com.houseapp.repository;

import com.houseapp.entity.Visit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VisitRepository extends JpaRepository<Visit, Long> {
    List<Visit> findByCustomer_UserId(Long customerUserId);
    List<Visit> findByProperty_Broker_BrokerId(Long brokerId);
    List<Visit> findByProperty_Broker_User_UserId(Long brokerUserId);
}
