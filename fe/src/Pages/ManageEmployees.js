import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";

function ManageEmployees() {
  const { showAlert, showConfirm } = usePopup();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/users-and-stores");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
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
    if (parsedUser.TYPE !== "Admin") {
      navigate("/");
      return;
    }
    setCurrentUser(parsedUser);
    fetchData();
  }, [navigate, fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText]);

  const handleChangeRole = async (acId, newRole) => {
    const confirmed = await showConfirm(
      `ยืนยันการเปลี่ยนบทบาทเป็น ${newRole} ใช่หรือไม่?`,
    );
    if (!confirmed) return;

    try {
      const u = users.find((x) => x.AC_ID === acId);
      if (!u) return;

      const payload = {
        type: newRole,
        fname: u.FNAME,
        lname: u.LNAME,
        email: u.EMAIL,
        phone: u.PHONE,
        gender: u.GENDER,
        username: u.USERNAME,
      };

      const res = await fetch(`http://localhost:5000/api/admin/users/${acId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showAlert("เปลี่ยนบทบาทสำเร็จ");
        fetchData();
      } else {
        const errData = await res.json();
        showAlert(errData.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      showAlert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  if (!currentUser) return null;

  const lowerSearch = searchText.toLowerCase();
  const filteredUsers = users.filter((u) => {
    if (u.TYPE === "Admin") return false;

    const matchName =
      (u.FNAME || "").toLowerCase().includes(lowerSearch) ||
      (u.LNAME || "").toLowerCase().includes(lowerSearch) ||
      (u.USERNAME || "").toLowerCase().includes(lowerSearch);

    return matchName;
  });

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

  return (
    <div
      className="page-enter"
      style={{ maxWidth: "840px", margin: "1.5rem auto", padding: "1.5rem" }}
    >
      <h2 style={{ marginTop: 0, color: "#0f172a" }}>
        👔 จัดการข้อมูลพนักงาน (Employee Management)
      </h2>

      <input
        className="form-input"
        type="text"
        placeholder="🔍 ค้นหาชื่อ, นามสกุล หรือ Username..."
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

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {paginatedUsers.map((u, idx) => (
          <div
            key={u.AC_ID}
            className="stagger-item"
            style={{
              "--stagger-index": idx,
              background: "#fff",
              padding: "1.1rem 1.5rem",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <strong style={{ fontSize: "1.1rem", color: "#0f172a" }}>
                {u.FNAME} {u.LNAME}
              </strong>
              <div
                style={{
                  color: "#64748b",
                  fontSize: "0.9rem",
                  marginTop: "0.25rem",
                }}
              >
                @{u.USERNAME} | {u.EMAIL} | บทบาทปัจจุบัน:{" "}
                <span
                  style={{
                    color: u.TYPE === "Employee" ? "#059669" : "#2563eb",
                    fontWeight: "bold",
                  }}
                >
                  {u.TYPE}
                </span>
              </div>
            </div>

            <div>
              {u.TYPE !== "Employee" ? (
                <button
                  className="btn-interactive"
                  onClick={() => handleChangeRole(u.AC_ID, "Employee")}
                  style={{
                    padding: "0.55rem 1.1rem",
                    background: "#059669",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ⬆️ เลื่อนขั้นเป็น Employee
                </button>
              ) : (
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", color: "#ef4444" }}>
                    ปลดจากพนักงาน:
                  </span>
                  <button
                    className="btn-interactive"
                    onClick={() => handleChangeRole(u.AC_ID, "Customer")}
                    style={{
                      padding: "0.45rem 0.85rem",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    เป็น Customer
                  </button>
                  <button
                    className="btn-interactive"
                    onClick={() => handleChangeRole(u.AC_ID, "Seller")}
                    style={{
                      padding: "0.45rem 0.85rem",
                      background: "#f97316",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    เป็น Seller
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
}

export default ManageEmployees;
