// ChatRoom.jsx
import { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import {
  ref,
  push,
  onValue,
  get,
  set,
  serverTimestamp,
  onDisconnect,
} from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";

export default function ChatRoom() {
  const { chatId } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        const statusRef = ref(db, `/status/${user.uid}`);
        set(statusRef, { state: "online", last_changed: serverTimestamp() });
        onDisconnect(statusRef).set({
          state: "offline",
          last_changed: serverTimestamp(),
        });
      } else {
        navigate("/");
      }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    const fetchOtherUser = async () => {
      if (!currentUser || !chatId) return;
      const [uid1, uid2] = chatId.split("_");
      const otherUid = currentUser.uid === uid1 ? uid2 : uid1;

      try {
        const snapshot = await get(ref(db, `users/${otherUid}`));
        if (snapshot.exists()) {
          setOtherUser({ uid: otherUid, ...snapshot.val() });
        }
      } catch (err) {
        console.error("Error loading user", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOtherUser();
  }, [chatId, currentUser]);

  useEffect(() => {
    if (!otherUser) return;
    const statusRef = ref(db, `/status/${otherUser.uid}`);
    onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      setIsOnline(data?.state === "online");
    });
  }, [otherUser]);

  useEffect(() => {
    if (!otherUser) return;
    const typingRef = ref(db, `/typing/${chatId}/${otherUser.uid}`);
    onValue(typingRef, (snapshot) => {
      setIsTyping(snapshot.val() === true);
    });
  }, [chatId, otherUser]);

  useEffect(() => {
    if (!chatId) return;
    const messagesRef = ref(db, `privateChats/${chatId}/messages`);
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const loaded = [];
      for (let id in data) loaded.push({ id, ...data[id] });
      setMessages(loaded);
    });
  }, [chatId]);

  useEffect(() => {
    const container = document.getElementById("messages-container");
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;
    const typingRef = ref(db, `/typing/${chatId}/${currentUser.uid}`);
    const timeout = setTimeout(() => {
      set(typingRef, false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [message]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const data = {
      text: message,
      sender: currentUser.uid,
      senderEmail: currentUser.email,
      timestamp: Date.now(),
    };

    await push(ref(db, `privateChats/${chatId}/messages`), data);
    setMessage("");
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (loading || !currentUser || !otherUser) return <p style={{ color: "var(--text)", padding: "2rem" }}>Loading chat...</p>;

  return (
    <div className="chat-wrapper" style={{ backgroundColor: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ backgroundColor: "var(--bg-secondary)", padding: "1rem", display: "flex", alignItems: "center", gap: "1rem", borderBottom: "1px solid var(--input-bg)" }}>
        <button onClick={() => navigate("/chat")} style={{ backgroundColor: "var(--input-bg)", color: "var(--text)", border: "none", borderRadius: "6px", padding: "0.4rem 0.8rem" }}>
          ← Chats
        </button>
        <div style={{ backgroundColor: "var(--input-bg)", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
          {otherUser.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div>
          <div style={{ fontWeight: "bold", color: "var(--text)" }}>{otherUser.name || otherUser.email}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
            {isTyping ? "✍️ Typing..." : isOnline ? "🟢 Online" : "⚫ Offline"}
          </div>
        </div>
      </div>

      <div id="messages-container" style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            alignSelf: msg.sender === currentUser.uid ? "flex-end" : "flex-start",
            backgroundColor: msg.sender === currentUser.uid ? "var(--primary)" : "var(--input-bg)",
            color: "var(--text)",
            borderRadius: "20px",
            padding: "0.75rem 1rem",
            maxWidth: "75%"
          }}>
            <div>{msg.text}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-light)", textAlign: "right" }}>
              {formatTime(msg.timestamp)}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", padding: "1rem", gap: "0.5rem", borderTop: "1px solid var(--input-bg)", backgroundColor: "var(--bg)" }}>
        <input
          type="text"
          value={message}
          placeholder="Type a message..."
          onChange={(e) => {
            setMessage(e.target.value);
            set(ref(db, `/typing/${chatId}/${currentUser.uid}`), true);
          }}
          style={{
            flex: 1,
            padding: "0.75rem",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "var(--input-bg)",
            color: "var(--text)"
          }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: "var(--primary)",
            color: "#fff",
            padding: "0.75rem 1.25rem",
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold"
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
