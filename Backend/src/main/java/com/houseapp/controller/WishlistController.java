package com.houseapp.controller;

import com.houseapp.dto.ApiResponse;
import com.houseapp.entity.Wishlist;
import com.houseapp.security.UserDetailsImpl;
import com.houseapp.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
public class WishlistController {

    private final WishlistService wishlistService;

    @PostMapping("/{propertyId}")
    public ResponseEntity<ApiResponse<Wishlist>> addToWishlist(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        Wishlist item = wishlistService.addToWishlist(userPrincipal.getId(), propertyId);
        return new ResponseEntity<>(ApiResponse.success("Property added to wishlist.", item), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Wishlist>>> getMyWishlist(
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        List<Wishlist> wishlist = wishlistService.getCustomerWishlist(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Wishlist fetched successfully.", wishlist));
    }

    @DeleteMapping("/{propertyId}")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        wishlistService.removeFromWishlist(userPrincipal.getId(), propertyId);
        return ResponseEntity.ok(ApiResponse.success("Property removed from wishlist.", null));
    }
}
