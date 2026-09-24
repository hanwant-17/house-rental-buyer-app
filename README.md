# 🏠 House Rental & Buyer App (HouseHub)

A full-stack, enterprise-grade web application for renting and buying residential properties with **Admin-Verified Listings** and **Privacy-Guarded In-App Broker-Customer Chat**.

> 📄 **Complete System Specifications**: Check [SRS.md](file:///c:/Users/HANWANT%20SINGH/Desktop/House-rental-Buyer-App/SRS.md) for the complete 17-section Software Requirements Specification, Mermaid system flowcharts, database schemas, and API contracts.

---

## 🎯 4 Core Architectural Rules

1. **Mandatory Broker Verification**: Any new broker registration defaults to `PENDING`. Only after Admin approval is the account activated and an official **Broker ID** (e.g. `BRK-2026-1001`) generated.
2. **Mandatory Property Verification**: No property listing goes live directly. It enters a `PENDING` queue. Admin verifies documents and pricing before marking it `AVAILABLE` / `LIVE` for customers.
3. **Privacy-Guarded In-App Chat**: Customers and Brokers communicate directly inside the platform. Neither party is forced or prompted to disclose personal phone numbers or email addresses.
4. **Strict Admin Governance**: Only users with the `ADMIN` role have the authority to approve/reject brokers and properties.

---

## 📂 Project Structure

```
House-rental-Buyer-App/
├── SRS.md                  # Complete Official Software Requirements Specification
├── README.md               # Project documentation & overview
├── Frontend/               # Client-Side Application
│   ├── index.html          # Public Landing Page
│   ├── css/                # Styling (auth.css, dashboard.css, property.css, style.css)
│   ├── js/                 # Logic (auth.js, property.js, chat.js, api.js, main.js)
│   ├── pages/              # Role-specific and authentication screens
│   │   ├── login.html
│   │   ├── customer-register.html
│   │   ├── broker-register.html
│   │   ├── customer-dashboard.html
│   │   ├── broker-dashboard.html
│   │   ├── admin-dashboard.html
│   │   ├── broker-verification.html   # Admin broker approval queue
│   │   ├── property-verification.html # Admin property approval queue
│   │   ├── properties.html            # Public search & filter
│   │   ├── property-details.html      # Individual listing
│   │   ├── add-property.html          # Broker listing creator
│   │   ├── chat.html                  # Secure In-App Chat interface
│   │   └── wishlist.html
│   └── images/             # Visual banners & assets
└── Backend/                # Spring Boot REST API Service (Under Development)
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|:---|:---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Fetch API |
| **Backend** | Java 17+, Spring Boot 3.x (Spring Web, Spring Security, Spring Data JPA) |
| **Database** | MySQL 8.x |
| **API Format** | RESTful JSON |
| **Tools** | VS Code / IntelliJ IDEA, Postman, MySQL Workbench, Git & GitHub |

---

## 👥 Collaborative Workflow

- **Frontend Engineer**: Responsible for responsive UI pages, forms, validation, and API integration.
- **Backend Engineer**: Responsible for Spring Boot backend, MySQL schemas, security filters, and REST controllers.

Refer to **Section 14 & 15** in [SRS.md](file:///c:/Users/HANWANT%20SINGH/Desktop/House-rental-Buyer-App/SRS.md) for full endpoint specifications.