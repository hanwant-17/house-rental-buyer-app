package com.houseapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HouseRentalApplication {

    public static void main(String[] args) {
        SpringApplication.run(HouseRentalApplication.class, args);
        System.out.println("==================================================");
        System.out.println("🏠 House Rental & Buyer App Backend Started!");
        System.out.println("🌐 Server URL: http://localhost:8080");
        System.out.println("==================================================");
    }
}
