package com.houseapp.dto;

import com.houseapp.entity.PropertyType;
import com.houseapp.entity.Purpose;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyRequestDto {

    @NotBlank(message = "Property title is required")
    private String title;

    private String description;

    @NotNull(message = "Property type is required")
    private PropertyType propertyType;

    @NotNull(message = "Purpose (RENT/BUY) is required")
    private Purpose purpose;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private Double price;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    private String state;

    @NotNull(message = "BHK count is required")
    @Positive(message = "BHK count must be at least 1")
    private Integer bhk;

    private Integer bathrooms;
    private Integer rooms;
    private String kitchen;
    private String floorNo;
    private Integer totalFloors;
    private String hall;
    private Integer balconies;
    private String facing;
    private String propertyAge;

    private Double areaSqft;
    private String furnishedStatus;
    private Boolean parking;
    private String amenities;

    private List<String> imageUrls;
}
