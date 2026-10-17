import React, { useState, useEffect, useCallback } from "react";
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
  const itemsPerPage = 5;

  const fetchData = useCallback(async () => {
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
  }, [showAlert]);

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
  }, [navigate, fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText]);

  const handleUpdateUser = async (e, acId) => {
    e.preventDefault();
    const confirmed = await showConfirm(
      "ต้องการบันทึกการเปลี่ยนแปลงข้อมูลผู้ใช้นี้ใช่หรือไม่?",
    );
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
      const res = await fetch(
        `http://localhost:5000/api/admin/stores/${stId}/reassign`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newAcId: newAcId || null }),
        },
      );
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

    const userStores = stores.filter((s) => s.AC_ID === u.AC_ID);
    const matchStore = userStores.some((s) =>
      (s.ST_NAME || "").toLowerCase().includes(lowerSearch),
    );

    return matchName || matchStore;
  });

  const orphanedStores = stores.filter((s) => !s.AC_ID);

  // Pagination logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (
      newPage < 1 ||
      newPage > totalPages ||
      newPage === safeCurrentPage
    )
      return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const inputStyle = {
    width: "100%",
    padding: "0.55rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
    fontSize: "0.9rem",
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.82rem",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "0.25rem",
  };

  return (
    <div
      className="page-enter"
      style={{ maxWidth: "1020px", margin: "1.5rem auto", padding: "1.5rem" }}
    >
      <h2 style={{ marginTop: 0, color: "#0f172a" }}>
        👥 จัดการข้อมูลลูกค้าและผู้ขาย
      </h2>

      <input
        className="form-input"
        type="text"
        placeholder="🔍 ค้นหาชื่อ, นามสกุล, Username หรือ ชื่อร้านค้า..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{
          width: "100%",
          padding: "0.85rem 1rem",
          borderRadius: "12px",
          border: "1px solid #cbd5e1",
          marginBottom: "1.5rem",
          boxSizing: "border-box",
          fontSize: "0.95rem",
          boxShadow: "var(--shadow-sm)",
        }}
      />

      {/* User List */}
      {paginatedUsers.map((u, idx) => {
        const userStores = stores.filter((s) => s.AC_ID === u.AC_ID);
        const canEdit =
          isAdmin || u.TYPE === "Customer" || u.TYPE === "Seller";

        return (
          <div
            key={u.AC_ID}
            className="stagger-item"
            style={{
              "--stagger-index": idx,
              background: "#fff",
              padding: "1.5rem",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "var(--shadow-sm)",
              marginBottom: "1.5rem",
            }}
          >
            <form onSubmit={(e) => handleUpdateUser(e, u.AC_ID)}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <label style={labelStyle}>Username:</label>
                  <input
                    className="form-input"
                    name="username"
                    defaultValue={u.USERNAME}
                    required
                    disabled={!canEdit}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Password:</label>
                  <input
                    className="form-input"
                    name="password"
                    placeholder="พิมพ์เพื่อเปลี่ยนรหัส (เว้นว่างได้)"
                    minLength={6}
                    disabled={!canEdit}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>ชื่อจริง:</label>
                  <input
                    className="form-input"
                    name="fname"
                    defaultValue={u.FNAME}
                    required
                    disabled={!canEdit}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>นามสกุล:</label>
                  <input
                    className="form-input"
                    name="lname"
                    defaultValue={u.LNAME}
                    required
                    disabled={!canEdit}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email:</label>
                  <input
                    className="form-input"
                    name="email"
                    type="email"
                    defaultValue={u.EMAIL}
                    required
                    disabled={!canEdit}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>เบอร์โทร (10 หลัก):</label>
                  <input
                    className="form-input"
                    name="phone"
                    type="tel"
                    pattern="[0-9]{10}"
                    defaultValue={u.PHONE}
                    disabled={!canEdit}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>เพศ:</label>
                  <select
                    className="form-input"
                    name="gender"
                    defaultValue={u.GENDER || ""}
                    disabled={!canEdit}
                    style={{ ...inputStyle, backgroundColor: "#fff" }}
                  >
                    <option value="">ไม่ระบุ</option>
                    <option value="Male">ชาย</option>
                    <option value="Female">หญิง</option>
                    <option value="Other">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>บทบาท (Role):</label>
                  <select
                    className="form-input"
                    name="type"
                    defaultValue={u.TYPE}
                    disabled={!canEdit}
                    style={{ ...inputStyle, backgroundColor: "#fff" }}
                  >
                    <option value="Customer">Customer</option>
                    <option value="Seller">Seller</option>
                    {isAdmin && <option value="Employee">Employee</option>}
                  </select>
                </div>
              </div>
              {canEdit && (
                <button
                  className="btn-interactive"
                  type="submit"
                  style={{
                    padding: "0.55rem 1.2rem",
                    background: "#059669",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  💾 บันทึกข้อมูลบัญชี
                </button>
              )}
            </form>

            <div
              style={{
                marginTop: "1.25rem",
                padding: "1rem",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h4 style={{ margin: "0 0 0.75rem 0", color: "#1e293b" }}>
                🏪 ร้านค้าในการดูแล (ถ้ามี)
              </h4>
              {userStores.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    color: "#64748b",
                    fontSize: "0.9rem",
                  }}
                >
                  ไม่มีร้านค้าในการดูแล
                </p>
              ) : (
                userStores.map((s) => (
                  <div
                    key={s.ST_ID}
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <strong style={{ flex: 1, color: "#0f172a" }}>
                      {s.ST_NAME} (ID: {s.ST_ID})
                    </strong>
                    <select
                      className="form-input"
                      id={`reassign-${s.ST_ID}`}
                      style={{
                        padding: "0.45rem 0.65rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#fff",
                      }}
                    >
                      <option value="">-- โอนร้านค้านี้ให้คนอื่น --</option>
                      {users.map(
                        (target) =>
                          target.AC_ID !== u.AC_ID &&
                          (isAdmin || target.TYPE !== "Admin") && (
                            <option key={target.AC_ID} value={target.AC_ID}>
                              {target.FNAME} {target.LNAME} ({target.USERNAME})
                            </option>
                          ),
                      )}
                    </select>
                    <button
                      className="btn-interactive"
                      onClick={() => {
                        const newId = document.getElementById(
                          `reassign-${s.ST_ID}`,
                        ).value;
                        if (!newId) return showAlert("กรุณาเลือกผู้รับโอน");
                        handleReassignStore(s.ST_ID, newId);
                      }}
                      style={{
                        padding: "0.45rem 0.85rem",
                        background: "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
                      โอนร้าน
                    </button>
                    <button
                      className="btn-interactive"
                      onClick={() => handleReassignStore(s.ST_ID, null)}
                      style={{
                        padding: "0.45rem 0.85rem",
                        background: "#dc2626",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
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
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          <button
            className="btn-interactive"
            onClick={() => handlePageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage <= 1}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: safeCurrentPage <= 1 ? "#f8fafc" : "#fff",
              color: safeCurrentPage <= 1 ? "#94a3b8" : "#0f172a",
              cursor: safeCurrentPage <= 1 ? "not-allowed" : "pointer",
            }}
          >
            ก่อนหน้า
          </button>

          <span style={{ fontWeight: "600", color: "#475569" }}>
            หน้า {safeCurrentPage} จาก {totalPages}
          </span>

          <button
            className="btn-interactive"
            onClick={() => handlePageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage >= totalPages}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: safeCurrentPage >= totalPages ? "#f8fafc" : "#fff",
              color: safeCurrentPage >= totalPages ? "#94a3b8" : "#0f172a",
              cursor: safeCurrentPage >= totalPages ? "not-allowed" : "pointer",
            }}
          >
            ถัดไป
          </button>
        </div>
      )}

      {/* Orphaned stores section */}
      {isAdmin && orphanedStores.length > 0 && (
        <div
          style={{
            marginTop: "3rem",
            padding: "1.5rem",
            background: "#fef2f2",
            borderRadius: "16px",
            border: "1px solid #fca5a5",
          }}
        >
          <h3 style={{ margin: "0 0 1rem 0", color: "#b91c1c" }}>
            🏪 ร้านค้าที่ไม่มีเจ้าของ (ร้านที่ถูกปลด)
          </h3>
          {orphanedStores.map((s) => (
            <div
              key={s.ST_ID}
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                marginBottom: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <strong style={{ flex: 1, color: "#7f1d1d" }}>
                {s.ST_NAME} (ID: {s.ST_ID})
              </strong>
              <select
                className="form-input"
                id={`reassign-orphan-${s.ST_ID}`}
                style={{
                  padding: "0.45rem 0.65rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#fff",
                }}
              >
                <option value="">-- โอนร้านค้านี้ให้ผู้ใช้ --</option>
                {users.map(
                  (target) =>
                    target.TYPE !== "Admin" && (
                      <option key={target.AC_ID} value={target.AC_ID}>
                        {target.FNAME} {target.LNAME} ({target.USERNAME})
                      </option>
                    ),
                )}
              </select>
              <button
                className="btn-interactive"
                onClick={() => {
                  const newId = document.getElementById(
                    `reassign-orphan-${s.ST_ID}`,
                  ).value;
                  if (!newId) return showAlert("กรุณาเลือกผู้รับโอน");
                  handleReassignStore(s.ST_ID, newId);
                }}
                style={{
                  padding: "0.45rem 0.85rem",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
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
