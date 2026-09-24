package com.houseapp.repository;

import com.houseapp.entity.Role;
import com.houseapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByMobile(String mobile);
    Boolean existsByEmail(String email);
    Boolean existsByMobile(String mobile);
    List<User> findByRole(Role role);
}
