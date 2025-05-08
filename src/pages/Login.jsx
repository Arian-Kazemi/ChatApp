


import { useState } from "react";
import { auth } from "../firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { set, ref as dbRef } from "firebase/database"; // for writing user to DB
import { db } from "../firebase/config"; // firebase DB config

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        // Register new user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        //  Save user to Firebase Realtime DB under /users/{uid}
        await set(dbRef(db, "users/" + user.uid), {
          email: user.email,
          name: user.email.split("@")[0] // You can change this to take real names later
        });
        

      } else {
        // Login existing user
        await signInWithEmailAndPassword(auth, email, password);
      }

      // Navigate to chat user list
      navigate("/chat");

    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        padding: "1rem",
        backgroundColor: "var(--bg)",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--card)",
          padding: "2rem",
          borderRadius: "12px",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
          color: "var(--text)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        }}
      >
        {/* ✅ App Branding */}
        <h1
          style={{
            fontSize: "2.4rem",
            color: "var(--primary)",
            marginBottom: "0.3rem",
            fontWeight: "700",
          }}
        >
          AriChat 💬
        </h1>
        <p style={{ color: "var(--text-light)", marginBottom: "1.5rem" }}>
          Simple. Private. Fun.
        </p>
  
        <h2 style={{ marginBottom: "1rem" }}>
          {isRegistering ? "Register" : "Login"}
        </h2>
  
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              marginBottom: "1rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "var(--input-bg)",
              color: "var(--text)",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              marginBottom: "1rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "var(--input-bg)",
              color: "var(--text)",
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "var(--primary)",
              color: "#fff",
              fontWeight: "bold",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              marginTop: "0.5rem",
            }}
          >
            {isRegistering ? "Create Account" : "Log In"}
          </button>
        </form>
  
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          style={{
            marginTop: "1.5rem",
            background: "none",
            color: "var(--primary)",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isRegistering
            ? "Already have an account? Log in"
            : "New user? Register"}
        </button>
      </div>
    </div>
  );
}  