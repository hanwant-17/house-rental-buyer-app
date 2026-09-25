package com.houseapp.config;

import com.houseapp.entity.*;
import com.houseapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;

@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BrokerRepository brokerRepository;
    private final CustomerRepository customerRepository;
    private final PropertyRepository propertyRepository;
    private final ReportRepository reportRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        // ==========================================
        // 1. SEED DEFAULT SUPER ADMIN
        // ==========================================
        User admin = userRepository.findByEmail("admin@househub.com").orElse(null);
        if (admin == null) {
            admin = User.builder()
                    .name("Super Admin")
                    .email("admin@househub.com")
                    .mobile("9999999999")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ROLE_ADMIN)
                    .status("ACTIVE")
                    .build();
            admin = userRepository.save(admin);
            System.out.println("🛡️ Initial Super Admin account created: admin@househub.com / Admin@123");
        }

        // ==========================================
        // 2. SEED DEFAULT APPROVED BROKER
        // ==========================================
        User brokerUser = userRepository.findByEmail("broker@househub.com").orElse(null);
        Broker broker = null;
        if (brokerUser == null) {
            brokerUser = User.builder()
                    .name("Rahul Sharma")
                    .email("broker@househub.com")
                    .mobile("9876543210")
                    .password(passwordEncoder.encode("Broker@123"))
                    .role(Role.ROLE_BROKER)
                    .status("ACTIVE")
                    .build();
            brokerUser = userRepository.save(brokerUser);

            broker = Broker.builder()
                    .user(brokerUser)
                    .brokerCode("BRK-2026-1001")
                    .agencyName("Sharma Real Estate & Properties")
                    .address("Near City Center, Sardarpura")
                    .city("Jodhpur")
                    .experience("5-10 Years")
                    .idProofUrl("https://images.unsplash.com/photo-1554224155-8d04cb21cd6c")
                    .addressProofUrl("https://images.unsplash.com/photo-1554224155-8d04cb21cd6c")
                    .verificationStatus(VerificationStatus.APPROVED)
                    .approvedBy(admin.getUserId())
                    .approvedAt(LocalDateTime.now())
                    .build();
            broker = brokerRepository.save(broker);
            System.out.println("🏢 Initial Approved Broker created: broker@househub.com / Broker@123 (Code: BRK-2026-1001)");
        } else {
            broker = brokerRepository.findByUser(brokerUser).orElse(null);
        }

        // ==========================================
        // 3. SEED DEFAULT PENDING BROKER (FOR ADMIN TESTING)
        // ==========================================
        if (!userRepository.existsByEmail("pending.broker@househub.com")) {
            User pendingUser = User.builder()
                    .name("Amit Verma")
                    .email("pending.broker@househub.com")
                    .mobile("9811223344")
                    .password(passwordEncoder.encode("Broker@123"))
                    .role(Role.ROLE_BROKER)
                    .status("PENDING")
                    .build();
            pendingUser = userRepository.save(pendingUser);

            Broker pendingBroker = Broker.builder()
                    .user(pendingUser)
                    .brokerCode(null) // Assigned upon approval
                    .agencyName("Verma Associates")
                    .address("Ratanada Main Market")
                    .city("Jodhpur")
                    .experience("3-5 Years")
                    .idProofUrl("https://images.unsplash.com/photo-1554224155-8d04cb21cd6c")
                    .addressProofUrl("https://images.unsplash.com/photo-1554224155-8d04cb21cd6c")
                    .verificationStatus(VerificationStatus.PENDING)
                    .build();
            brokerRepository.save(pendingBroker);
            System.out.println("🏢 Sample Pending Broker created: pending.broker@househub.com / Broker@123");
        }

        // ==========================================
        // 4. SEED DEFAULT CUSTOMER
        // ==========================================
        User customerUser = userRepository.findByEmail("customer@househub.com").orElse(null);
        if (customerUser == null) {
            customerUser = User.builder()
                    .name("Bhavesh Patel")
                    .email("customer@househub.com")
                    .mobile("9822334455")
                    .password(passwordEncoder.encode("Customer@123"))
                    .role(Role.ROLE_CUSTOMER)
                    .status("ACTIVE")
                    .build();
            customerUser = userRepository.save(customerUser);

            Customer customer = Customer.builder()
                    .user(customerUser)
                    .preferredCity("Jodhpur")
                    .preferredPurpose("RENT")
                    .build();
            customerRepository.save(customer);
            System.out.println("👤 Initial Customer created: customer@househub.com / Customer@123");
        }

        // ==========================================
        // 5. SEED SAMPLE VERIFIED PROPERTIES (IF NONE EXIST)
        // ==========================================
        if (propertyRepository.count() == 0 && broker != null) {
            // Property 1 - For Rent
            Property prop1 = Property.builder()
                    .broker(broker)
                    .title("Luxury 3 BHK Semi-Furnished Flat")
                    .description("Spacious 3 BHK apartment with modular kitchen, lift, 24/7 water supply, power backup, and dedicated car parking.")
                    .propertyType(PropertyType.APARTMENT)
                    .purpose(Purpose.RENT)
                    .price(25000.0)
                    .address("Shastri Nagar, C-Road")
                    .city("Jodhpur")
                    .state("Rajasthan")
                    .bhk(3)
                    .bathrooms(2)
                    .areaSqft(1650.0)
                    .furnishedStatus("Semi-Furnished")
                    .parking(true)
                    .amenities("Lift, Covered Parking, Security, Power Backup, Water Storage")
                    .verificationStatus(VerificationStatus.APPROVED)
                    .propertyStatus(PropertyStatus.AVAILABLE)
                    .approvedBy(admin.getUserId())
                    .approvedAt(LocalDateTime.now())
                    .images(new ArrayList<>())
                    .build();

            PropertyImage img1 = PropertyImage.builder()
                    .property(prop1)
                    .imageUrl("https://images.unsplash.com/photo-1545324418-cc1a3fa10c00")
                    .isPrimary(true)
                    .build();
            prop1.getImages().add(img1);
            propertyRepository.save(prop1);

            // Property 2 - For Sale
            Property prop2 = Property.builder()
                    .broker(broker)
                    .title("Modern 4 BHK Independent Luxury Villa")
                    .description("Brand new 4 BHK independent duplex villa with private garden, modern interiors, modular fittings, and rooftop terrace.")
                    .propertyType(PropertyType.VILLA)
                    .purpose(Purpose.BUY)
                    .price(8500000.0)
                    .address("Pal Road, Near DPS Circle")
                    .city("Jodhpur")
                    .state("Rajasthan")
                    .bhk(4)
                    .bathrooms(4)
                    .areaSqft(2400.0)
                    .furnishedStatus("Furnished")
                    .parking(true)
                    .amenities("Private Garden, CCTV Security, Modular Kitchen, Terrace, Gated Society")
                    .verificationStatus(VerificationStatus.APPROVED)
                    .propertyStatus(PropertyStatus.AVAILABLE)
                    .approvedBy(admin.getUserId())
                    .approvedAt(LocalDateTime.now())
                    .images(new ArrayList<>())
                    .build();

            PropertyImage img2 = PropertyImage.builder()
                    .property(prop2)
                    .imageUrl("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9")
                    .isPrimary(true)
                    .build();
            prop2.getImages().add(img2);
            propertyRepository.save(prop2);

            System.out.println("🏠 Sample approved properties seeded for broker: BRK-2026-1001");
        }

        // ==========================================
        // 6. SEED SAMPLE COMPLAINT (IF NONE EXIST)
        // ==========================================
        if (reportRepository.count() == 0 && customerUser != null) {
            Report sampleReport = Report.builder()
                    .reporter(customerUser)
                    .targetType("PROPERTY")
                    .targetId(1L)
                    .targetTitle("Luxury 3 BHK Semi-Furnished Flat")
                    .reason("Contact details inquiry response delay")
                    .description("I submitted an inquiry 2 days ago regarding rental advance and have not heard back from the broker yet.")
                    .status("PENDING")
                    .build();
            reportRepository.save(sampleReport);
            System.out.println("⚠️ Sample customer report seeded for Admin testing.");
        }
    }
}
