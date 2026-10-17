import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";

function Product() {
  const { showAlert } = usePopup();

  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setQty(1);
    fetch(`http://localhost:5000/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = async (buyNow = false) => {
    if (!product || product.STOCK <= 0) {
      showAlert("ขออภัย สินค้านี้หมดแล้วครับ");
      return;
    }

    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser) {
      showAlert("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า!");
      navigate("/login");
      return;
    }

    const safeQty = Math.max(1, Math.min(qty, product.STOCK));

    try {
      const res = await fetch("http://localhost:5000/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acId: loggedInUser.AC_ID,
          stId: product.ST_ID,
          productId: product.PRODUCT_ID,
          price: product.PRODUCT_PRICE,
          qty: safeQty,
        }),
      });

      if (res.ok) {
        window.dispatchEvent(new CustomEvent("cart-updated"));
        showAlert(
          `เพิ่ม "${product.PRODUCT_NAME}" จำนวน ${safeQty} ชิ้น ลงตะกร้าเรียบร้อยแล้ว!`
        );
        if (buyNow) {
          navigate("/market");
        } else {
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 1600);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        showAlert(data.error || "ไม่สามารถเพิ่มลงตะกร้าได้");
      }
    } catch (err) {
      showAlert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    }
  };

  if (loading) {
    return (
      <div
        className="page-enter"
        style={{ padding: "2rem", maxWidth: "960px", margin: "0 auto" }}
      >
        <div
          className="skeleton"
          style={{ width: "120px", height: "20px", marginBottom: "1.5rem" }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "2.25rem",
            backgroundColor: "#ffffff",
            padding: "2rem",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            className="skeleton"
            style={{ width: "100%", height: "360px", borderRadius: "14px" }}
          />
          <div>
            <div
              className="skeleton"
              style={{ width: "75%", height: "32px", marginBottom: "14px" }}
            />
            <div
              className="skeleton"
              style={{ width: "50%", height: "20px", marginBottom: "18px" }}
            />
            <div
              className="skeleton"
              style={{
                width: "100%",
                height: "64px",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            />
            <div
              className="skeleton"
              style={{ width: "90%", height: "18px", marginBottom: "10px" }}
            />
            <div
              className="skeleton"
              style={{ width: "70%", height: "18px", marginBottom: "30px" }}
            />
            <div
              className="skeleton"
              style={{ width: "100%", height: "48px", borderRadius: "10px" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div
        className="page-enter"
        style={{ padding: "3rem", textAlign: "center", color: "#dc2626" }}
      >
        <h2>❌ ไม่พบสินค้ารหัสนี้</h2>
        <Link to="/" style={{ color: "#2563eb", fontWeight: "bold" }}>
          ← กลับสู่หน้าแรก
        </Link>
      </div>
    );
  }

  const maxStock = Math.max(0, Number(product.STOCK) || 0);
  const unitPrice = Number(product.PRODUCT_PRICE) || 0;

  return (
    <div
      className="page-enter"
      style={{ padding: "2rem", maxWidth: "980px", margin: "0 auto" }}
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="btn-interactive"
        style={{
          background: "none",
          border: "none",
          color: "#64748b",
          fontSize: "0.92rem",
          fontWeight: "600",
          cursor: "pointer",
          padding: 0,
          marginBottom: "1.25rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
        }}
      >
        ← ย้อนกลับ
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2.25rem",
          backgroundColor: "#ffffff",
          padding: "2rem",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.05)",
        }}
      >
        <div
          className="product-card-img-wrap"
          style={{
            borderRadius: "16px",
            border: "1px solid #f1f5f9",
            backgroundColor: "#f8fafc",
            alignSelf: "start",
          }}
        >
          <img
            className="product-card-img"
            src={
              product.IMAGE_URL ||
              `https://placehold.co/500x400?text=${encodeURIComponent(
                product.PRODUCT_NAME
              )}`
            }
            alt={product.PRODUCT_NAME}
            style={{
              width: "100%",
              maxHeight: "420px",
              objectFit: "cover",
              borderRadius: "16px",
              display: "block",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: "700",
                color: "#2563eb",
                backgroundColor: "#eff6ff",
                padding: "0.2rem 0.65rem",
                borderRadius: "9999px",
                border: "1px solid #bfdbfe",
              }}
            >
              🏷️ {product.TYPE || "ทั่วไป"}
            </span>
            {maxStock <= 0 ? (
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "#dc2626",
                  fontWeight: "bold",
                  backgroundColor: "#fee2e2",
                  padding: "0.2rem 0.65rem",
                  borderRadius: "9999px",
                  border: "1px solid #fca5a5",
                }}
              >
                🔴 สินค้าหมดชั่วคราว (Out of Stock)
              </span>
            ) : (
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "#059669",
                  fontWeight: "bold",
                  backgroundColor: "#dcfce7",
                  padding: "0.2rem 0.65rem",
                  borderRadius: "9999px",
                  border: "1px solid #86efac",
                }}
              >
                🟢 มีสินค้าพร้อมส่ง (คงเหลือ {maxStock} ชิ้น)
              </span>
            )}
          </div>

          <h1
            style={{
              fontSize: "1.65rem",
              margin: "0.65rem 0 0.4rem 0",
              color: "#0f172a",
            }}
          >
            {product.PRODUCT_NAME}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginTop: "0.15rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "0.95rem",
                color: "#d97706",
                fontWeight: "bold",
                backgroundColor: "#fef3c7",
                padding: "0.15rem 0.55rem",
                borderRadius: "6px",
              }}
            >
              ⭐ {product.RATING ? Number(product.RATING).toFixed(1) : "0.0"} /
              5.0
            </span>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              (คะแนนเฉลี่ยร้านค้า: ⭐{" "}
              {product.RATING_POINT
                ? Number(product.RATING_POINT).toFixed(1)
                : "0.0"}
              )
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.6rem",
              marginTop: "0.75rem",
              padding: "0.65rem 0.9rem",
              backgroundColor: "#f8fafc",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "0.9rem",
                color: product.IS_OPEN === "N" ? "#dc2626" : "#059669",
                fontWeight: "bold",
              }}
            >
              🏪 ร้านค้า:{" "}
              <Link
                to={`/store/${product.ST_ID}`}
                style={{
                  color: "#2563eb",
                  textDecoration: "underline",
                  fontWeight: "bold",
                }}
              >
                {product.ST_NAME}
              </Link>{" "}
              {product.IS_OPEN === "N"
                ? "🔴 (ปิดชั่วคราว)"
                : "🟢 (เปิดให้บริการ)"}
            </span>
            <Link
              to={`/store/${product.ST_ID}`}
              className="btn-interactive"
              style={{
                fontSize: "0.8rem",
                padding: "0.28rem 0.7rem",
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                borderRadius: "6px",
                border: "1px solid #bfdbfe",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              เยี่ยมชมร้านค้า →
            </Link>
          </div>

          {/* แจ้งเตือนถ้าร้านปิด */}
          {product.IS_OPEN === "N" && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                border: "1px solid #f87171",
                borderRadius: "10px",
                padding: "0.75rem 1rem",
                marginTop: "0.75rem",
                color: "#991b1b",
                fontSize: "0.88rem",
              }}
            >
              <strong>⚠️ แจ้งเตือน:</strong> ร้านนี้ปิดให้บริการชั่วคราว
              <br />
              <span style={{ fontSize: "0.8rem", color: "#b91c1c" }}>
                * คุณยังสามารถกดเพิ่มสินค้าลงตะกร้าได้
                แต่จะไม่สามารถกดยืนยันสั่งซื้อจนกว่าทางร้านจะเปิดให้บริการ
              </span>
            </div>
          )}

          {/* แจ้งเตือนถ้าสินค้าหมดสต็อก */}
          {maxStock <= 0 && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #f87171",
                borderRadius: "10px",
                padding: "0.75rem 1rem",
                marginTop: "0.75rem",
                color: "#991b1b",
                fontSize: "0.88rem",
              }}
            >
              <strong>⚠️ สินค้าหมดสต็อก:</strong> ขออภัย
              สินค้านี้หมดแล้วในขณะนี้ ทางร้านกำลังจัดเตรียมสินค้าเพิ่มเติม
            </div>
          )}

          <div
            style={{
              padding: "1rem 1.25rem",
              background:
                "linear-gradient(135deg var(--in-oklab), #ecfdf5, #f8fafc)",
              border: "1px solid #bbf7d0",
              borderRadius: "12px",
              margin: "1rem 0",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "1.95rem",
                  fontWeight: "800",
                  color: "#059669",
                }}
              >
                ฿{unitPrice.toLocaleString()}
              </span>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "#64748b",
                  marginLeft: "0.4rem",
                }}
              >
                / ชิ้น
              </span>
            </div>
            {qty > 1 && (
              <div style={{ fontSize: "0.9rem", color: "#047857" }}>
                รวม ({qty} ชิ้น):{" "}
                <strong>฿{(unitPrice * qty).toLocaleString()}</strong>
              </div>
            )}
          </div>

          {/* โชว์ Description จาก DB */}
          <div
            style={{
              marginBottom: "1.25rem",
              lineHeight: "1.6",
              color: "#475569",
              fontSize: "0.92rem",
            }}
          >
            <h4 style={{ margin: "0 0 0.35rem 0", color: "#1e293b" }}>
              รายละเอียดสินค้า:
            </h4>
            <p style={{ margin: "0 0 0.6rem 0" }}>
              {product.DESCRIPTION || "ไม่มีคำอธิบาย"}
            </p>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                fontSize: "0.84rem",
                backgroundColor: "#f8fafc",
                padding: "0.6rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid #f1f5f9",
              }}
            >
              <span>
                ⚖️ <strong>น้ำหนัก:</strong>{" "}
                {product.WEIGHT ? `${product.WEIGHT} kg` : "ไม่ระบุ"}
              </span>
              <span>
                📐 <strong>ขนาด:</strong>{" "}
                {product.WIDTH && product.LENGTH && product.HEIGHT
                  ? `${product.WIDTH} × ${product.LENGTH} × ${product.HEIGHT} cm`
                  : "ไม่ระบุ"}
              </span>
            </div>
          </div>

          {/* ตัวเลือกจำนวนสินค้า */}
          {maxStock > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1.25rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#334155",
                }}
              >
                จำนวนที่ต้องการ:
              </span>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  border: "1.5px solid #cbd5e1",
                  borderRadius: "10px",
                  overflow: "hidden",
                  backgroundColor: "#ffffff",
                }}
              >
                <button
                  type="button"
                  disabled={qty <= 1}
                  onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                  style={{
                    width: "36px",
                    height: "36px",
                    border: "none",
                    backgroundColor: qty <= 1 ? "#f8fafc" : "#f1f5f9",
                    color: qty <= 1 ? "#cbd5e1" : "#0f172a",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    cursor: qty <= 1 ? "not-allowed" : "pointer",
                  }}
                >
                  −
                </button>
                <span
                  style={{
                    minWidth: "46px",
                    textAlign: "center",
                    fontWeight: "700",
                    fontSize: "0.95rem",
                    color: "#0f172a",
                  }}
                >
                  {qty}
                </span>
                <button
                  type="button"
                  disabled={qty >= maxStock}
                  onClick={() => setQty((prev) => Math.min(maxStock, prev + 1))}
                  style={{
                    width: "36px",
                    height: "36px",
                    border: "none",
                    backgroundColor: qty >= maxStock ? "#f8fafc" : "#f1f5f9",
                    color: qty >= maxStock ? "#cbd5e1" : "#0f172a",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    cursor: qty >= maxStock ? "not-allowed" : "pointer",
                  }}
                >
                  +
                </button>
              </div>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                (สูงสุด {maxStock} ชิ้น)
              </span>
            </div>
          )}

          {/* ปุ่มเพิ่มลงตะกร้า & ซื้อเลย */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginTop: "auto",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => handleAddToCart(false)}
              disabled={maxStock <= 0}
              className="btn-interactive"
              style={{
                flex: 1,
                minWidth: "160px",
                padding: "0.85rem 1rem",
                backgroundColor:
                  maxStock <= 0
                    ? "#94a3b8"
                    : justAdded
                      ? "#059669"
                      : "#eff6ff",
                color:
                  maxStock <= 0
                    ? "#ffffff"
                    : justAdded
                      ? "#ffffff"
                      : "#1d4ed8",
                border:
                  maxStock <= 0 || justAdded
                    ? "none"
                    : "1.5px solid #2563eb",
                borderRadius: "10px",
                cursor: maxStock <= 0 ? "not-allowed" : "pointer",
                fontWeight: "700",
                fontSize: "0.96rem",
              }}
            >
              {maxStock <= 0
                ? "🚫 สินค้าหมดสต็อก"
                : justAdded
                  ? "✓ เพิ่มลงตะกร้าแล้ว!"
                  : "🛒 เพิ่มลงตะกร้า"}
            </button>

            {maxStock > 0 && (
              <button
                type="button"
                onClick={() => handleAddToCart(true)}
                className="btn-interactive"
                style={{
                  flex: 1,
                  minWidth: "160px",
                  padding: "0.85rem 1rem",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "0.96rem",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                }}
              >
                ⚡ ซื้อเลยทันที
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Product;
