-- ==========================================================
-- 🏠 House Rental & Buyer App - MySQL Database Schema
-- Database: house_rental_db
-- ==========================================================

CREATE DATABASE IF NOT EXISTS house_rental_db;
USE house_rental_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mobile VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL, -- ROLE_CUSTOMER, ROLE_BROKER, ROLE_ADMIN
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PENDING, SUSPENDED, REJECTED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Brokers Table (RULE 1: Verification Status)
CREATE TABLE IF NOT EXISTS brokers (
    broker_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    broker_code VARCHAR(50) UNIQUE, -- Assigned upon Admin Approval
    agency_name VARCHAR(150),
    address VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    experience VARCHAR(50),
    id_proof_url VARCHAR(255),
    address_proof_url VARCHAR(255),
    verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, SUSPENDED
    rejection_reason VARCHAR(500),
    approved_by BIGINT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    customer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    preferred_city VARCHAR(100),
    preferred_purpose VARCHAR(20), -- RENT, BUY
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 4. Properties Table (RULE 2: Property Verification)
CREATE TABLE IF NOT EXISTS properties (
    property_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    broker_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    property_type VARCHAR(30) NOT NULL, -- APARTMENT, INDEPENDENT_HOUSE, VILLA, STUDIO, COMMERCIAL
    purpose VARCHAR(20) NOT NULL, -- RENT, BUY
    price DECIMAL(12, 2) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    bhk INT NOT NULL,
    bathrooms INT,
    area_sqft DECIMAL(10, 2),
    furnished_status VARCHAR(50),
    parking_available BOOLEAN DEFAULT FALSE,
    amenities VARCHAR(500),
    verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    property_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, RENTED, SOLD, ARCHIVED
    rejection_reason VARCHAR(500),
    approved_by BIGINT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (broker_id) REFERENCES brokers(broker_id) ON DELETE CASCADE
);

-- 5. Property Images Table
CREATE TABLE IF NOT EXISTS property_images (
    image_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    property_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE
);

-- 6. In-App Chat Rooms Table (RULE 3: Privacy by Design)
CREATE TABLE IF NOT EXISTS chats (
    chat_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    broker_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (broker_id) REFERENCES brokers(broker_id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE
);

-- 7. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 8. Inquiries Table
CREATE TABLE IF NOT EXISTS inquiries (
    inquiry_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    broker_reply TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE
);

-- 9. Visits Table
CREATE TABLE IF NOT EXISTS visits (
    visit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    visit_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    notes VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE
);

-- 10. Wishlists Table
CREATE TABLE IF NOT EXISTS wishlists (
    wishlist_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_customer_property (customer_id, property_id),
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE
);
