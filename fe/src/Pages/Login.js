import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePopup } from "../context/PopupContext";

function Login() {
  const { showAlert } = usePopup();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="page-enter"
      style={{
        maxWidth: "420px",
        margin: "3rem auto",
        padding: "2.25rem",
        border: "1px solid #e2e8f0",
        borderRadius: "18px",
        background: "#ffffff",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            backgroundColor: "#eff6ff",
            color: "#2563eb",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.6rem",
            marginBottom: "0.75rem",
          }}
        >
          🔐
        </div>
        <h2 style={{ margin: "0 0 0.35rem 0", color: "#0f172a" }}>
          เข้าสู่ระบบ
        </h2>
        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: "0.9rem",
          }}
        >
          ยินดีต้อนรับสู่แพลตฟอร์ม MY SHOP
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecaca",
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            textAlign: "center",
            fontSize: "0.9rem",
            marginBottom: "1rem",
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      <form
        onSubmit={handleLogin}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: "#334155",
              marginBottom: "0.35rem",
            }}
          >
            อีเมล (Email Address)
          </label>
          <input
            className="form-input"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.75rem 0.9rem",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              boxSizing: "border-box",
              fontSize: "0.95rem",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: "#334155",
              marginBottom: "0.35rem",
            }}
          >
            รหัสผ่าน (Password)
          </label>
          <div style={{ position: "relative" }}>
            <input
              className="form-input"
              type={showPassword ? "text" : "password"}
              placeholder="กรอกรหัสผ่านของคุณ"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem 2.6rem 0.75rem 0.9rem",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                boxSizing: "border-box",
                fontSize: "0.95rem",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label="แสดงหรือซ่อนรหัสผ่าน"
              style={{
                position: "absolute",
                right: "0.6rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.05rem",
                color: "#64748b",
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <button
          className="btn-interactive"
          type="submit"
          disabled={submitting}
          style={{
            padding: "0.85rem",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: submitting ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
            marginTop: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          {submitting && (
            <progress
              aria-label="Loading"
              className="loading-spinner"
              style={{
                "--_spinner-size": "18px",
                "--_spinner-color": "#ffffff",
              }}
            />
          )}
          <span>{submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</span>
        </button>
      </form>

      {/* ส่วนเชื่อมไปหน้า Register */}
      <div
        style={{
          textAlign: "center",
          marginTop: "1.5rem",
          paddingTop: "1.25rem",
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
