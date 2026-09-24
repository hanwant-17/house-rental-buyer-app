// ==========================================================
// 🏠 HouseHub - In-App Chat Controller (RULE 3: Privacy by Design)
// Real-time REST API integration with Spring Boot
// ==========================================================

document.addEventListener("DOMContentLoaded", async function () {
    const user = window.api ? window.api.getCurrentUser() : null;
    if (!user || !user.token) {
        alert("Please login to access the in-app chat.");
        window.location.href = "login.html";
        return;
    }

    const chatPropertyName = document.getElementById("chatPropertyName");
    const chatBrokerName = document.getElementById("chatBrokerName");
    const chatPropertyLocation = document.getElementById("chatPropertyLocation");
    const chatPropertyPrice = document.getElementById("chatPropertyPrice");
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const messagesContainer = document.getElementById("messages");
    const clearChatButton = document.getElementById("clearChatButton");

    let currentChatId = localStorage.getItem("currentChatId");
    const selectedPropertyId = localStorage.getItem("selectedPropertyId");

    // 1. Initialize Chat Room with Backend
    try {
        let chat = null;
        if (selectedPropertyId) {
            // Load property header info
            try {
                const propRes = await window.api.getPropertyById(selectedPropertyId);
                const prop = propRes.data;
                if (prop) {
                    if (chatPropertyName) chatPropertyName.textContent = prop.title;
                    if (chatPropertyLocation) chatPropertyLocation.textContent = `${prop.city}, ${prop.address}`;
                    if (chatPropertyPrice) chatPropertyPrice.textContent = `₹${Number(prop.price).toLocaleString()} ${prop.purpose === 'RENT' ? '/ month' : ''}`;
                    if (chatBrokerName) {
                        const bName = (prop.broker && prop.broker.user) ? prop.broker.user.name : "Verified Broker";
                        chatBrokerName.textContent = bName;
                    }
                }
            } catch (e) {
                console.warn("Could not load property details for chat header:", e);
            }

            // Create or get chat room for this property
            if (user.role === "CUSTOMER") {
                const chatRes = await window.api.createOrGetChat(selectedPropertyId);
                chat = chatRes.data;
                currentChatId = chat.chatId;
                localStorage.setItem("currentChatId", currentChatId);
            }
        }

        // If no active chat was created yet, check user's existing chats
        if (!currentChatId) {
            const userChats = await window.api.getUserChats();
            if (userChats.data && userChats.data.length > 0) {
                currentChatId = userChats.data[0].chatId;
                localStorage.setItem("currentChatId", currentChatId);
            }
        }

        // Load message history
        if (currentChatId) {
            await loadMessages(currentChatId);
            // Polling interval for incoming messages (every 3 seconds)
            setInterval(() => loadMessages(currentChatId, true), 3000);
        } else {
            if (messagesContainer) {
                messagesContainer.innerHTML = `
                    <div style="text-align:center; color:#667085; padding:40px;">
                        <p>No active conversations yet.</p>
                        <p style="font-size:13px; margin-top:8px;">Browse properties and click "Chat with Broker" to start chatting!</p>
                    </div>
                `;
            }
        }

    } catch (err) {
        console.error("Chat initialization error:", err);
    }

    // 2. Fetch and render messages from backend
    async function loadMessages(chatId, isBackgroundPoll = false) {
        try {
            const res = await window.api.getChatMessages(chatId);
            const messageList = res.data || [];

            if (!messagesContainer) return;

            // Render message bubbles
            messagesContainer.innerHTML = "";
            if (messageList.length === 0) {
                messagesContainer.innerHTML = `
                    <div style="text-align:center; color:#667085; padding:30px; font-size:13px;">
                        Start a secure conversation. Your personal contact details are completely hidden.
                    </div>
                `;
                return;
            }

            messageList.forEach(msg => {
                const isMe = String(msg.senderId) === String(user.userId);
                const bubble = document.createElement("div");
                bubble.className = isMe ? "message customer-message" : "message broker-message";

                const timeStr = msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
                
                bubble.innerHTML = `
                    <div><strong>${isMe ? "You" : (msg.senderName || "User")}</strong></div>
                    <div>${escapeHtml(msg.message)}</div>
                    <span class="message-time">${timeStr}</span>
                `;
                messagesContainer.appendChild(bubble);
            });

            // Scroll to bottom if new messages arrived
            if (!isBackgroundPoll) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        } catch (e) {
            if (!isBackgroundPoll) {
                console.error("Failed to load chat messages:", e);
            }
        }
    }

    // 3. Send Message
    async function handleSendMessage() {
        if (!messageInput || !currentChatId) return;
        const text = messageInput.value.trim();
        if (!text) return;

        messageInput.disabled = true;
        if (sendButton) sendButton.disabled = true;

        try {
            await window.api.sendMessage(currentChatId, text);
            messageInput.value = "";
            await loadMessages(currentChatId);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (error) {
            alert("Failed to send message: " + error.message);
        } finally {
            messageInput.disabled = false;
            if (sendButton) sendButton.disabled = false;
            messageInput.focus();
        }
    }

    if (sendButton) {
        sendButton.addEventListener("click", handleSendMessage);
    }

    if (messageInput) {
        messageInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }

    // Clear local chat UI
    if (clearChatButton) {
        clearChatButton.addEventListener("click", function () {
            if (confirm("Clear local chat messages on screen?")) {
                if (messagesContainer) messagesContainer.innerHTML = "";
            }
        });
    }

    function escapeHtml(string) {
        const div = document.createElement('div');
        div.innerText = string;
        return div.innerHTML;
    }
});
