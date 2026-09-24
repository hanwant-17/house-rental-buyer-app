package com.houseapp.service;

import com.houseapp.entity.*;
import com.houseapp.exception.BadRequestException;
import com.houseapp.exception.ResourceNotFoundException;
import com.houseapp.repository.PropertyRepository;
import com.houseapp.repository.UserRepository;
import com.houseapp.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    @Transactional
    public Wishlist addToWishlist(Long customerUserId, Long propertyId) {
        if (wishlistRepository.existsByCustomer_UserIdAndProperty_PropertyId(customerUserId, propertyId)) {
            throw new BadRequestException("Property is already in your wishlist.");
        }

        User customer = userRepository.findById(customerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        Wishlist wishlist = Wishlist.builder()
                .customer(customer)
                .property(property)
                .build();

        return wishlistRepository.save(wishlist);
    }

    public List<Wishlist> getCustomerWishlist(Long customerUserId) {
        return wishlistRepository.findByCustomer_UserId(customerUserId);
    }

    @Transactional
    public void removeFromWishlist(Long customerUserId, Long propertyId) {
        wishlistRepository.deleteByCustomer_UserIdAndProperty_PropertyId(customerUserId, propertyId);
    }
}
