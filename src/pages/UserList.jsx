import { ThemeProvider } from "../ThemeContext";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import {
  ref,
  get,
  set,
  update
} from "firebase/database";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

export default function UserList() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [resultUser, setResultUser] = useState(null);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        if (!snapshot.exists()) {
          await set(userRef, {
            email: user.email,
            name: user.email.split("@")[0],
          });
        }
      } else {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const getChatId = (uid1, uid2) =>
    uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

  const handleSearch = async () => {
    setSearching(true);
    setResultUser(null);

    try {
      const snapshot = await get(ref(db, "users"));
      const data = snapshot.val();

      if (data && currentUser) {
        const match = Object.entries(data).find(
          ([uid, user]) =>
            user.email.toLowerCase() === searchQuery.trim().toLowerCase() &&
            uid !== currentUser.uid
        );

        if (match) {
          const [uid, user] = match;
          setResultUser({ uid, ...user });
        }
      }
    } catch (err) {
      console.error("❌ Error searching users:", err);
      alert("Error searching users. Check Firebase rules or auth.");
    }

    setSearching(false);
  };

  const handleStartChat = async () => {
    if (!resultUser || !currentUser) return;

    try {
      const chatId = getChatId(currentUser.uid, resultUser.uid);

      // ✅ Save chat reference for both users
      const updates = {};
      updates[`userChats/${currentUser.uid}/${chatId}`] = {
        chatWith: resultUser.email,
        name: resultUser.name || resultUser.email,
        uid: resultUser.uid
      };
      updates[`userChats/${resultUser.uid}/${chatId}`] = {
        chatWith: currentUser.email,
        name: currentUser.email.split("@")[0],
        uid: currentUser.uid
      };

      // ✅ Add chat participants for rules to work
      updates[`privateChats/${chatId}/participants/${currentUser.uid}`] = true;
      updates[`privateChats/${chatId}/participants/${resultUser.uid}`] = true;

      await update(ref(db), updates);

      navigate(`/chat/${chatId}`, { state: { otherUser: resultUser } });
    } catch (err) {
      console.error("🔥 Error starting chat:", err);
      alert("Something went wrong while starting the chat.");
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  if (!currentUser) return <p style={{ color: "#fff", padding: "2rem" }}>Loading...</p>;

  return (
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto", color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2>Search by Email</h2>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#646cff",
            color: "#fff",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>

      <button
        onClick={() => navigate("/chat")}
        style={{
          backgroundColor: "#444",
          color: "#fff",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          border: "none",
          marginBottom: "1rem",
          cursor: "pointer"
        }}
      >
        ← Back to Chats
      </button>

      <input
        type="email"
        placeholder="Enter user's email"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "0.75rem",
          marginBottom: "1rem",
          borderRadius: "8px",
          border: "none"
        }}
      />

      <button
        onClick={handleSearch}
        style={{
          width: "100%",
          padding: "0.75rem",
          marginBottom: "1.5rem",
          backgroundColor: "#646cff",
          border: "none",
          borderRadius: "8px",
          fontWeight: "bold",
          color: "white",
          cursor: "pointer"
        }}
      >
        Search
      </button>

      {searching ? (
        <p>Searching...</p>
      ) : resultUser ? (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#333",
            borderRadius: "8px",
            marginBottom: "1rem"
          }}
        >
          <strong>{resultUser.name || "No name"}</strong>
          <br />
          <span style={{ fontSize: "0.9rem", color: "#aaa" }}>{resultUser.email}</span>

          <button
            onClick={handleStartChat}
            style={{
              marginTop: "0.75rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#646cff",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Start Chat
          </button>
        </div>
      ) : searchQuery.trim() !== "" ? (
        <p>No user found.</p>
      ) : null}
    </div>
  );
}
 