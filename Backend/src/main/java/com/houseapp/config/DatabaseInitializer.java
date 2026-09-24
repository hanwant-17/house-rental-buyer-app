package com.houseapp.config;

import com.houseapp.entity.Role;
import com.houseapp.entity.User;
import com.houseapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Automatically seed default ADMIN account if none exists
        if (!userRepository.existsByEmail("admin@househub.com")) {
            User admin = User.builder()
                    .name("Super Admin")
                    .email("admin@househub.com")
                    .mobile("9999999999")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ROLE_ADMIN)
                    .status("ACTIVE")
                    .build();

            userRepository.save(admin);

            System.out.println("--------------------------------------------------");
            System.out.println("🛡️ Initial Super Admin account created automatically:");
            System.out.println("📧 Email: admin@househub.com");
            System.out.println("🔑 Password: Admin@123");
            System.out.println("--------------------------------------------------");
        }
    }
}
