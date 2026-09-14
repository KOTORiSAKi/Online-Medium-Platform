import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [id]);

  const handleAddToCart = async () => {
    if (product.STOCK <= 0) {
      alert("ขออภัย สินค้านี้หมดแล้วครับ");
      return;
    }

    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser) {
      alert("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า!");
      navigate("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acId: loggedInUser.AC_ID,
          stId: product.ST_ID,
          productId: product.PRODUCT_ID,
          price: product.PRODUCT_PRICE,
          qty: 1,
        }),
      });

      if (res.ok) {
        alert(`เพิ่ม "${product.PRODUCT_NAME}" ลงตะกร้าเรียบร้อยแล้ว!`);
        navigate("/market");
      }
    } catch (err) {
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    }
  };

  if (loading)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        กำลังดึงข้อมูล... ⏳
      </div>
    );
  if (!product)
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>
        ❌ ไม่พบสินค้ารหัสนี้
      </div>
    );

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <Link to="/" style={{ color: "#64748b", textDecoration: "none" }}>
        ← กลับหน้าแรก
      </Link>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginTop: "1.5rem",
        }}
      >
        <div>
          <img
            src={
              product.IMAGE_URL ||
              `https://placehold.co/500x400?text=${encodeURIComponent(product.PRODUCT_NAME)}`
            }
            alt={product.PRODUCT_NAME}
            style={{ width: "100%", borderRadius: "12px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <h1 style={{ fontSize: "1.5rem", margin: "0.5rem 0" }}>
            {product.PRODUCT_NAME}
          </h1>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
            หมวดหมู่: {product.TYPE} • เหลือ: {product.STOCK} ชิ้น
          </span>
          <span style={{ fontSize: "0.9rem", color: product.IS_OPEN === "N" ? "#dc2626" : "#059669", fontWeight: "bold", marginTop: "0.25rem" }}>
            🏪 ร้านค้า: {product.ST_NAME} {product.IS_OPEN === "N" ? "🔴 (ปิดให้บริการชั่วคราว)" : "🟢 (เปิดให้บริการ)"}
          </span>

          {/* 💡 แจ้งเตือนถ้าร้านปิด */}
          {product.IS_OPEN === "N" && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                border: "1px solid #f87171",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginTop: "0.75rem",
                color: "#991b1b",
                fontSize: "0.9rem",
              }}
            >
              <strong>⚠️ แจ้งเตือน:</strong> ร้านนี้ปิดให้บริการชั่วคราว<br />
              <span style={{ fontSize: "0.8rem", color: "#b91c1c" }}>
                * คุณยังสามารถกดเพิ่มสินค้าลงตะกร้าได้ แต่จะไม่สามารถกดยืนยันสั่งซื้อจนกว่าทางร้านจะเปิดให้บริการ
              </span>
            </div>
          )}

          <div
            style={{
              padding: "1rem",
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              margin: "1rem 0",
            }}
          >
            <span
              style={{
                fontSize: "1.8rem",
                fontWeight: "bold",
                color: "#059669",
              }}
            >
              ฿
              {product.PRODUCT_PRICE
                ? product.PRODUCT_PRICE.toLocaleString()
                : 0}
            </span>
          </div>

          {/* โชว์ Description จาก DB */}
          <div
            style={{
              marginBottom: "1.5rem",
              lineHeight: "1.6",
              color: "#475569",
            }}
          >
            <h4>รายละเอียดสินค้า:</h4>
            <p>{product.DESCRIPTION || "ไม่มีคำอธิบาย"}</p>
            <ul style={{ paddingLeft: "20px", marginTop: "10px", fontSize: "0.9rem" }}>
              <li><strong>น้ำหนัก:</strong> {product.WEIGHT ? product.WEIGHT + " kg" : "ไม่ระบุ"}</li>
              <li><strong>ขนาด (กว้าง x ยาว x สูง):</strong> {product.WIDTH && product.LENGTH && product.HEIGHT ? `${product.WIDTH} x ${product.LENGTH} x ${product.HEIGHT} cm` : "ไม่ระบุ"}</li>
            </ul>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "auto" }}>
            <button
              onClick={handleAddToCart}
              disabled={product.STOCK <= 0}
              style={{
                flex: 1,
                padding: "0.75rem",
                backgroundColor: product.STOCK <= 0 ? "#cbd5e0" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: product.STOCK <= 0 ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              {product.STOCK <= 0 ? "สินค้าหมด" : "🛒 เพิ่มลงตะกร้า"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Product;
