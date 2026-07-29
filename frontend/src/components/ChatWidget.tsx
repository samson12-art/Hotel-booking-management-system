"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { MessageCircle, X, Send } from "lucide-react";

interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  sender?: ChatUser;
  receiver?: ChatUser;
}

interface ConversationItem {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  other_user: ChatUser;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { user } = useAuthStore();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      fetchConversations();
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get("/chat");
      setConversations(data.data?.conversations || []);
      if (data.data?.conversations?.length > 0 && !activeConv) {
        setActiveConv(data.data.conversations[0].other_user?.id);
      }
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv);
    }
  }, [activeConv]);

  const activeConversation = conversations.find((c) => c.other_user?.id === activeConv);

  const fetchMessages = async (userId: string) => {
    try {
      const { data } = await api.get(`/chat/${userId}`);
      setMessages(data.data || []);
    } catch {
      // silently fail
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeConv) return;
    setLoading(true);
    try {
      await api.post("/chat", {
        receiverId: activeConv,
        message: message,
      });
      setMessage("");
      fetchMessages(activeConv);
      fetchConversations();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "var(--accent)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--shadow)",
          zIndex: 999,
          border: "none",
          cursor: "pointer",
        }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "92px",
            right: "24px",
            width: "360px",
            height: "500px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow)",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: "16px" }}>
            Chat with us
          </div>

          {conversations.length > 0 && (
            <div style={{ display: "flex", gap: "4px", padding: "8px", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv.other_user?.id)}
                  className={`badge ${activeConv === conv.other_user?.id ? "badge-teal" : "badge-gray"}`}
                >
                  {conv.other_user?.firstName || "Chat"}
                </button>
              ))}
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {messages.length === 0 && (
              <div className="empty-state" style={{ padding: "32px 16px" }}>
                <p>No messages yet. Start a conversation!</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMine = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isMine ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    padding: "8px 12px",
                    borderRadius: isMine ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                    background: isMine ? "var(--accent)" : "var(--bg)",
                    color: isMine ? "#fff" : "var(--text)",
                    fontSize: "13px",
                  }}
                >
                  {msg.message}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: "12px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px" }}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              className="form-input"
              placeholder="Type a message..."
              style={{ flex: 1, minHeight: "36px", padding: "8px 12px" }}
            />
            <button onClick={sendMessage} disabled={loading || !message.trim()} className="btn btn-primary btn-sm" style={{ minHeight: "36px" }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
