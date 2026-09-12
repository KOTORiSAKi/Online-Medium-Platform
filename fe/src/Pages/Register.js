import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fname: "",
    lname: "",
    email: "",
    phone: "",
    gender: "",
    birth_date: "",
    type: "Customer",
  });
  // เพิ่ม State สำหรับเก็บข้อความ Error
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(""); // เคลียร์ Error เก่าก่อน
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json(); // 💡 ดึงข้อความตอบกลับจาก BE มาอ่าน

      if (res.ok) {
        alert("สมัครสมาชิกสำเร็จ!");
        navigate("/login");
      } else {
        // 💡 ถ้าพัง ให้โชว์ Error จริงๆ จาก Oracle
        setServerError(data.error || "เกิดข้อผิดพลาดในการสมัคร");
      }
    } catch (err) {
      setServerError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Backend ได้");
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "4rem auto",
        padding: "2rem",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        background: "#fff",
      }}
    >
      <h2 style={{ textAlign: "center" }}>📝 สมัครสมาชิกใหม่</h2>

      {/* 💡 กล่องโชว์ Error สีแดง */}
      {serverError && (
        <div
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "1rem",
            borderRadius: "6px",
            marginTop: "1rem",
            fontSize: "0.9rem",
            wordBreak: "break-word",
          }}
        >
          <strong>Error จาก Database:</strong>
          <br />
          {serverError}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginTop: "1.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "1rem" }}>
          <input
            type="text"
            placeholder="Username"
            required
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            style={{ padding: "0.6rem", flex: 1 }}
          />
          <input
            type="password"
            placeholder="Password"
            required
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={{ padding: "0.6rem", flex: 1 }}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <input
            type="text"
            placeholder="ชื่อจริง (FNAME)"
            required
            onChange={(e) => setFormData({ ...formData, fname: e.target.value })}
            style={{ padding: "0.6rem", flex: 1 }}
          />
          <input
            type="text"
            placeholder="นามสกุล (LNAME)"
            required
            onChange={(e) => setFormData({ ...formData, lname: e.target.value })}
            style={{ padding: "0.6rem", flex: 1 }}
          />
        </div>

        <input
          type="email"
          placeholder="Email"
          required
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          style={{ padding: "0.6rem" }}
        />

        <div style={{ display: "flex", gap: "1rem" }}>
          <input
            type="tel"
            placeholder="เบอร์โทรศัพท์ (PHONE)"
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            style={{ padding: "0.6rem", flex: 1 }}
          />
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            style={{ padding: "0.6rem", flex: 1 }}
          >
            <option value="">ระบุเพศ (GENDER)</option>
            <option value="Male">ชาย</option>
            <option value="Female">หญิง</option>
            <option value="Other">อื่นๆ</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <label style={{ flex: 1, fontSize: "0.9rem", color: "#64748b" }}>
            วันเกิด (BIRTH_DATE):
            <input
              type="date"
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              style={{ padding: "0.6rem", width: "100%", marginTop: "0.3rem", boxSizing: "border-box" }}
            />
          </label>
          <label style={{ flex: 1, fontSize: "0.9rem", color: "#64748b" }}>
            ประเภทผู้ใช้งาน (TYPE):
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              style={{ padding: "0.6rem", width: "100%", marginTop: "0.3rem", boxSizing: "border-box" }}
            >
              <option value="Customer">ฝ่ายซื้อ (Customer)</option>
              <option value="Seller">ฝ่ายขาย (Seller)</option>
              <option value="Employee">พนักงานบริษัท (Employee)</option>
              <option value="Admin">ผู้ดูแลระบบ (Admin)</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          style={{
            padding: "0.75rem",
            backgroundColor: "#059669",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ยืนยันการสมัคร
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <Link to="/login" style={{ color: "#2563eb" }}>
          มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่
        </Link>
      </div>
    </div>
  );
}

export default Register;
