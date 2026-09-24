// ==========================================================
// 🏠 HouseHub - Centralized API Service (Frontend <-> Backend)
// Base URL: Spring Boot Backend
// ==========================================================

const API_BASE_URL = "http://localhost:8080/api";

const api = {
    // Helper to get stored auth token
    getToken() {
        return localStorage.getItem("jwtToken");
    },

    // Helper to get current user info
    getCurrentUser() {
        return {
            token: localStorage.getItem("jwtToken"),
            role: localStorage.getItem("userRole"),
            email: localStorage.getItem("userEmail"),
            name: localStorage.getItem("userName"),
            userId: localStorage.getItem("userId"),
            brokerCode: localStorage.getItem("brokerCode")
        };
    },

    // Save auth data to localStorage
    saveAuth(authData) {
        if (authData.token) localStorage.setItem("jwtToken", authData.token);
        if (authData.role) localStorage.setItem("userRole", authData.role);
        if (authData.email) localStorage.setItem("userEmail", authData.email);
        if (authData.name) localStorage.setItem("userName", authData.name);
        if (authData.userId) localStorage.setItem("userId", authData.userId);
        if (authData.brokerCode) localStorage.setItem("brokerCode", authData.brokerCode);
    },

    // Clear auth on logout
    clearAuth() {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        localStorage.removeItem("userId");
        localStorage.removeItem("brokerCode");
        localStorage.removeItem("selectedPropertyId");
        localStorage.removeItem("currentChatId");
    },

    // Core Fetch Wrapper
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const errorMessage = (data && data.message) ? data.message : `HTTP Error ${response.status}`;
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error.message);
            throw error;
        }
    },

    // ==========================================
    // 🔐 AUTHENTICATION APIS
    // ==========================================

    async login(email, password) {
        const response = await this.request("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });
        if (response.success && response.data) {
            this.saveAuth(response.data);
        }
        return response;
    },

    async registerCustomer(customerData) {
        const response = await this.request("/auth/customer/register", {
            method: "POST",
            body: JSON.stringify(customerData)
        });
        if (response.success && response.data) {
            this.saveAuth(response.data);
        }
        return response;
    },

    async registerBroker(brokerData) {
        return await this.request("/auth/broker/register", {
            method: "POST",
            body: JSON.stringify(brokerData)
        });
    },

    // ==========================================
    // 🛡️ ADMIN VERIFICATION APIS (RULE 1, 2, 4)
    // ==========================================

    async getPendingBrokers() {
        return await this.request("/admin/brokers/pending", { method: "GET" });
    },

    async approveBroker(brokerId, remarks = "") {
        return await this.request(`/admin/brokers/${brokerId}/approve`, {
            method: "PUT",
            body: JSON.stringify({ remarks })
        });
    },

    async rejectBroker(brokerId, reason = "Documents could not be verified.") {
        return await this.request(`/admin/brokers/${brokerId}/reject?reason=${encodeURIComponent(reason)}`, {
            method: "PUT"
        });
    },

    async getPendingProperties() {
        return await this.request("/admin/properties/pending", { method: "GET" });
    },

    async approveProperty(propertyId, remarks = "") {
        return await this.request(`/admin/properties/${propertyId}/approve`, {
            method: "PUT",
            body: JSON.stringify({ remarks })
        });
    },

    async rejectProperty(propertyId, reason = "Details do not meet guidelines.") {
        return await this.request(`/admin/properties/${propertyId}/reject?reason=${encodeURIComponent(reason)}`, {
            method: "PUT"
        });
    },

    async getAdminStats() {
        return await this.request("/admin/stats", { method: "GET" });
    },

    async getAdminCustomers() {
        return await this.request("/admin/customers", { method: "GET" });
    },

    async getApprovedBrokers() {
        return await this.request("/admin/brokers/approved", { method: "GET" });
    },

    async getAdminReports() {
        return await this.request("/admin/reports", { method: "GET" });
    },

    async updateReportStatus(reportId, status, remarks = "") {
        return await this.request(`/admin/reports/${reportId}/status?status=${status.toUpperCase()}&remarks=${encodeURIComponent(remarks)}`, {
            method: "PUT"
        });
    },

    async submitReport(reportData) {
        return await this.request("/reports", {
            method: "POST",
            body: JSON.stringify(reportData)
        });
    },

    // ==========================================
    // 🏠 PROPERTY APIS
    // ==========================================

    async getPublicProperties() {
        return await this.request("/properties", { method: "GET" });
    },

    async searchProperties(filters = {}) {
        const params = new URLSearchParams();
        if (filters.city) params.append("city", filters.city);
        if (filters.purpose) params.append("purpose", filters.purpose.toUpperCase());
        if (filters.propertyType) params.append("propertyType", filters.propertyType.toUpperCase());
        if (filters.bhk) params.append("bhk", filters.bhk);
        if (filters.minPrice) params.append("minPrice", filters.minPrice);
        if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);

        const query = params.toString() ? `?${params.toString()}` : "";
        return await this.request(`/properties/search${query}`, { method: "GET" });
    },

    async getPropertyById(id) {
        return await this.request(`/properties/${id}`, { method: "GET" });
    },

    async addProperty(propertyData) {
        return await this.request("/properties", {
            method: "POST",
            body: JSON.stringify(propertyData)
        });
    },

    async getMyProperties() {
        return await this.request("/properties/my-properties", { method: "GET" });
    },

    async updatePropertyStatus(id, status) {
        return await this.request(`/properties/${id}/status?status=${status.toUpperCase()}`, {
            method: "PUT"
        });
    },

    // ==========================================
    // 💬 IN-APP CHAT APIS (RULE 3)
    // ==========================================

    async createOrGetChat(propertyId) {
        return await this.request(`/chats?propertyId=${propertyId}`, { method: "POST" });
    },

    async getUserChats() {
        return await this.request("/chats", { method: "GET" });
    },

    async getChatMessages(chatId) {
        return await this.request(`/chats/${chatId}/messages`, { method: "GET" });
    },

    async sendMessage(chatId, message) {
        return await this.request(`/chats/${chatId}/messages`, {
            method: "POST",
            body: JSON.stringify({ message })
        });
    },

    async markChatAsRead(chatId) {
        return await this.request(`/chats/${chatId}/read`, { method: "PUT" });
    },

    // ==========================================
    // ❤️ WISHLIST APIS
    // ==========================================

    async getWishlist() {
        return await this.request("/wishlist", { method: "GET" });
    },

    async addToWishlist(propertyId) {
        return await this.request(`/wishlist/${propertyId}`, { method: "POST" });
    },

    async removeFromWishlist(propertyId) {
        return await this.request(`/wishlist/${propertyId}`, { method: "DELETE" });
    },

    // ==========================================
    // 📩 INQUIRIES & VISITS APIS
    // ==========================================

    async sendInquiry(propertyId, message) {
        return await this.request("/inquiries", {
            method: "POST",
            body: JSON.stringify({ propertyId, message })
        });
    },

    async getCustomerInquiries() {
        return await this.request("/inquiries/customer", { method: "GET" });
    },

    async getBrokerInquiries() {
        return await this.request("/inquiries/broker", { method: "GET" });
    },

    async replyInquiry(inquiryId, reply) {
        return await this.request(`/inquiries/${inquiryId}?reply=${encodeURIComponent(reply)}`, {
            method: "PUT"
        });
    },

    async scheduleVisit(propertyId, visitDate, timeSlot, notes = "") {
        return await this.request("/visits", {
            method: "POST",
            body: JSON.stringify({ propertyId, visitDate, timeSlot, notes })
        });
    },

    async getCustomerVisits() {
        return await this.request("/visits/customer", { method: "GET" });
    },

    async getBrokerVisits() {
        return await this.request("/visits/broker", { method: "GET" });
    },

    async updateVisitStatus(visitId, status) {
        return await this.request(`/visits/${visitId}?status=${status.toUpperCase()}`, {
            method: "PUT"
        });
    }
};

// Global attachment for plain script tags
window.api = api;
