import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePopup } from "../context/PopupContext";

function Register() {
  const { showAlert } = usePopup();

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
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        showAlert("สมัครสมาชิกสำเร็จ!");
        navigate("/login");
      } else {
        setServerError(data.error || "เกิดข้อผิดพลาดในการสมัคร");
      }
    } catch (err) {
      setServerError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Backend ได้");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="page-enter"
      style={{
        maxWidth: "620px",
        margin: "2.5rem auto",
        padding: "2.25rem",
        border: "1px solid #e2e8f0",
        borderRadius: "18px",
        background: "#ffffff",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        <h2 style={{ margin: "0 0 0.35rem 0", color: "#0f172a" }}>
          📝 สมัครสมาชิกใหม่
        </h2>
        <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
          สร้างบัญชีเพื่อเริ่มต้นช้อปปิ้งหรือเปิดร้านค้าของคุณ
        </p>
      </div>

      {/* กล่องโชว์ Error สีแดง */}
      {serverError && (
        <div
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecaca",
            padding: "1rem",
            borderRadius: "10px",
            marginBottom: "1rem",
            fontSize: "0.9rem",
            wordBreak: "break-word",
          }}
        >
          <strong>⚠️ Error จาก Database:</strong>
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
        }}
      >
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <input
            className="form-input"
            type="text"
            placeholder="Username"
            required
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            style={{
              padding: "0.7rem 0.9rem",
              flex: 1,
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
            }}
          />
          <div style={{ position: "relative", flex: 1 }}>
            <input
              className="form-input"
              type={showPassword ? "text" : "password"}
              placeholder="Password (อย่างน้อย 6 ตัวอักษร)"
              required
              minLength={6}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              style={{
                padding: "0.7rem 2.5rem 0.7rem 0.9rem",
                width: "100%",
                boxSizing: "border-box",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                position: "absolute",
                right: "0.6rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <input
            className="form-input"
            type="text"
            placeholder="ชื่อจริง (FNAME)"
            required
            onChange={(e) =>
              setFormData({ ...formData, fname: e.target.value })
            }
            style={{
              padding: "0.7rem 0.9rem",
              flex: 1,
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
            }}
          />
          <input
            className="form-input"
            type="text"
            placeholder="นามสกุล (LNAME)"
            required
            onChange={(e) =>
              setFormData({ ...formData, lname: e.target.value })
            }
            style={{
              padding: "0.7rem 0.9rem",
              flex: 1,
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
            }}
          />
        </div>

        <input
          className="form-input"
          type="email"
          placeholder="Email"
          required
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          style={{
            padding: "0.7rem 0.9rem",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
          }}
        />

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <input
            className="form-input"
            type="tel"
            placeholder="เบอร์โทรศัพท์ (10 หลัก)"
            pattern="[0-9]{10}"
            title="กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลข 10 หลัก"
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            style={{
              padding: "0.7rem 0.9rem",
              flex: 1,
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
            }}
          />
          <select
            className="form-input"
            value={formData.gender}
            onChange={(e) =>
              setFormData({ ...formData, gender: e.target.value })
            }
            style={{
              padding: "0.7rem 0.9rem",
              flex: 1,
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#fff",
            }}
          >
            <option value="">ระบุเพศ (GENDER)</option>
            <option value="Male">ชาย</option>
            <option value="Female">หญิง</option>
            <option value="Other">อื่นๆ</option>
          </select>
        </div>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <label
            style={{
              flex: 1,
              fontSize: "0.88rem",
              color: "#475569",
              fontWeight: "600",
            }}
          >
            วันเกิด (BIRTH_DATE):
            <input
              className="form-input"
              type="date"
              onChange={(e) =>
                setFormData({ ...formData, birth_date: e.target.value })
              }
              style={{
                padding: "0.65rem 0.8rem",
                width: "100%",
                marginTop: "0.35rem",
                boxSizing: "border-box",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
              }}
            />
          </label>
          <label
            style={{
              flex: 1,
              fontSize: "0.88rem",
              color: "#475569",
              fontWeight: "600",
            }}
          >
            ประเภทผู้ใช้งาน (TYPE):
            <select
              className="form-input"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              style={{
                padding: "0.65rem 0.8rem",
                width: "100%",
                marginTop: "0.35rem",
                boxSizing: "border-box",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#fff",
              }}
            >
              <option value="Customer">ฝ่ายซื้อ (Customer)</option>
              <option value="Seller">ฝ่ายขาย (Seller)</option>
            </select>
          </label>
        </div>

        <button
          className="btn-interactive"
          type="submit"
          disabled={submitting}
          style={{
            padding: "0.85rem",
            backgroundColor: "#059669",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: submitting ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
            marginTop: "0.25rem",
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
          <span>{submitting ? "กำลังสมัครสมาชิก..." : "ยืนยันการสมัคร"}</span>
        </button>
      </form>
      <div
        style={{
          textAlign: "center",
          marginTop: "1.25rem",
          paddingTop: "1.25rem",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <Link
          to="/login"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่
        </Link>
      </div>
    </div>
  );
}

export default Register;
