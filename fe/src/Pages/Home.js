import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  // เมื่อข้อมูลสินค้าโหลดขึ้นมาบนหน้าจอแล้ว แจ้งให้ Navbar แคปเจอร์ภาพใหม่อีกครั้ง
  useEffect(() => {
    if (!loading && products.length > 0) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('update-glass'));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, products.length]);

  if (loading)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        กำลังโหลดข้อมูลสินค้า... ⏳
      </div>
    );

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.8rem" }}>🛍️ ตลาดสินค้าชุมชน</h1>
        <p style={{ color: "#64748b" }}>สินค้าทั้งหมดจากร้านค้าชั้นนำ</p>
      </header> */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {products.map((item) => {
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
              }}
            >
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
                  `https://placehold.co/300x200?text=${encodeURIComponent(item.PRODUCT_NAME)}`
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
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b" }}>
                  <span>{item.TYPE} • เหลือ {item.STOCK} ชิ้น</span>
                  <span style={{ color: isClosed ? "#dc2626" : "#059669", fontWeight: "bold" }}>
                    🏪 {item.ST_NAME} {isClosed ? "(ปิด)" : "(เปิด)"}
                  </span>
                </div>

                <h3 style={{ fontSize: "1rem", margin: "0.5rem 0" }}>
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
                    {item.PRODUCT_PRICE ? item.PRODUCT_PRICE.toLocaleString() : 0}
                  </span>
                  {isClosed && (
                    <span style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: "bold" }}>
                      *ร้านปิดชั่วคราว
                    </span>
                  )}
                </div>

                <Link
                  to={`/product/${item.PRODUCT_ID}`}
                  style={{
                    marginTop: "1rem",
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
    </div>
  );
}

export default Home;
