import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [sortBy, setSortBy] = useState("personalized"); // "personalized" | "random" | "rating" | "price-asc" | "price-desc"
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  // โหลดข้อมูล User จาก localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      setUser(null);
    }
  }, []);

  // ฟังก์ชันดึงข้อมูลสินค้าจาก Backend (รองรับ Personalized ตาม acId หรือ Shuffle สุ่ม)
  const fetchProducts = useCallback((mode = "personalized") => {
    setLoading(true);
    let url = "http://localhost:5000/api/products";
    const params = [];

    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (mode === "random") {
      params.push("shuffle=true");
    } else if (mode === "personalized" && storedUser?.AC_ID) {
      params.push(`acId=${storedUser.AC_ID}`);
    }

    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading products:", err);
        setLoading(false);
      });
  }, []);

  // ดึงสินค้าเมื่อเริ่มต้น
  useEffect(() => {
    fetchProducts("personalized");
  }, [fetchProducts]);

  // จัดการการเปลี่ยนวิธีจัดเรียง
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    if (newSort === "random") {
      fetchProducts("random");
    } else if (newSort === "personalized") {
      fetchProducts("personalized");
    }
  };

  // กรองตามคำค้นหา (ชื่อสินค้า, Type, และชื่อร้านค้า)
  const filtered = products.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = item.PRODUCT_NAME?.toLowerCase().includes(q);
    const typeMatch = item.TYPE?.toLowerCase().includes(q);
    const storeMatch = item.ST_NAME?.toLowerCase().includes(q);
    return nameMatch || typeMatch || storeMatch;
  });

  // จัดเรียงตาม sortBy ในฝั่ง Client สำหรับเรตติ้งและราคา
  const displayedProducts = [...filtered].sort((a, b) => {
    // ร้านเปิดต้องอยู่ก่อนเสมอในทุกการเรียง
    if (a.IS_OPEN === "Y" && b.IS_OPEN !== "Y") return -1;
    if (a.IS_OPEN !== "Y" && b.IS_OPEN === "Y") return 1;

    if (sortBy === "rating") {
      return (Number(b.RATING_POINT) || 0) - (Number(a.RATING_POINT) || 0);
    }
    if (sortBy === "price-asc") {
      return (Number(a.PRODUCT_PRICE) || 0) - (Number(b.PRODUCT_PRICE) || 0);
    }
    if (sortBy === "price-desc") {
      return (Number(b.PRODUCT_PRICE) || 0) - (Number(a.PRODUCT_PRICE) || 0);
    }
    // "personalized" และ "random" ถูกจัดเรียงมาจาก Backend แล้ว
    return 0;
  });

  if (loading && products.length === 0) {
    return (
      <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#64748b" }}>
        กำลังคัดสรรสินค้าสำหรับคุณ... ⏳
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>

      {/* แถบแจ้งเตือนเมื่อมีการค้นหา */}
      {searchQuery.trim() && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            backgroundColor: "#ffffff",
            padding: "0.85rem 1.25rem",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div>
            <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
              ผลการค้นหาสำหรับ:{" "}
            </span>
            <strong style={{ color: "#2563eb", fontSize: "1rem" }}>
              "{searchQuery}"
            </strong>
            <span
              style={{
                color: "#64748b",
                fontSize: "0.85rem",
                marginLeft: "0.6rem",
              }}
            >
              (พบ {displayedProducts.length} รายการ จากทั้งหมด {products.length} ชิ้น)
            </span>
          </div>
          <button
            onClick={() => setSearchParams({})}
            style={{
              padding: "0.4rem 0.9rem",
              backgroundColor: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "bold",
              color: "#475569",
            }}
          >
            ✕ ล้างการค้นหา
          </button>
        </div>
      )}

      {/* แถบควบคุมการจัดเรียงและการแนะนำสินค้า (Personalization & Shuffle Bar) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
          backgroundColor: "#ffffff",
          padding: "1rem 1.25rem",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>
              {sortBy === "personalized"
                ? user
                  ? `✨ แนะนำสำหรับคุณ (${user.FNAME || user.USERNAME})`
                  : "✨ สินค้าแนะนำยอดนิยม"
                : sortBy === "random"
                  ? "🎲 สินค้าแบบสุ่มคัดสรร"
                  : "🛍️ รายการสินค้าทั้งหมด"}
            </h2>
            {sortBy === "personalized" && user && (
              <span
                style={{
                  fontSize: "0.75rem",
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  fontWeight: "bold",
                  padding: "0.15rem 0.55rem",
                  borderRadius: "9999px",
                  border: "1px solid #bfdbfe",
                }}
              >
                Personalized
              </span>
            )}
          </div>
          <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.82rem" }}>
            {sortBy === "personalized"
              ? user
                ? "เรียงลำดับตามความชอบและประวัติการสั่งซื้อของคุณโดยเฉพาะ"
                : "เรียงตามร้านค้าที่เปิดและเรตติ้งยอดนิยม"
              : sortBy === "random"
                ? "สุ่มการแสดงผลสินค้าเพื่อให้คุณค้นพบสินค้าใหม่ๆ"
                : "จัดเรียงสินค้าตามตัวเลือกที่คุณกำหนด"}
          </p>
        </div>

        {/* ตัวเลือกการจัดเรียง */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => handleSortChange("personalized")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "8px",
              border: sortBy === "personalized" ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
              backgroundColor: sortBy === "personalized" ? "#eff6ff" : "#ffffff",
              color: sortBy === "personalized" ? "#1d4ed8" : "#475569",
              fontWeight: sortBy === "personalized" ? "bold" : "500",
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span>✨</span> แนะนำสำหรับคุณ
          </button>

          <button
            onClick={() => handleSortChange("random")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "8px",
              border: sortBy === "random" ? "1.5px solid #7c3aed" : "1px solid #e2e8f0",
              backgroundColor: sortBy === "random" ? "#f5f3ff" : "#ffffff",
              color: sortBy === "random" ? "#6d28d9" : "#475569",
              fontWeight: sortBy === "random" ? "bold" : "500",
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="กดเพื่อสุ่มลำดับสินค้าใหม่ทันที"
          >
            <span>🎲</span> สุ่มสินค้าใหม่
          </button>

          <select
            value={["rating", "price-asc", "price-desc"].includes(sortBy) ? sortBy : ""}
            onChange={(e) => {
              if (e.target.value) handleSortChange(e.target.value);
            }}
            style={{
              padding: "0.45rem 0.8rem",
              borderRadius: "8px",
              border: ["rating", "price-asc", "price-desc"].includes(sortBy)
                ? "1.5px solid #2563eb"
                : "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontSize: "0.85rem",
              fontWeight: "500",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="" disabled>
              เรียงตามเกณฑ์อื่นๆ...
            </option>
            <option value="rating">⭐ เรตติ้งร้านค้าสูงสุด</option>
            <option value="price-asc">💵 ราคา: ต่ำสุด → สูงสุด</option>
            <option value="price-desc">💵 ราคา: สูงสุด → ต่ำสุด</option>
          </select>
        </div>
      </div>

      {/* รายการสินค้า */}
      {displayedProducts.length === 0 ? (
        <div
          style={{
            padding: "3.5rem 1.5rem",
            textAlign: "center",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px dashed #cbd5e1",
            marginTop: "1rem",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🔍</div>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e293b" }}>
            ไม่พบสินค้าที่ตรงกับคำค้นหา
          </h3>
          <p
            style={{
              color: "#64748b",
              fontSize: "0.9rem",
              margin: "0 0 1.25rem 0",
            }}
          >
            ลองค้นหาด้วยชื่อสินค้า หมวดหมู่ (เช่น เครื่องดื่ม, ของหวาน) หรือชื่อร้านค้าอื่น
          </p>
          <button
            onClick={() => setSearchParams({})}
            style={{
              padding: "0.55rem 1.25rem",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            แสดงสินค้าทั้งหมด
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {displayedProducts.map((item) => {
            const isClosed = item.IS_OPEN === "N";
            return (
              <div
                key={item.PRODUCT_ID}
                style={{
                  border: isClosed ? "2px solid #ef4444" : "1px solid #e2e8f0",
                  borderRadius: "12px",
                  overflow: "hidden",
                  backgroundColor: isClosed ? "#fef2f2" : "#fff",
                  position: "relative",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                }}
              >
                <div>
                  {/* ป้ายเตือนร้านปิด (สีแดงเด่นชัด) */}
                  {isClosed && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        background: "#dc2626",
                        color: "white",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        zIndex: 2,
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                      }}
                    >
                      ⛔ ร้านปิดให้บริการ
                    </div>
                  )}

                  {/* โชว์รูปจริงจาก DB ถ้าไม่มีให้ใช้รูปจำลอง */}
                  <img
                    src={
                      item.IMAGE_URL ||
                      `https://placehold.co/300x200?text=${encodeURIComponent(
                        item.PRODUCT_NAME
                      )}`
                    }
                    alt={item.PRODUCT_NAME}
                    style={{
                      width: "100%",
                      height: "160px",
                      objectFit: "cover",
                      filter: isClosed ? "grayscale(40%)" : "none",
                    }}
                  />

                  {/* ป้ายเตือนสินค้าหมด */}
                  {item.STOCK <= 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "#ef4444",
                        color: "white",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        zIndex: 2,
                      }}
                    >
                      สินค้าหมด
                    </div>
                  )}

                  <div
                    style={{
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                        color: "#64748b",
                      }}
                    >
                      <span>
                        {item.TYPE} • เหลือ {item.STOCK} ชิ้น
                      </span>
                      <span
                        style={{
                          color: isClosed ? "#dc2626" : "#059669",
                          fontWeight: "bold",
                        }}
                      >
                        🏪 {item.ST_NAME}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1rem", margin: "0.5rem 0 0.25rem 0", color: "#0f172a" }}>
                      {item.PRODUCT_NAME}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "1.15rem",
                          fontWeight: "bold",
                          color: isClosed ? "#991b1b" : "#059669",
                        }}
                      >
                        ฿
                        {item.PRODUCT_PRICE
                          ? item.PRODUCT_PRICE.toLocaleString()
                          : 0}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: "bold" }}>
                        ⭐ {item.RATING_POINT ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "0 1rem 1rem 1rem" }}>
                  <Link
                    to={`/product/${item.PRODUCT_ID}`}
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "0.5rem",
                      backgroundColor: isClosed ? "#dc2626" : "#2563eb",
                      color: "white",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                    }}
                  >
                    {isClosed ? "ดูรายละเอียด (ร้านปิด)" : "ดูรายละเอียด"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Home;
