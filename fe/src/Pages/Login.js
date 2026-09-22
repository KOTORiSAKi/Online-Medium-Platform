import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePopup } from "../context/PopupContext"; // 💡 เพิ่ม Link ตรงนี้

function Login() {
  const { showAlert } = usePopup();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        // เก็บข้อมูล User ลงเครื่อง (เสมือน Login Session)
        localStorage.setItem("user", JSON.stringify(data));
        showAlert(`ยินดีต้อนรับคุณ ${data.FNAME}!`);
        navigate("/profile");
      } else {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "4rem auto",
        padding: "2rem",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        background: "#fff",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>
        🔐 เข้าสู่ระบบ
      </h2>
      <p
        style={{
          textAlign: "center",
          color: "#64748b",
          fontSize: "0.9rem",
          marginBottom: "1.5rem",
        }}
      >
        ยินดีต้อนรับสู่แพลตฟอร์มของเรา
      </p>

      {errorMsg && (
        <div
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "0.75rem",
            borderRadius: "6px",
            textAlign: "center",
            fontSize: "0.9rem",
          }}
        >
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={handleLogin}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "0.85rem",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
            marginTop: "0.5rem",
          }}
        >
          เข้าสู่ระบบ
        </button>
      </form>

      {/* 💡 ส่วนเชื่อมไปหน้า Register */}
      <div
        style={{
          textAlign: "center",
          marginTop: "1.5rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
          ยังไม่มีบัญชีใช่ไหม?{" "}
        </span>
        <Link
          to="/register"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          สมัครสมาชิกที่นี่
        </Link>
      </div>
    </div>
  );
}

export default Login;
