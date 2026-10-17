import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

function Store() {
  const { stId } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // การค้นหาและจัดเรียงสินค้าภายในร้าน
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default"); // "default" | "rating" | "price-asc" | "price-desc"

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // โหลดข้อมูลผู้ใช้จาก localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      setUser(null);
    }
  }, []);

  // ดึงข้อมูลร้านค้าและรายการสินค้า
  const fetchStoreData = useCallback(async () => {
    setLoading(true);
    try {
      const storeRes = await fetch(`http://localhost:5000/api/stores/${stId}`);
      if (!storeRes.ok) {
        setStore(null);
        setLoading(false);
        return;
      }
      const storeData = await storeRes.json();
      setStore(storeData);

      const prodRes = await fetch(
        `http://localhost:5000/api/stores/${stId}/products`
      );
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : []);
      }
    } catch (err) {
      console.error("Error fetching store data:", err);
    } finally {
      setLoading(false);
    }
  }, [stId]);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  // รีเซ็ตหน้าเมื่อมีการค้นหา หรือเปลี่ยนการจัดเรียง
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, itemsPerPage]);

  // กรองสินค้าตามคำค้นหา
  const filtered = products.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = item.PRODUCT_NAME?.toLowerCase().includes(q);
    const typeMatch = item.TYPE?.toLowerCase().includes(q);
    return nameMatch || typeMatch;
  });

  // จัดเรียงสินค้า
  const displayedProducts = [...filtered].sort((a, b) => {
    if (sortBy === "rating") {
      return (Number(b.RATING) || 0) - (Number(a.RATING) || 0);
    }
    if (sortBy === "price-asc") {
      return (Number(a.PRODUCT_PRICE) || 0) - (Number(b.PRODUCT_PRICE) || 0);
    }
    if (sortBy === "price-desc") {
      return (Number(b.PRODUCT_PRICE) || 0) - (Number(a.PRODUCT_PRICE) || 0);
    }
    return (Number(b.PRODUCT_ID) || 0) - (Number(a.PRODUCT_ID) || 0);
  });

  // คำนวณการแบ่งหน้า (Pagination)
  const totalItems = displayedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedProducts = displayedProducts.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === safeCurrentPage)
      return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div
        className="page-enter"
        style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
            <div
              className="skeleton"
              style={{ width: "72px", height: "72px", borderRadius: "16px" }}
            />
            <div style={{ flex: 1 }}>
              <div
                className="skeleton"
                style={{ width: "240px", height: "28px", marginBottom: "10px" }}
              />
              <div
                className="skeleton"
                style={{ width: "320px", height: "18px" }}
              />
            </div>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                paddingBottom: "1rem",
              }}
            >
              <div
                className="skeleton"
                style={{ width: "100%", height: "160px", borderRadius: 0 }}
              />
              <div style={{ padding: "1rem" }}>
                <div
                  className="skeleton"
                  style={{ width: "60%", height: "16px", marginBottom: "10px" }}
                />
                <div
                  className="skeleton"
                  style={{ width: "80%", height: "20px", marginBottom: "12px" }}
                />
                <div
                  className="skeleton"
                  style={{ width: "100%", height: "36px", borderRadius: "8px" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div
        className="page-enter"
        style={{
          padding: "4rem 1.5rem",
          textAlign: "center",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🏪❌</div>
        <h2 style={{ color: "#0f172a", marginBottom: "0.5rem" }}>
          ไม่พบร้านค้านี้
        </h2>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
          ร้านค้าอาจถูกลบหรือไม่มีอยู่ในระบบ
        </p>
        <button
          onClick={() => navigate("/")}
          className="btn-interactive"
          style={{
            padding: "0.6rem 1.4rem",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          กลับสู่หน้าแรก
        </button>
      </div>
    );
  }

  const isOpen = store.IS_OPEN === "Y";
  const isOwner = user && (user.AC_ID === store.AC_ID || user.TYPE === "Admin");
  const addressText = [
    store.ADDRESS_LINE,
    store.SUB_DISTRICT,
    store.DISTRICT,
    store.PROVINCE,
    store.ZIP_CODE,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="page-enter"
      style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}
    >
      {/* ลิงก์ย้อนกลับ */}
      <button
        onClick={() => navigate(-1)}
        className="btn-interactive"
        style={{
          background: "none",
          border: "none",
          color: "#64748b",
          fontSize: "0.9rem",
          cursor: "pointer",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: 0,
          fontWeight: "600",
        }}
      >
        ← ย้อนกลับ
      </button>

      {/* ป้ายข้อมูลร้านค้า (Store Banner & Profile Card) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: isOpen ? "1px solid #e2e8f0" : "2px solid #fca5a5",
          padding: "2rem",
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
          marginBottom: "2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: isOpen
              ? "linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa)"
              : "linear-gradient(90deg, #dc2626, #ef4444)",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}
        >
          {/* ข้อมูลชื่อและที่ตั้งร้าน */}
          <div
            style={{
              display: "flex",
              gap: "1.25rem",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "16px",
                backgroundColor: isOpen ? "#eff6ff" : "#fee2e2",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "2.4rem",
                border: isOpen
                  ? "1.5px solid #bfdbfe"
                  : "1.5px solid #fca5a5",
                flexShrink: 0,
              }}
            >
              🏪
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  flexWrap: "wrap",
                }}
              >
                <h1
                  style={{ margin: 0, fontSize: "1.65rem", color: "#0f172a" }}
                >
                  {store.ST_NAME}
                </h1>
                <span
                  style={{
                    backgroundColor: isOpen ? "#dcfce7" : "#fee2e2",
                    color: isOpen ? "#15803d" : "#dc2626",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    border: isOpen
                      ? "1px solid #bbf7d0"
                      : "1px solid #fecaca",
                  }}
                >
                  {isOpen ? "🟢 เปิดให้บริการ" : "🔴 ปิดให้บริการชั่วคราว"}
                </span>
                {isOwner && (
                  <span
                    style={{
                      backgroundColor: "#fef3c7",
                      color: "#b45309",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      border: "1px solid #fde68a",
                    }}
                  >
                    ⭐ ร้านของคุณ
                  </span>
                )}
              </div>

              <p
                style={{
                  margin: "0.5rem 0 0 0",
                  color: "#475569",
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  lineHeight: "1.4",
                }}
              >
                <span>📍</span>
                <span>
                  <strong>สถานที่ตั้ง:</strong>{" "}
                  {addressText || store.LOCATION || "ไม่ระบุที่อยู่"}
                </span>
              </p>
            </div>
          </div>

          {/* สถิติร้านค้า: Rating & Selling Rate */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "0.75rem 1.25rem",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                textAlign: "center",
                minWidth: "110px",
              }}
            >
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "#64748b",
                  fontWeight: "bold",
                }}
              >
                ⭐ เรตติ้งร้านค้า
              </div>
              <div
                style={{
                  fontSize: "1.45rem",
                  fontWeight: "bold",
                  color: "#f59e0b",
                  marginTop: "0.2rem",
                }}
              >
                {Number(store.RATING_POINT || 0).toFixed(1)}{" "}
                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  / 5
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "0.75rem 1.25rem",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                textAlign: "center",
                minWidth: "110px",
              }}
            >
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "#64748b",
                  fontWeight: "bold",
                }}
              >
                📦 ยอดขายสะสม
              </div>
              <div
                style={{
                  fontSize: "1.45rem",
                  fontWeight: "bold",
                  color: "#059669",
                  marginTop: "0.2rem",
                }}
              >
                {Number(store.SELLING_RATE || 0).toLocaleString()}{" "}
                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  ชิ้น
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "0.75rem 1.25rem",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                textAlign: "center",
                minWidth: "110px",
              }}
            >
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "#64748b",
                  fontWeight: "bold",
                }}
              >
                🛍️ สินค้าทั้งหมด
              </div>
              <div
                style={{
                  fontSize: "1.45rem",
                  fontWeight: "bold",
                  color: "#2563eb",
                  marginTop: "0.2rem",
                }}
              >
                {products.length}{" "}
                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  รายการ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ระบบขนส่งที่ร้านค้ารองรับ (Shipping Services) */}
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px dashed #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontWeight: "bold",
                fontSize: "0.9rem",
                color: "#334155",
              }}
            >
              🚚 ช่องทางการจัดส่งที่รองรับ:
            </span>
            {store.services && store.services.length > 0 ? (
              store.services.map((svc) => (
                <div
                  key={svc.DVSERVICE_ID}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "8px",
                    backgroundColor: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    color: "#1e293b",
                  }}
                >
                  <strong style={{ color: "#2563eb" }}>
                    {svc.DVSERVICE_NAME}
                  </strong>
                  <span style={{ color: "#94a3b8" }}>|</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color:
                        svc.IS_PICKUP_ENABLED === "Y" ? "#15803d" : "#94a3b8",
                    }}
                  >
                    Pickup {svc.IS_PICKUP_ENABLED === "Y" ? "✓" : "✗"}
                  </span>
                  <span style={{ color: "#cbd5e1" }}>•</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color:
                        svc.IS_DROPOFF_ENABLED === "Y" ? "#15803d" : "#94a3b8",
                    }}
                  >
                    Dropoff {svc.IS_DROPOFF_ENABLED === "Y" ? "✓" : "✗"}
                  </span>
                </div>
              ))
            ) : (
              <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                ยังไม่ได้เปิดให้บริการจัดส่ง
              </span>
            )}
          </div>

          {isOwner && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link
                to={`/product-manager/${store.ST_ID}`}
                className="btn-interactive"
                style={{
                  padding: "0.45rem 0.9rem",
                  backgroundColor: "#2563eb",
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                ⚙️ จัดการสินค้าในร้าน
              </Link>
              <Link
                to="/profile"
                className="btn-interactive"
                style={{
                  padding: "0.45rem 0.9rem",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                }}
              >
                ตั้งค่าร้านค้า
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ส่วนแสดงสินค้าทั้งหมดของร้าน (Products Section) */}
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
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>
            🛍️ สินค้าทั้งหมดของร้าน ({products.length} ชิ้น)
          </h2>
          <p
            style={{
              margin: "0.25rem 0 0 0",
              color: "#64748b",
              fontSize: "0.82rem",
            }}
          >
            ค้นหาและเลือกชมสินค้าคุณภาพจากร้าน {store.ST_NAME}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="🔍 ค้นหาสินค้าในร้าน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{
              padding: "0.45rem 0.85rem",
              fontSize: "0.85rem",
              width: "210px",
            }}
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "0.45rem 0.8rem",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontSize: "0.85rem",
              fontWeight: "500",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="default">สินค้าล่าสุด</option>
            <option value="rating">⭐ เรตติ้งสินค้าสูงสุด</option>
            <option value="price-asc">💵 ราคา: ต่ำสุด → สูงสุด</option>
            <option value="price-desc">💵 ราคา: สูงสุด → ต่ำสุด</option>
          </select>
        </div>
      </div>

      {/* รายการสินค้าในร้าน */}
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
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📦</div>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e293b" }}>
            {searchQuery
              ? "ไม่พบสินค้าที่ตรงกับคำค้นหา"
              : "ร้านค้านี้ยังไม่มีสินค้าวางจำหน่าย"}
          </h3>
          <p
            style={{
              color: "#64748b",
              fontSize: "0.9rem",
              margin: "0 0 1rem 0",
            }}
          >
            {searchQuery
              ? "ลองพิมพ์ค้นหาด้วยชื่ออื่น"
              : isOwner
                ? "คุณสามารถเพิ่มสินค้าลงในร้านค้าได้ทันทีผ่านระบบจัดการสินค้า"
                : "กรุณากลับมาดูใหม่อีกครั้งในภายหลัง"}
          </p>
          {isOwner && (
            <Link
              to={`/product-manager/${store.ST_ID}`}
              className="btn-interactive"
              style={{
                display: "inline-block",
                padding: "0.55rem 1.25rem",
                backgroundColor: "#2563eb",
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              ➕ เพิ่มสินค้าชิ้นแรก
            </Link>
          )}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {paginatedProducts.map((item, idx) => {
              const isClosed = !isOpen || item.IS_OPEN === "N";
              const isOutOfStock = (item.STOCK ?? 0) <= 0;
              return (
                <div
                  key={item.PRODUCT_ID}
                  className="product-card stagger-item"
                  style={{
                    animationDelay: `${(idx % 12) * 35}ms`,
                    border: isClosed
                      ? "2px solid #ef4444"
                      : isOutOfStock
                        ? "1.5px solid #fca5a5"
                        : "1px solid #e2e8f0",
                    borderRadius: "14px",
                    overflow: "hidden",
                    backgroundColor: isClosed
                      ? "#fef2f2"
                      : isOutOfStock
                        ? "#fffdfd"
                        : "#fff",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
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

                    {isOutOfStock && (
                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
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
                        🚫 สินค้าหมด
                      </div>
                    )}

                    <div className="product-card-img-wrap">
                      <img
                        className="product-card-img"
                        src={
                          item.IMAGE_URL ||
                          `https://placehold.co/300x200?text=${encodeURIComponent(
                            item.PRODUCT_NAME
                          )}`
                        }
                        alt={item.PRODUCT_NAME}
                        style={{
                          width: "100%",
                          height: "165px",
                          objectFit: "cover",
                          display: "block",
                          filter:
                            isClosed || isOutOfStock
                              ? "grayscale(70%)"
                              : "none",
                          opacity: isOutOfStock ? 0.8 : 1,
                        }}
                      />
                    </div>

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
                          {item.TYPE} •{" "}
                          {isOutOfStock ? (
                            <strong style={{ color: "#dc2626" }}>
                              สินค้าหมด (0 ชิ้น)
                            </strong>
                          ) : (
                            `เหลือ ${item.STOCK} ชิ้น`
                          )}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#d97706",
                            fontWeight: "bold",
                            backgroundColor: "#fef3c7",
                            padding: "2px 6px",
                            borderRadius: "6px",
                          }}
                        >
                          ⭐ {item.RATING ?? 0}
                        </span>
                      </div>

                      <h3
                        style={{
                          fontSize: "1rem",
                          margin: "0.5rem 0 0.25rem 0",
                          color: "#0f172a",
                        }}
                      >
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
                            fontSize: "1.18rem",
                            fontWeight: "800",
                            color: isClosed
                              ? "#991b1b"
                              : isOutOfStock
                                ? "#64748b"
                                : "#059669",
                          }}
                        >
                          ฿
                          {item.PRODUCT_PRICE
                            ? item.PRODUCT_PRICE.toLocaleString()
                            : 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "0 1rem 1rem 1rem" }}>
                    <Link
                      to={`/product/${item.PRODUCT_ID}`}
                      className="btn-interactive"
                      style={{
                        display: "block",
                        textAlign: "center",
                        padding: "0.55rem",
                        backgroundColor: isClosed
                          ? "#dc2626"
                          : isOutOfStock
                            ? "#64748b"
                            : "#2563eb",
                        color: "white",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                      }}
                    >
                      {isClosed
                        ? "ดูรายละเอียด (ร้านปิด)"
                        : isOutOfStock
                          ? "ดูรายละเอียด (สินค้าหมด)"
                          : "ดูรายละเอียด"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ส่วนควบคุมการแบ่งหน้า (Pagination Controls) */}
          {totalItems > 0 && (
            <div
              style={{
                marginTop: "2.5rem",
                padding: "1rem 1.5rem",
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                กำลังแสดงรายการที่{" "}
                <strong style={{ color: "#0f172a" }}>
                  {startIndex + 1} - {endIndex}
                </strong>{" "}
                จากทั้งหมด{" "}
                <strong style={{ color: "#0f172a" }}>{totalItems}</strong>{" "}
                รายการ
                <span style={{ marginLeft: "0.5rem", color: "#94a3b8" }}>
                  (หน้า {safeCurrentPage} จาก {totalPages})
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage <= 1}
                  className="btn-interactive"
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    backgroundColor:
                      safeCurrentPage <= 1 ? "#f8fafc" : "#ffffff",
                    color: safeCurrentPage <= 1 ? "#cbd5e1" : "#475569",
                    cursor: safeCurrentPage <= 1 ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  ‹ ย้อนกลับ
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                  (pageNum) => {
                    const isActive = pageNum === safeCurrentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className="btn-interactive"
                        style={{
                          minWidth: "36px",
                          height: "36px",
                          padding: "0 0.5rem",
                          borderRadius: "8px",
                          border: isActive
                            ? "1.5px solid #2563eb"
                            : "1px solid #e2e8f0",
                          backgroundColor: isActive ? "#2563eb" : "#ffffff",
                          color: isActive ? "#ffffff" : "#334155",
                          fontWeight: isActive ? "bold" : "500",
                          fontSize: "0.875rem",
                          cursor: "pointer",
                          boxShadow: isActive
                            ? "0 2px 4px rgba(37,99,235,0.25)"
                            : "none",
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}

                <button
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage >= totalPages}
                  className="btn-interactive"
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    backgroundColor:
                      safeCurrentPage >= totalPages ? "#f8fafc" : "#ffffff",
                    color:
                      safeCurrentPage >= totalPages ? "#cbd5e1" : "#475569",
                    cursor:
                      safeCurrentPage >= totalPages ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  ถัดไป ›
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  แสดงต่อหน้า:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  style={{
                    padding: "0.4rem 0.65rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#334155",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value={10}>10 ชิ้น</option>
                  <option value={20}>20 ชิ้น</option>
                  <option value={40}>40 ชิ้น</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Store;
