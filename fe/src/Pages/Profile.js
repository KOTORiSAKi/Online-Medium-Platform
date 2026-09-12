import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // สเตทสำหรับโหมดแก้ไขข้อมูล
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    currentPassword: "",
    newUsername: "",
    newPassword: "",
    newEmail: "",
    newGender: "",
    newFname: "",
    newLname: "",
    newPhone: "",
  });

  // สเตทสำหรับโมดอล/การสลับบทบาท Customer <-> Seller
  const [switchRoleOpen, setSwitchRoleOpen] = useState(false);
  const [switchPassword, setSwitchPassword] = useState("");

  // สเตทสำหรับสร้างร้านค้าใหม่ (Seller Area)
  const [storeForm, setStoreForm] = useState({ stName: "", location: "" });
  const [stores, setStores] = useState([]);
  const [storeLoading, setStoreLoading] = useState(false);

  // ฟังก์ชันดึงข้อมูลบัญชีล่าสุดจาก DB
  const fetchAccount = useCallback(async (acId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/account/${acId}`);
      if (res.ok) {
        const freshData = await res.json();
        setUser(freshData);
        localStorage.setItem("user", JSON.stringify(freshData));
      }
    } catch (err) {
      console.error("Fetch account failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ฟังก์ชันดึงร้านค้าทั้งหมด
  const fetchStores = useCallback(async () => {
    setStoreLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/stores");
      if (res.ok) {
        const data = await res.json();
        setStores(data);
      }
    } catch (err) {
      console.error("Fetch stores failed:", err);
    } finally {
      setStoreLoading(false);
    }
  }, []);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser) {
      navigate("/login");
      return;
    }
    fetchAccount(loggedInUser.AC_ID);
    fetchStores();
  }, [navigate, fetchAccount, fetchStores]);

  // เมื่อเปิดโหมดแก้ไข ให้โหลดข้อมูลปัจจุบันใส่ฟอร์ม
  useEffect(() => {
    if (user) {
      setEditForm({
        currentPassword: "",
        newUsername: user.USERNAME || "",
        newPassword: "",
        newEmail: user.EMAIL || "",
        newGender: user.GENDER || "",
        newFname: user.FNAME || "",
        newLname: user.LNAME || "",
        newPhone: user.PHONE || "",
      });
    }
  }, [user, editMode]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // 1. บันทึกการแก้ไขข้อมูลบัญชี
  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!editForm.currentPassword) {
      alert("กรุณาระบุรหัสผ่านปัจจุบัน (Current Password) เพื่อยืนยันตัวตน");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acId: user.AC_ID,
          ...editForm,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.requireRelogin) {
          alert("คุณได้เปลี่ยนแปลง Email หรือ รหัสผ่าน ระบบจะทำการออกจากระบบเพื่อให้ Login ใหม่อีกครั้ง");
          handleLogout();
        } else {
          alert("อัปเดตข้อมูลบัญชีสำเร็จ!");
          setEditMode(false);
          fetchAccount(user.AC_ID);
        }
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      alert("เซิร์ฟเวอร์ไม่ตอบสนอง กรุณาลองใหม่อีกครั้ง");
    }
  };

  // 2. สลับบทบาทระหว่าง Customer <-> Seller
  const handleSwitchRole = async (e) => {
    e.preventDefault();
    if (!switchPassword) {
      alert("กรุณากรอกรหัสผ่านเพื่อยืนยันการสลับบทบาท");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/account/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acId: user.AC_ID,
          password: switchPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setSwitchPassword("");
        setSwitchRoleOpen(false);
        fetchAccount(user.AC_ID);
      } else {
        alert(data.error || "สลับบทบาทไม่สำเร็จ");
      }
    } catch (err) {
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  // 3. สร้างร้านค้าใหม่ (เฉพาะ Seller)
  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!storeForm.stName.trim() || !storeForm.location.trim()) {
      alert("กรุณากรอกชื่อร้านค้าและที่ตั้งร้านค้าให้ครบถ้วน");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acId: user.AC_ID,
          stName: storeForm.stName,
          location: storeForm.location,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setStoreForm({ stName: "", location: "" });
        fetchStores();
        fetchAccount(user.AC_ID);
      } else {
        alert(data.error || "สร้างร้านค้าไม่สำเร็จ");
      }
    } catch (err) {
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  // 4. ลบบัญชีผู้ใช้
  const handleDeleteAccount = async () => {
    if (!window.confirm("🚨 คำเตือน: คุณต้องการ 'ลบบัญชีนี้ถาวร' จริงๆ หรือไม่? ข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้!")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/auth/delete/${user.AC_ID}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        handleLogout();
      } else {
        alert(data.error || "ไม่สามารถลบบัญชีได้");
      }
    } catch (err) {
      alert("เซิร์ฟเวอร์ไม่ตอบสนอง");
    }
  };

  if (loading || !user) {
    return <div style={{ padding: "3rem", textAlign: "center" }}>กำลังโหลดข้อมูลบัญชีผู้ใช้... ⏳</div>;
  }

  const isCustomerOrSeller = user.TYPE === "Customer" || user.TYPE === "Seller";
  const targetRole = user.TYPE === "Customer" ? "Seller" : "Customer";

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto", color: "#1e293b" }}>

      {/* ==================================================== */}
      {/* 1. การ์ดแสดงข้อมูลส่วนตัวบัญชี (ตามตาราง ACCOUNT) */}
      {/* ==================================================== */}
      <div style={{
        padding: "2rem",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
        marginBottom: "2rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "1.6rem" }}>
                {user.FNAME} {user.LNAME}
              </h1>
              <span style={{
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.85rem",
                fontWeight: "bold",
                backgroundColor: user.TYPE === "Seller" ? "#dcfce7" : user.TYPE === "Admin" ? "#fee2e2" : user.TYPE === "Employee" ? "#fef3c7" : "#e0e7ff",
                color: user.TYPE === "Seller" ? "#15803d" : user.TYPE === "Admin" ? "#b91c1c" : user.TYPE === "Employee" ? "#b45309" : "#4338ca",
              }}>
                บทบาท: {user.TYPE}
              </span>
            </div>
            <p style={{ margin: "0.4rem 0 0 0", color: "#64748b", fontSize: "0.95rem" }}>
              @{user.USERNAME} • ID บัญชี: #{user.AC_ID}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {isCustomerOrSeller && (
              <button
                onClick={() => setSwitchRoleOpen(true)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#6366f1",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  boxShadow: "0 2px 4px rgba(99, 102, 241, 0.2)"
                }}
              >
                🔄 สลับบทบาทเป็น {targetRole}
              </button>
            )}
            <button
              onClick={() => setEditMode(!editMode)}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: editMode ? "#94a3b8" : "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "0.9rem",
              }}
            >
              {editMode ? "✕ ปิดหน้าแก้ไข" : "⚙️ แก้ไขบัญชี"}
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "0.9rem",
              }}
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* ข้อมูลทั้งหมดในตาราง ACCOUNT */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginTop: "1.5rem",
          fontSize: "0.95rem"
        }}>
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: "0.85rem" }}>📧 อีเมล (EMAIL)</span>
            <strong>{user.EMAIL || "-"}</strong>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: "0.85rem" }}>📱 เบอร์โทรศัพท์ (PHONE)</span>
            <strong>{user.PHONE || "-"}</strong>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: "0.85rem" }}>⚧️ เพศ (GENDER)</span>
            <strong>{user.GENDER || "-"}</strong>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: "0.85rem" }}>🎂 วันเกิด (BIRTH_DATE)</span>
            <strong>{user.BIRTH_DATE || "-"}</strong>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: "0.85rem" }}>📅 วันที่ลงทะเบียน (REGISTED_DATE)</span>
            <strong>{user.REGISTED_DATE || "-"}</strong>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: "0.85rem" }}>🏪 รหัสร้านค้าที่ผูก (ST_ID)</span>
            <strong>{user.ST_ID ? `#${user.ST_ID}` : "ยังไม่ได้ผูกร้าน"}</strong>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. ฟอร์มแก้ไขข้อมูลบัญชี (ตรวจรหัสผ่านเก่า + Relogin หากเปลี่ยน Email/Pass) */}
      {/* ==================================================== */}
      {editMode && (
        <div style={{
          backgroundColor: "#f8fafc",
          border: "2px dashed #94a3b8",
          borderRadius: "16px",
          padding: "2rem",
          marginBottom: "2rem"
        }}>
          <h2 style={{ marginTop: 0, fontSize: "1.3rem" }}>✏️ แก้ไขข้อมูลบัญชีของคุณ</h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "-0.5rem" }}>
            * จำเป็นต้องระบุรหัสผ่านปัจจุบันทุกครั้ง และหากเปลี่ยน <strong>Email</strong> หรือ <strong>Password</strong> ระบบจะให้ Login ใหม่โดยอัตโนมัติ
          </p>

          <form onSubmit={handleUpdateAccount} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            {/* กล่องกรอกรหัสผ่านปัจจุบัน (บังคับ) */}
            <div style={{ backgroundColor: "#fee2e2", padding: "1rem", borderRadius: "8px", border: "1px solid #f87171" }}>
              <label style={{ display: "block", fontWeight: "bold", color: "#991b1b", fontSize: "0.9rem" }}>
                🔒 รหัสผ่านปัจจุบัน (Current Password) *จำเป็น:
              </label>
              <input
                type="password"
                required
                placeholder="กรอกรหัสผ่านเดิมเพื่อยืนยันการแก้ไข"
                value={editForm.currentPassword}
                onChange={(e) => setEditForm({ ...editForm, currentPassword: e.target.value })}
                style={{ width: "100%", padding: "0.6rem", marginTop: "0.4rem", borderRadius: "6px", border: "1px solid #f87171", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#475569" }}>Username:</label>
                <input
                  type="text"
                  value={editForm.newUsername}
                  onChange={(e) => setEditForm({ ...editForm, newUsername: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", marginTop: "0.25rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#475569" }}>Password ใหม่ (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน):</label>
                <input
                  type="password"
                  placeholder="รหัสผ่านใหม่"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", marginTop: "0.25rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#475569" }}>ชื่อจริง (FNAME):</label>
                <input
                  type="text"
                  value={editForm.newFname}
                  onChange={(e) => setEditForm({ ...editForm, newFname: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", marginTop: "0.25rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#475569" }}>นามสกุล (LNAME):</label>
                <input
                  type="text"
                  value={editForm.newLname}
                  onChange={(e) => setEditForm({ ...editForm, newLname: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", marginTop: "0.25rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#475569" }}>อีเมล (EMAIL):</label>
                <input
                  type="email"
                  value={editForm.newEmail}
                  onChange={(e) => setEditForm({ ...editForm, newEmail: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", marginTop: "0.25rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#475569" }}>เบอร์โทรศัพท์ (PHONE):</label>
                <input
                  type="tel"
                  value={editForm.newPhone}
                  onChange={(e) => setEditForm({ ...editForm, newPhone: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", marginTop: "0.25rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#475569" }}>เพศ (GENDER):</label>
                <select
                  value={editForm.newGender}
                  onChange={(e) => setEditForm({ ...editForm, newGender: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", marginTop: "0.25rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                >
                  <option value="">ไม่ระบุ</option>
                  <option value="Male">ชาย</option>
                  <option value="Female">หญิง</option>
                  <option value="Other">อื่นๆ</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                style={{ padding: "0.6rem 1.2rem", backgroundColor: "#e2e8f0", border: "none", borderRadius: "6px", cursor: "pointer" }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                style={{ padding: "0.6rem 1.5rem", backgroundColor: "#059669", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
              >
                💾 บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </form>

          <div style={{ marginTop: "2rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#ef4444", fontSize: "0.9rem", fontWeight: "bold" }}>โซนอันตราย (Danger Zone):</span>
            <button
              onClick={handleDeleteAccount}
              style={{ padding: "0.5rem 1rem", backgroundColor: "#991b1b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}
            >
              🗑️ ลบบัญชีผู้ใช้นี้ทิ้งถาวร
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. Popup / ฟอร์มสลับบทบาท Customer <-> Seller (ต้องกรอกรหัสผ่าน) */}
      {/* ==================================================== */}
      {switchRoleOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            padding: "2rem",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "420px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)"
          }}>
            <h3 style={{ margin: 0, fontSize: "1.25rem" }}>🔄 สลับบทบาทเป็น "{targetRole}"</h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0.5rem 0 1.25rem 0" }}>
              การสลับบทบาทจำเป็นต้องยืนยันรหัสผ่านเพื่อความปลอดภัยของบัญชี
            </p>

            <form onSubmit={handleSwitchRole}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", color: "#334155" }}>
                กรุณากรอกรหัสผ่านของคุณ:
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="รหัสผ่านปัจจุบัน"
                value={switchPassword}
                onChange={(e) => setSwitchPassword(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", marginTop: "0.4rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => { setSwitchRoleOpen(false); setSwitchPassword(""); }}
                  style={{ padding: "0.5rem 1rem", backgroundColor: "#f1f5f9", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  style={{ padding: "0.5rem 1.2rem", backgroundColor: "#6366f1", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                >
                  ยืนยันสลับบทบาท
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. พื้นที่ของ SELLER: สร้างร้านค้าได้กี่ร้านก็ได้ */}
      {/* ==================================================== */}
      {user.TYPE === "Seller" && (
        <section style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "2rem",
          marginBottom: "2rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#0f766e" }}>🏪 พื้นที่จัดการร้านค้า (Seller Store Area)</h2>
          </div>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: 0 }}>
            ในฐานะผู้ขาย (Seller) คุณสามารถสร้างร้านค้าได้ไม่จำกัด โดยระบบจะกำหนดคะแนนเริ่มต้น (Rating = 0, Selling Rate = 2.5) ให้โดยอัตโนมัติ
          </p>

          {/* ฟอร์มสร้างร้านค้า */}
          <form onSubmit={handleCreateStore} style={{
            backgroundColor: "#f0fdf4",
            padding: "1.5rem",
            borderRadius: "12px",
            border: "1px solid #bbf7d0",
            marginTop: "1rem"
          }}>
            <h4 style={{ margin: "0 0 1rem 0", color: "#166534" }}>➕ เปิดร้านค้าใหม่</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "flex-end" }}>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#166534" }}>ชื่อร้านค้า (ST_NAME):</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ร้านขายของดีเมืองตรัง"
                  value={storeForm.stName}
                  onChange={(e) => setStoreForm({ ...storeForm, stName: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", marginTop: "0.25rem", borderRadius: "6px", border: "1px solid #86efac", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#166534" }}>สถานที่ตั้ง (LOCATION):</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 123/4 ถ.วิเศษ ต.ทับเที่ยง"
                  value={storeForm.location}
                  onChange={(e) => setStoreForm({ ...storeForm, location: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", marginTop: "0.25rem", borderRadius: "6px", border: "1px solid #86efac", boxSizing: "border-box" }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: "0.65rem 1.4rem",
                  backgroundColor: "#16a34a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "0.9rem"
                }}
              >
                สร้างร้านค้า
              </button>
            </div>
            <div style={{ marginTop: "0.6rem", fontSize: "0.8rem", color: "#15803d" }}>
              * ข้อมูลเริ่มต้น: Rating Point = 0 | Selling Rate = 2.5
            </div>
          </form>

          {/* รายการร้านค้าที่มีในระบบ */}
          <div style={{ marginTop: "2rem" }}>
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 1rem 0" }}>📦 รายชื่อร้านค้าในระบบ ({stores.length} ร้าน)</h3>
            {storeLoading ? (
              <p style={{ color: "#64748b" }}>กำลังโหลดข้อมูลร้านค้า...</p>
            ) : stores.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>ยังไม่มีร้านค้าในระบบ</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
                {stores.map((s) => (
                  <div
                    key={s.ST_ID}
                    style={{
                      border: s.ST_ID === user.ST_ID ? "2px solid #10b981" : "1px solid #e2e8f0",
                      padding: "1rem",
                      borderRadius: "10px",
                      backgroundColor: s.ST_ID === user.ST_ID ? "#f0fdf4" : "#ffffff",
                      position: "relative"
                    }}
                  >
                    {s.ST_ID === user.ST_ID && (
                      <span style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        fontSize: "0.75rem",
                        backgroundColor: "#10b981",
                        color: "white",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "9999px",
                        fontWeight: "bold"
                      }}>
                        ร้านของคุณ
                      </span>
                    )}
                    <h4 style={{ margin: "0 0 0.4rem 0", fontSize: "1.05rem" }}>{s.ST_NAME}</h4>
                    <p style={{ margin: "0 0 0.5rem 0", color: "#64748b", fontSize: "0.85rem" }}>📍 {s.LOCATION}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#334155", borderTop: "1px dashed #cbd5e1", paddingTop: "0.5rem" }}>
                      <span>⭐ Rating: <strong>{s.RATING_POINT ?? 0}</strong></span>
                      <span>📈 Rate: <strong>{s.SELLING_RATE ?? 2.5}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==================================================== */}
      {/* 5. แผงควบคุมสิทธิ์เพิ่มเติม (ตาม Role) */}
      {/* ==================================================== */}
      <section style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        padding: "1.5rem",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
      }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem" }}>📋 เมนูและสิทธิ์การใช้งาน (Role: {user.TYPE})</h3>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {(user.TYPE === "Admin" || user.TYPE === "Employee") && (
            <>
              <button style={{ padding: "0.75rem 1rem", background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: "8px", cursor: "pointer" }}>
                👨‍💼 จัดการข้อมูลพนักงาน
              </button>
              <button style={{ padding: "0.75rem 1rem", background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: "8px", cursor: "pointer" }}>
                👥 จัดการข้อมูลลูกค้า/ผู้ขาย
              </button>
              <button style={{ padding: "0.75rem 1rem", background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: "8px", cursor: "pointer" }}>
                📊 ดูสถิติร้านค้าทั้งหมด (ส่วนกลาง)
              </button>
            </>
          )}

          {user.TYPE === "Seller" && (
            <button style={{ padding: "0.75rem 1rem", background: "#dcfce7", border: "1px solid #10b981", borderRadius: "8px", cursor: "pointer" }}>
              📈 ดูสถิติการขายของร้านตัวเอง
            </button>
          )}

          <button
            onClick={() => navigate("/market")}
            style={{ padding: "0.75rem 1rem", background: "#e0e7ff", border: "1px solid #6366f1", borderRadius: "8px", cursor: "pointer" }}
          >
            🛒 ตะกร้าสินค้าและการสั่งซื้อ (ลูกค้า)
          </button>
        </div>
      </section>

    </div>
  );
}

export default Profile;
