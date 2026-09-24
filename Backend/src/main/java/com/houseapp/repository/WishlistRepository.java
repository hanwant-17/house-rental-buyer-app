package com.houseapp.repository;

import com.houseapp.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findByCustomer_UserId(Long customerUserId);
    Optional<Wishlist> findByCustomer_UserIdAndProperty_PropertyId(Long customerUserId, Long propertyId);
    void deleteByCustomer_UserIdAndProperty_PropertyId(Long customerUserId, Long propertyId);
    Boolean existsByCustomer_UserIdAndProperty_PropertyId(Long customerUserId, Long propertyId);
}
