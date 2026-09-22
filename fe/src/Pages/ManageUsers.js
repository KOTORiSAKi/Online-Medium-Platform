import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";

function ManageUsers() {
  const { showAlert, showConfirm } = usePopup();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Show 5 users per page to make it less cluttered

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/login");
      return;
    }
    const parsedUser = JSON.parse(userStr);
    if (parsedUser.TYPE !== "Admin" && parsedUser.TYPE !== "Employee") {
      navigate("/");
      return;
    }
    setCurrentUser(parsedUser);
    fetchData();
  }, [navigate]);

  useEffect(() => {
    // Reset to page 1 when search text changes
    setCurrentPage(1);
  }, [searchText]);

  const fetchData = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/users-and-stores");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setStores(data.stores || []);
      }
    } catch (err) {
      showAlert("ไม่สามารถดึงข้อมูลได้");
    }
  };

  const handleUpdateUser = async (e, acId) => {
    e.preventDefault();
    const confirmed = await showConfirm("ต้องการบันทึกการเปลี่ยนแปลงข้อมูลผู้ใช้นี้ใช่หรือไม่?");
    if (!confirmed) return;

    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${acId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert("อัปเดตข้อมูลสำเร็จ");
        fetchData();
      } else {
        showAlert(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      showAlert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  const handleReassignStore = async (stId, newAcId) => {
    let msg = newAcId
      ? "ต้องการโอนสิทธิ์ร้านค้านี้ให้ผู้ใช้ที่เลือกใช่หรือไม่?"
      : "ต้องการปลดเจ้าของร้านและปิดร้านค้านี้ใช่หรือไม่?";

    const confirmed = await showConfirm(msg);
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/stores/${stId}/reassign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newAcId: newAcId || null }),
      });
      if (res.ok) {
        showAlert("จัดการสิทธิ์ร้านค้าสำเร็จ");
        fetchData();
      } else {
        showAlert("เกิดข้อผิดพลาด");
      }
    } catch (err) {
      showAlert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  if (!currentUser) return null;
  const isAdmin = currentUser.TYPE === "Admin";

  const lowerSearch = searchText.toLowerCase();
  const filteredUsers = users.filter((u) => {
    if (!isAdmin && (u.TYPE === "Admin" || u.TYPE === "Employee")) {
      return false;
    }
    const matchName =
      (u.FNAME || "").toLowerCase().includes(lowerSearch) ||
      (u.LNAME || "").toLowerCase().includes(lowerSearch) ||
      (u.USERNAME || "").toLowerCase().includes(lowerSearch);

    const userStores = stores.filter(s => s.AC_ID === u.AC_ID);
    const matchStore = userStores.some(s => (s.ST_NAME || "").toLowerCase().includes(lowerSearch));

    return matchName || matchStore;
  });

  // Orphaned stores logic
  const orphanedStores = stores.filter(s => !s.AC_ID);

  // Pagination logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === safeCurrentPage) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "6rem auto", padding: "1rem" }}>
      <h2>👥 จัดการข้อมูลลูกค้าและผู้ขาย</h2>

      <input
        type="text"
        placeholder="🔍 ค้นหาชื่อ, นามสกุล, Username หรือ ชื่อร้านค้า..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{
          width: "100%", padding: "0.8rem", borderRadius: "8px",
          border: "1px solid #cbd5e1", marginBottom: "1.5rem", boxSizing: "border-box"
        }}
      />

      {/* User List */}
      {paginatedUsers.map((u) => {
        const userStores = stores.filter((s) => s.AC_ID === u.AC_ID);
        const canEdit = isAdmin || (u.TYPE === "Customer" || u.TYPE === "Seller");

        return (
          <div key={u.AC_ID} style={{
            background: "#fff", padding: "1.5rem", borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", marginBottom: "1.5rem"
          }}>
            <form onSubmit={(e) => handleUpdateUser(e, u.AC_ID)}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label>Username:</label>
                  <input name="username" defaultValue={u.USERNAME} required disabled={!canEdit} style={{ width: "100%", padding: "0.5rem" }} />
                </div>
                <div>
                  <label>Password:</label>
                  <input name="password" placeholder="พิมพ์เพื่อเปลี่ยนรหัส (เว้นว่างได้)" minLength={6} disabled={!canEdit} style={{ width: "100%", padding: "0.5rem" }} />
                </div>
                <div>
                  <label>ชื่อจริง:</label>
                  <input name="fname" defaultValue={u.FNAME} required disabled={!canEdit} style={{ width: "100%", padding: "0.5rem" }} />
                </div>
                <div>
                  <label>นามสกุล:</label>
                  <input name="lname" defaultValue={u.LNAME} required disabled={!canEdit} style={{ width: "100%", padding: "0.5rem" }} />
                </div>
                <div>
                  <label>Email:</label>
                  <input name="email" type="email" defaultValue={u.EMAIL} required disabled={!canEdit} style={{ width: "100%", padding: "0.5rem" }} />
                </div>
                <div>
                  <label>เบอร์โทร (10 หลัก):</label>
                  <input name="phone" type="tel" pattern="[0-9]{10}" defaultValue={u.PHONE} disabled={!canEdit} style={{ width: "100%", padding: "0.5rem" }} />
                </div>
                <div>
                  <label>เพศ:</label>
                  <select name="gender" defaultValue={u.GENDER || ""} disabled={!canEdit} style={{ width: "100%", padding: "0.5rem" }}>
                    <option value="">ไม่ระบุ</option>
                    <option value="Male">ชาย</option>
                    <option value="Female">หญิง</option>
                    <option value="Other">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label>บทบาท (Role):</label>
                  <select name="type" defaultValue={u.TYPE} disabled={!canEdit} style={{ width: "100%", padding: "0.5rem" }}>
                    <option value="Customer">Customer</option>
                    <option value="Seller">Seller</option>
                    {isAdmin && <option value="Employee">Employee</option>}
                  </select>
                </div>
              </div>
              {canEdit && (
                <button type="submit" style={{ padding: "0.5rem 1rem", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                  💾 บันทึกข้อมูลบัญชี
                </button>
              )}
            </form>

            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f8fafc", borderRadius: "8px" }}>
              <h4 style={{ margin: "0 0 1rem 0" }}>🏪 ร้านค้าในการดูแล (ถ้ามี)</h4>
              {userStores.length === 0 ? (
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>ไม่มีร้านค้าในการดูแล</p>
              ) : (
                userStores.map(s => (
                  <div key={s.ST_ID} style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.5rem" }}>
                    <strong style={{ flex: 1 }}>{s.ST_NAME} (ID: {s.ST_ID})</strong>
                    <select id={`reassign-${s.ST_ID}`} style={{ padding: "0.4rem" }}>
                      <option value="">-- โอนร้านค้านี้ให้คนอื่น --</option>
                      {users.map(target => (
                        (target.AC_ID !== u.AC_ID && (isAdmin || target.TYPE !== "Admin")) && (
                          <option key={target.AC_ID} value={target.AC_ID}>{target.FNAME} {target.LNAME} ({target.USERNAME})</option>
                        )
                      ))}
                    </select>
                    <button onClick={() => {
                      const newId = document.getElementById(`reassign-${s.ST_ID}`).value;
                      if (!newId) return showAlert("กรุณาเลือกผู้รับโอน");
                      handleReassignStore(s.ST_ID, newId);
                    }} style={{ padding: "0.4rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                      โอนร้าน
                    </button>
                    <button onClick={() => handleReassignStore(s.ST_ID, null)} style={{ padding: "0.4rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                      ปลดจากการเป็นเจ้าของ (ปิดร้าน)
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "2rem" }}>
          <button
            onClick={() => handlePageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage <= 1}
            style={{
              padding: "0.6rem 1.2rem", borderRadius: "8px", border: "1px solid #cbd5e1",
              background: safeCurrentPage <= 1 ? "#f8fafc" : "#fff",
              color: safeCurrentPage <= 1 ? "#94a3b8" : "#0f172a",
              cursor: safeCurrentPage <= 1 ? "not-allowed" : "pointer"
            }}
          >
            ก่อนหน้า
          </button>

          <span style={{ fontWeight: "600", color: "#475569" }}>
            หน้า {safeCurrentPage} จาก {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage >= totalPages}
            style={{
              padding: "0.6rem 1.2rem", borderRadius: "8px", border: "1px solid #cbd5e1",
              background: safeCurrentPage >= totalPages ? "#f8fafc" : "#fff",
              color: safeCurrentPage >= totalPages ? "#94a3b8" : "#0f172a",
              cursor: safeCurrentPage >= totalPages ? "not-allowed" : "pointer"
            }}
          >
            ถัดไป
          </button>
        </div>
      )}

      {/* Orphaned stores section */}
      {isAdmin && orphanedStores.length > 0 && (
        <div style={{ marginTop: "3rem", padding: "1.5rem", background: "#fef2f2", borderRadius: "12px", border: "1px solid #fca5a5" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "#b91c1c" }}>🏪 ร้านค้าที่ไม่มีเจ้าของ (ร้านที่ถูกปลด)</h3>
          {orphanedStores.map(s => (
            <div key={s.ST_ID} style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.5rem" }}>
              <strong style={{ flex: 1, color: "#7f1d1d" }}>{s.ST_NAME} (ID: {s.ST_ID})</strong>
              <select id={`reassign-orphan-${s.ST_ID}`} style={{ padding: "0.4rem" }}>
                <option value="">-- โอนร้านค้านี้ให้ผู้ใช้ --</option>
                {users.map(target => (
                  target.TYPE !== "Admin" && (
                    <option key={target.AC_ID} value={target.AC_ID}>{target.FNAME} {target.LNAME} ({target.USERNAME})</option>
                  )
                ))}
              </select>
              <button onClick={() => {
                const newId = document.getElementById(`reassign-orphan-${s.ST_ID}`).value;
                if (!newId) return showAlert("กรุณาเลือกผู้รับโอน");
                handleReassignStore(s.ST_ID, newId);
              }} style={{ padding: "0.4rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                โอนร้าน
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default ManageUsers;
