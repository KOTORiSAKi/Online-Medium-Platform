import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

function OrderHistory() {
  const navigate = useNavigate();

  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser) {
      navigate("/login");
      return;
    }

    fetch(`http://localhost:5000/api/orders?acId=${loggedInUser.AC_ID}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistoryOrders(data.filter((o) => o.STATUS === "Reviewed"));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <div
        className="page-enter"
        style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}
      >
        <div
          className="skeleton"
          style={{ width: "220px", height: "32px", marginBottom: "1.5rem" }}
        />
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              padding: "1.5rem",
              marginBottom: "1rem",
            }}
          >
            <div
              className="skeleton"
              style={{ width: "45%", height: "22px", marginBottom: "10px" }}
            />
            <div
              className="skeleton"
              style={{ width: "30%", height: "14px", marginBottom: "16px" }}
            />
            <div
              className="skeleton"
              style={{ width: "100%", height: "48px", borderRadius: "8px" }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="page-enter"
      style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.65rem", color: "#0f172a" }}>
            📋 ประวัติการสั่งซื้อสำเร็จ
          </h1>
          <p
            style={{
              margin: "0.25rem 0 0 0",
              color: "#64748b",
              fontSize: "0.9rem",
            }}
          >
            รายการคำสั่งซื้อที่คุณได้รับสินค้าและให้คะแนนรีวิวเรียบร้อยแล้ว (
            {historyOrders.length} รายการ)
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/market")}
          className="btn-interactive"
          style={{
            padding: "0.55rem 1.1rem",
            backgroundColor: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            color: "#334155",
            fontWeight: "600",
            fontSize: "0.88rem",
            cursor: "pointer",
          }}
        >
          ← กลับไปหน้าการสั่งซื้อ
        </button>
      </div>

      {historyOrders.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3.5rem 1.5rem",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px dashed #cbd5e1",
            color: "#64748b",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📭</div>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e293b" }}>
            ยังไม่มีประวัติการสั่งซื้อที่เสร็จสมบูรณ์
          </h3>
          <p style={{ margin: "0 0 1.25rem 0", fontSize: "0.9rem" }}>
            เมื่อคุณสั่งซื้อและกดรับสินค้าพร้อมรีวิว รายการจะมาแสดงที่นี่
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn-interactive"
            style={{
              padding: "0.6rem 1.35rem",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            🛍️ เลือกซื้อสินค้าเลย
          </button>
        </div>
      ) : (
        historyOrders.map((order, idx) => (
          <div
            key={order.ORDER_ID}
            className="product-card stagger-item"
            style={{
              animationDelay: `${idx * 45}ms`,
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "1.5rem",
              marginBottom: "1.1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1rem",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>
                  🏪 ร้าน:{" "}
                  {order.ST_ID ? (
                    <Link
                      to={`/store/${order.ST_ID}`}
                      style={{ color: "#2563eb", textDecoration: "underline" }}
                    >
                      {order.ST_NAME}
                    </Link>
                  ) : (
                    order.ST_NAME
                  )}{" "}
                  <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                    (บิล #{order.ORDER_ID})
                  </span>
                </h3>
                <small style={{ color: "#64748b" }}>
                  🕒 สั่งเมื่อ: {new Date(order.ORDER_DATE).toLocaleString()}
                </small>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    color: "#f59e0b",
                    fontSize: "1.15rem",
                    letterSpacing: "1px",
                  }}
                >
                  {Array(order.RATING || 5)
                    .fill("★")
                    .join("")}
                  {Array(5 - (order.RATING || 5))
                    .fill("☆")
                    .join("")}
                </div>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "0.2rem",
                    backgroundColor: "#dcfce7",
                    color: "#15803d",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    padding: "0.15rem 0.6rem",
                    borderRadius: "9999px",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  ✓ สำเร็จแล้ว
                </span>
              </div>
            </div>

            <div
              style={{
                marginBottom: "1rem",
                backgroundColor: "#f8fafc",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
              }}
            >
              {order.items.map((item) => (
                <div
                  key={item.ORDER_DETAIL_ID}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    marginBottom: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <img
                    src={
                      item.IMAGE_URL ||
                      `https://placehold.co/48x48?text=${encodeURIComponent(
                        item.PRODUCT_NAME
                      )}`
                    }
                    alt={item.PRODUCT_NAME}
                    style={{
                      width: "44px",
                      height: "44px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontWeight: "600",
                      color: "#1e293b",
                      fontSize: "0.92rem",
                    }}
                  >
                    {item.PRODUCT_NAME}
                  </span>
                  <span style={{ color: "#64748b", fontSize: "0.88rem" }}>
                    x{item.QUANTITY} ชิ้น
                  </span>
                  <strong style={{ color: "#0f172a" }}>
                    ฿{(item.QUANTITY * item.UNIT_PRICE).toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "baseline",
                gap: "0.5rem",
                borderTop: "1px dashed #e2e8f0",
                paddingTop: "0.9rem",
              }}
            >
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                ยอดรวมทั้งสิ้น:{" "}
              </span>
              <strong style={{ fontSize: "1.25rem", color: "#059669" }}>
                ฿{Number(order.TOTAL_PRICE).toLocaleString()}
              </strong>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default OrderHistory;
