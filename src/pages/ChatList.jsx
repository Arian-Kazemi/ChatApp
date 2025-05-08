import { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase/config";
import { ref, onValue, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { signOut } from "firebase/auth";

export default function ChatList() {
  const [chats, setChats] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        loadChatList(user.uid);
      } else {
        navigate("/");
      }
    });
    return () => unsub();
  }, [navigate]);

  const loadChatList = async (uid) => {
    const userChatsRef = ref(db, `userChats/${uid}`);
    onValue(userChatsRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) return setChats([]);

      const chatList = await Promise.all(
        Object.entries(data).map(async ([chatId, info]) => {
          const messagesRef = ref(db, `privateChats/${chatId}/messages`);
          const msgSnap = await get(messagesRef);
          let lastMessage = null;
          let timestamp = 0;

          if (msgSnap.exists()) {
            const messages = Object.entries(msgSnap.val());
            const last = messages[messages.length - 1][1];
            lastMessage = last.text;
            timestamp = last.timestamp || 0;
          }

          return {
            chatId,
            ...info,
            lastMessage: lastMessage || "No messages yet",
            timestamp,
          };
        })
      );

      const sorted = chatList.sort((a, b) => b.timestamp - a.timestamp);
      setChats(sorted);
    });
  };

  const handleSelectChat = (chatId, chatInfo) => {
    navigate(`/chat/${chatId}`, { state: { otherUser: chatInfo } });
  };

  const handleNewChat = () => navigate("/search");

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto", color: "var(--text)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>Your Chats</h2>
        <div style={{ position: "relative" }}>
          <button
            onClick={toggleDropdown}
            style={{
              fontSize: "1.25rem",
              padding: "0.4rem 0.8rem",
              backgroundColor: "var(--input-bg)",
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            ⚙️
          </button>

          {showDropdown && (
            <div
              ref={dropdownRef}
              style={{
                position: "absolute",
                top: "2.5rem",
                right: 0,
                backgroundColor: "var(--card)",
                border: "1px solid var(--input-bg)",
                borderRadius: "8px",
                padding: "0.5rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                zIndex: 9999,
                width: "160px",
              }}
            >
              <button
                onClick={toggleTheme}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  padding: "0.5rem 0",
                  color: "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                Toggle Theme
              </button>
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  padding: "0.5rem 0",
                  color: "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleNewChat}
        style={{
          backgroundColor: "var(--primary)",
          color: "#fff",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          border: "none",
          cursor: "pointer",
          width: "100%"
        }}
      >
        + New Chat
      </button>

      {chats.length === 0 ? (
        <p>No chats yet. Start one from + New Chat.</p>
      ) : (
        chats.map(chat => (
          <div
            key={chat.chatId}
            onClick={() => handleSelectChat(chat.chatId, chat)}
            style={{
              padding: "1rem",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "10px",
              marginBottom: "1rem",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              transition: "background 0.2s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong style={{ color: "var(--text)" }}>{chat.name}</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                {formatTime(chat.timestamp)}
              </span>
            </div>
            <div style={{ fontSize: "0.95rem", color: "var(--text-light)", marginTop: "0.25rem" }}>
              {chat.lastMessage.length > 40
                ? chat.lastMessage.slice(0, 40) + "..."
                : chat.lastMessage}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
