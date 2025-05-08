import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ChatRoom from "./pages/ChatRoom";
import ChatList from "./pages/ChatList";
import UserList from "./pages/UserList";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase/config";
import { ref, set, serverTimestamp, onDisconnect } from "firebase/database";

export default function App() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const statusRef = ref(db, `/status/${user.uid}`);
        set(statusRef, {
          state: "online",
          last_changed: serverTimestamp(),
        });
        onDisconnect(statusRef).set({
          state: "offline",
          last_changed: serverTimestamp(),
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={<ChatList />} />
        <Route path="/chat/:chatId" element={<ChatRoom />} />
        <Route path="/search" element={<UserList />} />
      </Routes>
    </BrowserRouter>
  );
}
