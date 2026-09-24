package com.houseapp.repository;

import com.houseapp.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {

    List<Property> findByVerificationStatus(VerificationStatus verificationStatus);

    List<Property> findByVerificationStatusAndPropertyStatus(
            VerificationStatus verificationStatus, PropertyStatus propertyStatus);

    List<Property> findByBroker_BrokerId(Long brokerId);

    @Query("SELECT p FROM Property p WHERE p.verificationStatus = 'APPROVED' " +
           "AND (:city IS NULL OR LOWER(p.city) LIKE LOWER(CONCAT('%', :city, '%'))) " +
           "AND (:purpose IS NULL OR p.purpose = :purpose) " +
           "AND (:propertyType IS NULL OR p.propertyType = :propertyType) " +
           "AND (:bhk IS NULL OR p.bhk = :bhk) " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice)")
    List<Property> searchProperties(
            @Param("city") String city,
            @Param("purpose") Purpose purpose,
            @Param("propertyType") PropertyType propertyType,
            @Param("bhk") Integer bhk,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice
    );
}
