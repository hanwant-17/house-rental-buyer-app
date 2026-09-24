# 🚀 HouseHub — Spring Boot Backend Quickstart Guide

Ye guide tumhare backend development aur testing ke liye banayi gayi hai. Isme project ka setup, architecture, MySQL configuration, aur Postman testing examples diye gaye hain.

---

## 🛠️ 1. Prerequisites
- **Java**: JDK 17 ya higher
- **MySQL**: MySQL Server 8.x running on `localhost:3306`
- **IDE**: IntelliJ IDEA, VS Code (Extension: Spring Boot Extension Pack), ya Eclipse
- **Postman**: API testing ke liye

---

## 🗄️ 2. Database Setup

1. MySQL Workbench ya terminal open karo aur login karo:
```sql
CREATE DATABASE house_rental_db;
```

2. `src/main/resources/application.properties` mein apna MySQL password check karo:
```properties
spring.datasource.username=root
spring.datasource.password=root   <-- apna password yahan likhein agar alag hai
```
> Note: `spring.jpa.hibernate.ddl-auto=update` set hai, isliye tables Spring Boot launch hone par automatically generate ho jayengi! Agar manually create karni hon to `schema.sql` file `src/main/resources/` mein available hai.

---

## 🚀 3. How to Run the Application

### Option A: IntelliJ IDEA (Recommended)
1. Open IntelliJ IDEA ➔ Click **Open** ➔ Select the `Backend` directory.
2. Maven dependencies automatically download hongi.
3. Open `src/main/java/com/houseapp/HouseRentalApplication.java`.
4. Right-click ➔ Click **Run 'HouseRentalApplication'**.

### Option B: Terminal / Command Line
```bash
cd Backend
mvn clean spring-boot:run
```

Jab application start ho jayegi, terminal par dikhega:
```
==================================================
🏠 House Rental & Buyer App Backend Started!
🌐 Server URL: http://localhost:8080
--------------------------------------------------
🛡️ Initial Super Admin account created automatically:
📧 Email: admin@househub.com
🔑 Password: Admin@123
==================================================
```

---

## 🎯 4. The 4 Golden Rules in Backend Code

| Rule | How It Is Handled in Code |
|:---|:---|
| **RULE 1: Broker Verification** | Broker registration par status `PENDING` rehta hai (`AuthService.java`). Jab tak Admin verify nahi karta, broker login nahi kar sakta aur Broker ID assign nahi hoti (`BrokerService.java`). |
| **RULE 2: Property Verification** | Property add hone par initially `PENDING` rehti hai (`PropertyService.java`). Customer search aur listing APIs mein sirf `APPROVED` properties aati hain. |
| **RULE 3: Privacy by Design** | In-app chat messages aur chat room APIs (`ChatController.java`) mein Customer ka mobile number aur email hide rehta hai. |
| **RULE 4: Admin Exclusive Governance** | Admin verification endpoints (`/api/admin/**`) `ROLE_ADMIN` ke dwara protected hain (`@PreAuthorize("hasAuthority('ROLE_ADMIN')")`). |

---

## 🧪 5. Postman Testing Guide & JSON Payloads

### Step 1: Admin Login
- **URL**: `POST http://localhost:8080/api/auth/login`
- **Body (JSON)**:
```json
{
  "email": "admin@househub.com",
  "password": "Admin@123"
}
```
- **Response**: Copy the `token` (JWT token).

---

### Step 2: Register New Customer
- **URL**: `POST http://localhost:8080/api/auth/customer/register`
- **Body (JSON)**:
```json
{
  "name": "Hanwant Singh",
  "mobile": "9876543210",
  "email": "hanwant@example.com",
  "password": "Customer@123",
  "city": "Jodhpur",
  "userType": "RENT"
}
```
- **Response**: Immediate 201 Created with JWT token. Customer can log in immediately.

---

### Step 3: Register New Broker
- **URL**: `POST http://localhost:8080/api/auth/broker/register`
- **Body (JSON)**:
```json
{
  "name": "Rahul Sharma",
  "mobile": "9123456780",
  "email": "rahul@properties.com",
  "password": "Broker@123",
  "city": "Jodhpur",
  "agencyName": "Sharma Real Estate",
  "experience": "4 Years",
  "idProofUrl": "https://example.com/id.pdf",
  "addressProofUrl": "https://example.com/address.pdf"
}
```
- **Response**: Status = `PENDING`. (Broker cannot log in yet).

---

### Step 4: Admin Views Pending Brokers
- **URL**: `GET http://localhost:8080/api/admin/brokers/pending`
- **Header**: `Authorization: Bearer <ADMIN_JWT_TOKEN>`

---

### Step 5: Admin Approves Broker
- **URL**: `PUT http://localhost:8080/api/admin/brokers/1/approve`
- **Header**: `Authorization: Bearer <ADMIN_JWT_TOKEN>`
- **Body (Optional JSON)**:
```json
{
  "remarks": "Documents verified successfully.",
  "customBrokerCode": "BRK-2026-1001"
}
```
- **Result**: Broker status changes to `APPROVED`, Broker ID assigned (`BRK-2026-1001`), and Broker account is activated!

---

### Step 6: Broker Login
- **URL**: `POST http://localhost:8080/api/auth/login`
- **Body (JSON)**:
```json
{
  "email": "rahul@properties.com",
  "password": "Broker@123"
}
```
- **Response**: Returns Broker JWT Token with role `BROKER` and `brokerCode: BRK-2026-1001`.

---

### Step 7: Broker Adds Property
- **URL**: `POST http://localhost:8080/api/properties`
- **Header**: `Authorization: Bearer <BROKER_JWT_TOKEN>`
- **Body (JSON)**:
```json
{
  "title": "Luxury 3 BHK Flat in Ratanada",
  "description": "Spacious flat with modular kitchen and modular wardrobe.",
  "propertyType": "APARTMENT",
  "purpose": "RENT",
  "price": 25000,
  "address": "Opposite Circuit House, Ratanada",
  "city": "Jodhpur",
  "state": "Rajasthan",
  "bhk": 3,
  "bathrooms": 3,
  "areaSqft": 1850,
  "furnishedStatus": "Fully-Furnished",
  "parking": true,
  "amenities": "Lift, Security 24x7, Covered Parking, Power Backup",
  "imageUrls": [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00"
  ]
}
```
- **Result**: Property created with `verificationStatus = PENDING`. It is NOT visible to customers in public search yet!

---

### Step 8: Admin Approves Property
- **URL**: `PUT http://localhost:8080/api/admin/properties/1/approve`
- **Header**: `Authorization: Bearer <ADMIN_JWT_TOKEN>`
- **Result**: Property status becomes `APPROVED`. Now it is **LIVE**!

---

### Step 9: Customer Searches Properties
- **URL**: `GET http://localhost:8080/api/properties/search?city=Jodhpur&purpose=RENT`
- **Access**: Public (No token required!)
- **Result**: Newly approved property appears in search results.

---

### Step 10: In-App Chat (Rule 3)
- **Initiate Chat (Customer)**:
  `POST http://localhost:8080/api/chats?propertyId=1`
  Header: `Authorization: Bearer <CUSTOMER_JWT_TOKEN>`
- **Send Message**:
  `POST http://localhost:8080/api/chats/1/messages`
  Header: `Authorization: Bearer <CUSTOMER_OR_BROKER_TOKEN>`
  Body:
  ```json
  {
    "message": "Hi, is this property available for visiting this Sunday?"
  }
  ```
- **Fetch Message History**:
  `GET http://localhost:8080/api/chats/1/messages`
  *(Customer details like phone & email are never sent in chat payload)*
