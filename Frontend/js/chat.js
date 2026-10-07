// ==========================================================
// 🏠 HouseHub - WhatsApp-Style Multi-Conversation In-App Chat
// Complete List Format for Brokers & Customers (RULE 3)
// ==========================================================

let allConversations = [];
let activeChatId = null;
let activeChatData = null;
let currentFilter = "all"; // 'all' or 'unread'
let searchKeyword = "";
let messagesPollingTimer = null;
let conversationsPollingTimer = null;

const currentUser = window.api ? window.api.getCurrentUser() : null;

// Initialization
document.addEventListener("DOMContentLoaded", async function () {
    if (!currentUser || !currentUser.token) {
        alert("Please login to access HouseHub in-app messaging.");
        window.location.href = "login.html";
        return;
    }

    setupUserInterface();
    await loadAllConversations();

    // Check if user came from a specific property listing
    const preselectedPropId = localStorage.getItem("selectedPropertyId");
    if (preselectedPropId && currentUser.role === "CUSTOMER") {
        await handlePreselectedPropertyChat(preselectedPropId);
    }

    // Set Enter key trigger on message input
    const msgInput = document.getElementById("chatMessageInput");
    if (msgInput) {
        msgInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendCurrentMessage();
            }
        });
    }

    // Background polling for conversation list updates (every 6 seconds)
    conversationsPollingTimer = setInterval(silentRefreshConversations, 6000);
});

// Setup User Profile in Top Bar & Sidebar
function setupUserInterface() {
    const isBroker = currentUser.role === "BROKER";
    const dashBtn = document.getElementById("backToDashBtn");
    if (dashBtn) {
        dashBtn.href = isBroker ? "broker-dashboard.html" : "customer-dashboard.html";
        dashBtn.textContent = isBroker ? "← Broker Dashboard" : "← Customer Dashboard";
    }

    const myNameEl = document.getElementById("myDisplayName");
    const myRoleEl = document.getElementById("myRolePill");
    const myAvatarEl = document.getElementById("myAvatarCircle");

    if (myNameEl) myNameEl.textContent = currentUser.name || "User";
    if (myRoleEl) {
        myRoleEl.textContent = isBroker ? "Verified Broker" : "Customer";
        if (isBroker) {
            myRoleEl.style.background = "#e6f4ea";
            myRoleEl.style.color = "#008069";
        } else {
            myRoleEl.style.background = "#eff6ff";
            myRoleEl.style.color = "#2563eb";
        }
    }
    if (myAvatarEl) {
        myAvatarEl.textContent = getInitials(currentUser.name || "Me");
        myAvatarEl.style.background = isBroker ? "linear-gradient(135deg, #008069, #128c7e)" : "linear-gradient(135deg, #2563eb, #1d4ed8)";
    }

    // Quick suggestion chips: ONLY show for Customer, NEVER for Broker
    const quickChipsBar = document.getElementById("quickChipsBar");
    if (quickChipsBar) {
        quickChipsBar.style.display = (currentUser.role === "CUSTOMER") ? "flex" : "none";
    }
}

// 1. Load All Conversations from Backend
async function loadAllConversations() {
    const container = document.getElementById("conversationsContainer");
    try {
        const response = await window.api.getUserChats();
        allConversations = response.data || [];
        updateConversationCounts();
        renderConversationsList();

        // If an active chat was open, re-highlight it
        if (activeChatId) {
            const found = allConversations.find(c => c.chatId === activeChatId);
            if (found) activeChatData = found;
        }
    } catch (err) {
        console.error("Failed to load user chats:", err);
        if (container) {
            container.innerHTML = `
                <div style="text-align:center; padding:30px 16px; color:#b91c1c;">
                    <p style="font-size:14px; font-weight:700;">Could not load conversations</p>
                    <small style="color:#64748b;">${err.message}</small>
                </div>
            `;
        }
    }
}

// Silent background refresh of conversations (no spinner flicker)
async function silentRefreshConversations() {
    try {
        const response = await window.api.getUserChats();
        allConversations = response.data || [];
        updateConversationCounts();
        renderConversationsList();
    } catch (e) {
        // quiet error
    }
}

// Update Top Badge Counts
function updateConversationCounts() {
    const allCountEl = document.getElementById("allCount");
    const unreadCountEl = document.getElementById("unreadCount");

    const total = allConversations.length;
    const unread = allConversations.filter(c => (c.unreadCount || 0) > 0).length;

    if (allCountEl) allCountEl.textContent = total;
    if (unreadCountEl) unreadCountEl.textContent = unread;
}

// Filter Tabs: 'all' vs 'unread'
function setFilterChip(filterType) {
    currentFilter = filterType;
    document.getElementById("chipAll")?.classList.toggle("active", filterType === "all");
    document.getElementById("chipUnread")?.classList.toggle("active", filterType === "unread");
    renderConversationsList();
}

function handleSearchConversations() {
    searchKeyword = (document.getElementById("chatSearchInput")?.value || "").toLowerCase().trim();
    renderConversationsList();
}

// Render Conversations in Left Sidebar List (WhatsApp style)
function renderConversationsList() {
    const container = document.getElementById("conversationsContainer");
    if (!container) return;

    let filtered = [...allConversations];

    // Filter by Unread
    if (currentFilter === "unread") {
        filtered = filtered.filter(c => (c.unreadCount || 0) > 0);
    }

    // Filter by Search Keyword
    if (searchKeyword) {
        filtered = filtered.filter(c => {
            const isBrokerUser = currentUser.role === "BROKER";
            const partnerName = isBrokerUser ? (c.customer?.name || "") : (c.broker?.user?.name || c.broker?.agencyName || "");
            const propTitle = c.property?.title || "";
            const lastMsg = c.lastMessage || "";
            return partnerName.toLowerCase().includes(searchKeyword) ||
                   propTitle.toLowerCase().includes(searchKeyword) ||
                   lastMsg.toLowerCase().includes(searchKeyword);
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:45px 20px; color:#667781;">
                <div style="font-size:36px; margin-bottom:8px;">💬</div>
                <div style="font-size:15px; font-weight:700; color:#111b21;">No conversations found</div>
                <p style="font-size:13px; margin-top:4px;">
                    ${searchKeyword ? "No chats matched your search." : (currentUser.role === "BROKER" ? "Customer inquiries regarding your properties will appear here." : "Browse properties and click 'Chat with Broker' to start!")}
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    filtered.forEach(chat => {
        const item = createConversationItemElement(chat);
        container.appendChild(item);
    });
}

// Create DOM Element for Single Conversation in WhatsApp List
function createConversationItemElement(chat) {
    const isBrokerUser = currentUser.role === "BROKER";

    // Participant details
    let partnerName = "User";
    let partnerSubtitle = "";
    let isPartnerBroker = false;

    if (isBrokerUser) {
        partnerName = chat.customer?.name || "Customer";
        partnerSubtitle = "Customer";
    } else {
        partnerName = (chat.broker?.user?.name) || (chat.broker?.agencyName) || "Verified Broker";
        partnerSubtitle = chat.broker?.agencyName || "Real Estate Broker";
        isPartnerBroker = true;
    }

    const initials = getInitials(partnerName);
    const propTitle = chat.property?.title || "Property Inquiry";
    const propPrice = chat.property ? `₹${Number(chat.property.price || 0).toLocaleString()}` : "";
    const lastMsgText = chat.lastMessage || "No messages yet";
    const timeFormatted = formatTimeDisplay(chat.lastMessageTime || chat.createdAt);
    const unread = Number(chat.unreadCount || 0);

    const div = document.createElement("div");
    div.className = `conversation-item ${chat.chatId === activeChatId ? 'active' : ''}`;
    div.onclick = () => selectConversation(chat.chatId);

    div.innerHTML = `
        <div class="contact-avatar ${isPartnerBroker ? 'is-broker' : 'is-customer'}">
            ${initials}
            <span class="online-dot"></span>
        </div>

        <div class="conversation-details">
            <div class="conv-top-row">
                <span class="contact-name">${escapeHtml(partnerName)}</span>
                <span class="last-time">${timeFormatted}</span>
            </div>

            <div class="conv-property-tag">
                🏠 ${escapeHtml(propTitle)} ${propPrice ? '• ' + propPrice : ''}
            </div>

            <div class="conv-bottom-row">
                <span class="last-message-snippet">
                    ${escapeHtml(lastMsgText)}
                </span>
                ${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ''}
            </div>
        </div>
    `;

    return div;
}

// =========================================================
// 2. SELECT CONVERSATION & OPEN WHATSAPP CHAT THREAD
// =========================================================
async function selectConversation(chatId) {
    activeChatId = chatId;
    activeChatData = allConversations.find(c => c.chatId === chatId);

    // Stop previous thread polling
    if (messagesPollingTimer) {
        clearInterval(messagesPollingTimer);
        messagesPollingTimer = null;
    }

    // Update active highlight in sidebar list
    document.querySelectorAll(".conversation-item").forEach(el => el.classList.remove("active"));
    renderConversationsList();

    // Show Chat Panel & Hide Empty State
    const emptyState = document.getElementById("emptyChatState");
    const activeWrapper = document.getElementById("activeChatWrapper");
    if (emptyState) emptyState.style.display = "none";
    if (activeWrapper) activeWrapper.style.display = "flex";

    // Setup Active Header Details
    setupActiveChatHeader(activeChatData);

    // Initial messages load
    await loadActiveChatMessages(chatId, false);

    // Mark as read in backend
    window.api.markChatAsRead(chatId).then(() => {
        if (activeChatData) activeChatData.unreadCount = 0;
        updateConversationCounts();
        renderConversationsList();
    }).catch(() => {});

    // Start Real-Time Live Polling for Messages (every 2.5 seconds)
    messagesPollingTimer = setInterval(() => {
        loadActiveChatMessages(chatId, true);
    }, 2500);

    // Toggle quick chips: ONLY for CUSTOMER, never for Broker
    const quickChipsBar = document.getElementById("quickChipsBar");
    if (quickChipsBar) {
        quickChipsBar.style.display = (currentUser.role === "CUSTOMER") ? "flex" : "none";
    }

    // Focus input field
    const msgInput = document.getElementById("chatMessageInput");
    if (msgInput) {
        msgInput.disabled = false;
        msgInput.focus();
    }
}

// Populate Active Chat Top Header
function setupActiveChatHeader(chat) {
    if (!chat) return;

    const isBrokerUser = currentUser.role === "BROKER";
    let partnerName = "User";
    let partnerRole = "Verified User";

    if (isBrokerUser) {
        partnerName = chat.customer?.name || "Customer";
        partnerRole = "Customer Inquiry";
    } else {
        partnerName = chat.broker?.user?.name || chat.broker?.agencyName || "Verified Broker";
        const code = chat.broker?.brokerCode ? ` (${chat.broker.brokerCode})` : "";
        partnerRole = `${chat.broker?.agencyName || "Licensed Broker"}${code}`;
    }

    const nameEl = document.getElementById("activePartnerName");
    const subtitleEl = document.getElementById("activePartnerSubtitle");
    const avatarEl = document.getElementById("activePartnerAvatar");

    if (nameEl) nameEl.textContent = partnerName;
    if (subtitleEl) subtitleEl.innerHTML = `<span style="color:#25d366; font-size:10px;">●</span> Online • ${escapeHtml(partnerRole)}`;
    if (avatarEl) {
        avatarEl.textContent = getInitials(partnerName);
        avatarEl.className = `contact-avatar ${isBrokerUser ? 'is-customer' : 'is-broker'}`;
    }

    // Mini Property Dossier in Header
    const prop = chat.property;
    const dossierTitleEl = document.getElementById("dossierPropTitle");
    const dossierPriceEl = document.getElementById("dossierPropPrice");
    const dossierViewBtn = document.getElementById("dossierViewBtn");

    if (prop) {
        if (dossierTitleEl) dossierTitleEl.textContent = prop.title;
        if (dossierPriceEl) {
            const isRent = (prop.purpose || "RENT").toUpperCase() === "RENT";
            dossierPriceEl.textContent = `₹${Number(prop.price || 0).toLocaleString()} ${isRent ? '/ mo' : ''}`;
        }
        if (dossierViewBtn) {
            dossierViewBtn.href = `property-details.html?id=${prop.propertyId}`;
            dossierViewBtn.title = "View complete property specifications";
            dossierViewBtn.onclick = (e) => {
                e.preventDefault();
                openChatPropertyModal(prop.propertyId);
            };
        }
    }
}

// 3. Load Messages for Active Conversation
async function loadActiveChatMessages(chatId, isBackgroundPoll = false) {
    if (activeChatId !== chatId) return;
    const messagesThreadArea = document.getElementById("messagesThreadArea");
    if (!messagesThreadArea) return;

    try {
        const response = await window.api.getChatMessages(chatId);
        const messageList = response.data || [];

        // Check if there are new messages or if count changed
        const currentBubbleCount = messagesThreadArea.querySelectorAll(".chat-bubble").length;
        if (isBackgroundPoll && messageList.length === currentBubbleCount) {
            return; // No new message, don't re-render or flicker
        }

        messagesThreadArea.innerHTML = "";

        if (messageList.length === 0) {
            messagesThreadArea.innerHTML = `
                <div style="text-align:center; padding:50px 20px; color:#667781;">
                    <div style="font-size:32px; margin-bottom:8px;">🔒</div>
                    <div style="font-size:14px; font-weight:700; color:#111b21;">End-to-End In-App Privacy Protected</div>
                    <p style="font-size:13px; max-width:400px; margin:6px auto 0; line-height:1.5;">
                        Communicate safely. Your mobile number and personal email remain private. Send a greeting to start!
                    </p>
                </div>
            `;
            return;
        }

        // Add date divider badge
        const dateBadge = document.createElement("div");
        dateBadge.className = "date-separator-badge";
        dateBadge.textContent = "TODAY";
        messagesThreadArea.appendChild(dateBadge);

        messageList.forEach(msg => {
            const isMe = String(msg.senderId) === String(currentUser.userId);
            const bubble = document.createElement("div");
            bubble.className = `chat-bubble ${isMe ? 'bubble-sent' : 'bubble-received'}`;

            const timeStr = msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

            bubble.innerHTML = `
                ${!isMe ? `<div class="bubble-sender-name">${escapeHtml(msg.senderName || "Contact")}</div>` : ''}
                <div style="font-size:14.5px; line-height:1.45;">${escapeHtml(msg.message)}</div>
                <div class="bubble-meta">
                    <span class="bubble-time">${timeStr}</span>
                    ${isMe ? `<span class="bubble-check">✓✓</span>` : ''}
                </div>
            `;
            messagesThreadArea.appendChild(bubble);
        });

        // Scroll to bottom
        messagesThreadArea.scrollTop = messagesThreadArea.scrollHeight;

        // Auto mark as read
        if (!isBackgroundPoll) {
            window.api.markChatAsRead(chatId).catch(() => {});
        }
    } catch (err) {
        if (!isBackgroundPoll) {
            console.error("Failed to load messages:", err);
        }
    }
}

// 4. Send Message in Active Conversation
async function handleSendCurrentMessage() {
    if (!activeChatId) return;
    const input = document.getElementById("chatMessageInput");
    const sendBtn = document.getElementById("sendMsgBtn");
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    input.focus();

    try {
        await window.api.sendMessage(activeChatId, text);
        // Instant reload
        await loadActiveChatMessages(activeChatId, false);
        // Refresh conversations list to update snippet & order
        await silentRefreshConversations();
    } catch (err) {
        alert("Failed to send message: " + err.message);
    }
}

// Insert quick suggestion chips
function insertQuickMessage(text) {
    const input = document.getElementById("chatMessageInput");
    if (input) {
        input.value = text;
        input.focus();
    }
}

// 5. Clear Current Chat
async function handleClearCurrentChat() {
    if (!activeChatId) return;

    const confirmed = confirm(
        "Are you sure you want to clear all messages in this conversation?\n\n" +
        "⚠️ This will clear the chat history for both participants."
    );
    if (!confirmed) return;

    try {
        await window.api.clearChat(activeChatId);
        await loadActiveChatMessages(activeChatId, false);
        await loadAllConversations();
    } catch (err) {
        alert("Failed to clear chat: " + err.message);
    }
}

// Handle preselected property coming from property listing
async function handlePreselectedPropertyChat(propertyId) {
    localStorage.removeItem("selectedPropertyId");
    try {
        const chatRes = await window.api.createOrGetChat(propertyId);
        if (chatRes.data) {
            await loadAllConversations();
            selectConversation(chatRes.data.chatId);
        }
    } catch (err) {
        console.warn("Could not auto-open chat for property:", err);
    }
}

// Helper: Initials generator
function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Helper: Time display
function formatTimeDisplay(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Helper: Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/['"&<>]/g, function (m) {
        return {
            "'": '&#39;',
            '"': '&quot;',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        }[m];
    });
}

// =========================================================
// 6. IN-CHAT PROPERTY DETAILS MODAL
// =========================================================
let currentChatModalImages = [];
let currentChatModalIdx = 0;

async function openChatPropertyModal(propertyId) {
    const modalOverlay = document.getElementById("chatPropertyModal");
    const modalBox = document.getElementById("chatPropertyModalBox");
    if (!modalOverlay || !modalBox) {
        window.location.href = `property-details.html?id=${propertyId}`;
        return;
    }

    modalBox.innerHTML = `
        <div style="padding:40px; text-align:center; color:#64748b;">
            <p style="font-size:15px; font-weight:600;">Loading property specifications...</p>
        </div>
    `;
    modalOverlay.style.display = "flex";

    try {
        const res = await window.api.getPropertyById(propertyId);
        const prop = res.data;
        if (!prop) {
            modalBox.innerHTML = `<div style="padding:30px; text-align:center;">Property details not found.</div>`;
            return;
        }

        let imagesList = [];
        if (prop.images && prop.images.length > 0) {
            imagesList = prop.images.map(img => img.imageUrl);
        } else if (prop.image) {
            imagesList = [prop.image];
        } else {
            imagesList = ["../images/flat-banner.jpg"];
        }
        currentChatModalImages = imagesList;
        currentChatModalIdx = 0;

        const purpose = (prop.purpose || "RENT").toUpperCase();
        const isRent = purpose === "RENT";
        const priceFormatted = Number(prop.price || 0).toLocaleString();
        const priceDisplay = isRent ? `₹${priceFormatted} / month` : `₹${priceFormatted}`;

        modalBox.innerHTML = `
            <div style="padding:18px 24px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; background:#fff; position:sticky; top:0; z-index:10;">
                <div>
                    <span style="background:${isRent ? '#eff6ff' : '#faf5ff'}; color:${isRent ? '#1d4ed8' : '#7e22ce'}; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; text-transform:uppercase;">
                        For ${purpose}
                    </span>
                    <h2 style="margin:4px 0 0; font-size:20px; font-weight:700; color:#0f172a;">${escapeHtml(prop.title)}</h2>
                    <div style="font-size:13px; color:#64748b; margin-top:2px;">📍 ${escapeHtml(prop.address || '')}, ${escapeHtml(prop.city || 'Jodhpur')}</div>
                </div>
                <button onclick="closeChatPropertyModal()" style="background:#f1f5f9; border:none; width:34px; height:34px; border-radius:50%; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
            </div>

            <div style="padding:22px; overflow-y:auto;">
                <!-- Photos Carousel -->
                <div style="background:#0f172a; border-radius:12px; overflow:hidden; position:relative; height:320px; display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
                    <img id="chatModalMainImg" src="${imagesList[0]}" alt="${escapeHtml(prop.title)}" style="max-height:100%; max-width:100%; object-fit:contain;">
                    ${imagesList.length > 1 ? `
                        <button type="button" onclick="changeChatModalSlide(-1)" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); background:rgba(15,23,42,0.75); color:#fff; border:1px solid rgba(255,255,255,0.3); width:38px; height:38px; border-radius:50%; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center;">❮</button>
                        <button type="button" onclick="changeChatModalSlide(1)" style="position:absolute; right:14px; top:50%; transform:translateY(-50%); background:rgba(15,23,42,0.75); color:#fff; border:1px solid rgba(255,255,255,0.3); width:38px; height:38px; border-radius:50%; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center;">❯</button>
                        <div style="position:absolute; bottom:12px; right:14px; background:rgba(15,23,42,0.85); color:#fff; padding:4px 12px; border-radius:16px; font-size:11px; font-weight:600;">
                            📷 <span id="chatModalImgCounter">1 / ${imagesList.length}</span> Photos
                        </div>
                    ` : ''}
                </div>

                <!-- Price Banner -->
                <div style="display:flex; justify-content:space-between; align-items:baseline; padding:14px 18px; background:#eff6ff; border-radius:12px; border:1px solid #bfdbfe; margin-bottom:20px;">
                    <div>
                        <span style="font-size:11px; color:#1d4ed8; text-transform:uppercase; font-weight:700;">Price / Rent</span>
                        <div style="font-size:24px; font-weight:800; color:#1d4ed8;">${priceDisplay}</div>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-size:11px; color:#64748b; text-transform:uppercase; font-weight:600;">Category</span>
                        <div style="font-size:15px; font-weight:700; color:#0f172a;">${escapeHtml(prop.propertyType || 'Apartment')}</div>
                    </div>
                </div>

                <!-- 12-Item Layout & Specifications Grid -->
                <h4 style="font-size:15px; color:#1e293b; margin:0 0 10px;">📐 Complete Layout & Specifications</h4>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-bottom:20px;">
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center;">
                        <span style="font-size:11px; color:#64748b; font-weight:600; display:block; margin-bottom:2px;">ROOMS</span>
                        <strong style="font-size:13px; color:#0f172a;">🛏️ ${prop.rooms || prop.bhk} Rooms (${prop.bhk} BHK)</strong>
                    </div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center;">
                        <span style="font-size:11px; color:#64748b; font-weight:600; display:block; margin-bottom:2px;">BATHROOMS</span>
                        <strong style="font-size:13px; color:#0f172a;">🚿 ${prop.bathrooms || 1} Baths</strong>
                    </div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center;">
                        <span style="font-size:11px; color:#64748b; font-weight:600; display:block; margin-bottom:2px;">KITCHEN</span>
                        <strong style="font-size:13px; color:#0f172a;">🍳 ${escapeHtml(prop.kitchen || 'Modular')}</strong>
                    </div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center;">
                        <span style="font-size:11px; color:#64748b; font-weight:600; display:block; margin-bottom:2px;">FLOOR NUMBER</span>
                        <strong style="font-size:13px; color:#0f172a;">🏢 ${escapeHtml(prop.floorNo ? prop.floorNo + (prop.totalFloors ? ' (of ' + prop.totalFloors + ')' : '') : 'Ground')}</strong>
                    </div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center;">
                        <span style="font-size:11px; color:#64748b; font-weight:600; display:block; margin-bottom:2px;">HALL / LIVING</span>
                        <strong style="font-size:13px; color:#0f172a;">🛋️ ${escapeHtml(prop.hall || '1 Hall')}</strong>
                    </div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center;">
                        <span style="font-size:11px; color:#64748b; font-weight:600; display:block; margin-bottom:2px;">BALCONIES</span>
                        <strong style="font-size:13px; color:#0f172a;">🌅 ${prop.balconies !== undefined && prop.balconies !== null ? prop.balconies : 1}</strong>
                    </div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center;">
                        <span style="font-size:11px; color:#64748b; font-weight:600; display:block; margin-bottom:2px;">SUPER AREA</span>
                        <strong style="font-size:13px; color:#0f172a;">📐 ${prop.areaSqft || 'N/A'} sq.ft</strong>
                    </div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center;">
                        <span style="font-size:11px; color:#64748b; font-weight:600; display:block; margin-bottom:2px;">FURNISHED</span>
                        <strong style="font-size:13px; color:#0f172a;">🛋️ ${escapeHtml(prop.furnishedStatus || 'Standard')}</strong>
                    </div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center;">
                        <span style="font-size:11px; color:#64748b; font-weight:600; display:block; margin-bottom:2px;">PARKING</span>
                        <strong style="font-size:13px; color:#0f172a;">🚗 ${prop.parking ? 'Available' : 'No'}</strong>
                    </div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center;">
                        <span style="font-size:11px; color:#64748b; font-weight:600; display:block; margin-bottom:2px;">FACING</span>
                        <strong style="font-size:13px; color:#0f172a;">🧭 ${escapeHtml(prop.facing || 'East')}</strong>
                    </div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center;">
                        <span style="font-size:11px; color:#64748b; font-weight:600; display:block; margin-bottom:2px;">PROPERTY AGE</span>
                        <strong style="font-size:13px; color:#0f172a;">⏳ ${escapeHtml(prop.propertyAge || 'New')}</strong>
                    </div>
                </div>

                <!-- Description & Amenities -->
                <h4 style="font-size:14px; color:#1e293b; margin:0 0 6px;">📝 Description</h4>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:16px; font-size:13.5px; color:#475467; line-height:1.6;">
                    ${escapeHtml(prop.description || 'No detailed description provided.')}
                </div>

                <h4 style="font-size:14px; color:#1e293b; margin:0 0 6px;">✨ Amenities</h4>
                <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
                    ${prop.amenities ? prop.amenities.split(',').map(a => `<span style="background:#f1f5f9; border:1px solid #cbd5e1; padding:3px 10px; border-radius:14px; font-size:12px;">✓ ${escapeHtml(a.trim())}</span>`).join('') : '<span style="color:#64748b; font-size:12px;">Basic amenities</span>'}
                </div>
            </div>

            <div style="padding:14px 22px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border-radius:0 0 16px 16px;">
                <button onclick="closeChatPropertyModal()" style="padding:8px 16px; background:#e2e8f0; color:#334155; border:none; border-radius:8px; font-weight:600; font-size:13px; cursor:pointer; transition:background 0.2s;">
                    ✕ Close
                </button>
                <a href="property-details.html?id=${prop.propertyId || prop.id || propertyId}&from=chat" onclick="openFullPropertyPage(event, ${prop.propertyId || prop.id || propertyId})" style="padding:9px 20px; background:#2563eb; color:#fff; text-decoration:none; border-radius:8px; font-weight:600; font-size:13px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:background 0.2s; box-shadow:0 2px 6px rgba(37,99,235,0.25);">
                    View Full Property Page ↗
                </a>
            </div>
        `;
    } catch (err) {
        modalBox.innerHTML = `
            <div style="padding:30px; text-align:center; color:#b91c1c;">
                <p>Failed to load property details: ${escapeHtml(err.message)}</p>
                <button onclick="closeChatPropertyModal()" style="margin-top:10px; padding:6px 12px; cursor:pointer;">Close</button>
            </div>
        `;
    }
}

window.openFullPropertyPage = function(event, propId) {
    if (event) {
        event.preventDefault();
    }
    const id = propId || (activeChatData && activeChatData.property ? (activeChatData.property.propertyId || activeChatData.property.id) : null) || localStorage.getItem("selectedPropertyId");
    if (!id) {
        alert("Property details could not be found.");
        return;
    }
    localStorage.setItem("selectedPropertyId", id);
    window.location.href = `property-details.html?id=${id}&from=chat`;
};

function closeChatPropertyModal() {
    const modalOverlay = document.getElementById("chatPropertyModal");
    if (modalOverlay) modalOverlay.style.display = "none";
}

function closeChatPropertyModalOnOverlay(e) {
    if (e.target.id === "chatPropertyModal") {
        closeChatPropertyModal();
    }
}

function changeChatModalSlide(dir) {
    if (!currentChatModalImages || currentChatModalImages.length <= 1) return;
    currentChatModalIdx = (currentChatModalIdx + dir + currentChatModalImages.length) % currentChatModalImages.length;
    const imgEl = document.getElementById("chatModalMainImg");
    const counterEl = document.getElementById("chatModalImgCounter");
    if (imgEl) imgEl.src = currentChatModalImages[currentChatModalIdx];
    if (counterEl) counterEl.textContent = `${currentChatModalIdx + 1} / ${currentChatModalImages.length}`;
}

