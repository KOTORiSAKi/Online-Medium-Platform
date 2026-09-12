import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function Market() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [groupedCart, setGroupedCart] = useState({});
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันดึงข้อมูลตะกร้าจาก DB (แยกออกมาเพื่อให้เรียกใช้ซ้ำได้เวลากด + -)
  const fetchCartData = useCallback((acId) => {
    fetch(`http://localhost:5000/api/cart/${acId}`)
      .then((res) => res.json())
      .then((data) => {
        const groups = data.reduce((acc, item) => {
          if (!acc[item.ORDER_ID]) {
            acc[item.ORDER_ID] = {
              storeName: item.ST_NAME,
              items: [],
              total: 0,
            };
          }
          acc[item.ORDER_ID].items.push(item);
          acc[item.ORDER_ID].total += item.QUANTITY * item.UNIT_PRICE;
          return acc;
        }, {});
        setGroupedCart(groups);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser) {
      navigate("/login");
      return;
    }
    setUser(loggedInUser);
    fetchCartData(loggedInUser.AC_ID);
  }, [navigate, fetchCartData]);

  // ฟังก์ชันจัดการเพิ่มลดจำนวนและลบ
  const handleUpdateQty = async (orderDetailId, currentQty, change) => {
    const newQty = currentQty + change;

    // ถ้ายอดกลายเป็น 0 ให้ขึ้นแจ้งเตือนก่อนลบ
    if (newQty <= 0) {
      if (!window.confirm("ต้องการลบสินค้านี้ออกจากตะกร้าใช่หรือไม่?")) return;
    }

    try {
      await fetch("http://localhost:5000/api/cart/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderDetailId, newQty }),
      });
      // อัปเดตเสร็จ สั่งให้ดึงข้อมูลตะกร้าใหม่ทันที (UI จะเปลี่ยนตาม)
      fetchCartData(user.AC_ID);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการอัปเดตตะกร้า");
    }
  };

  const grandTotal = Object.values(groupedCart).reduce(
    (sum, group) => sum + group.total,
    0,
  );

  const handleCheckout = async () => {
    const orderIds = Object.keys(groupedCart);
    try {
      const res = await fetch("http://localhost:5000/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds }),
      });
      if (res.ok) {
        alert(`สั่งซื้อสำเร็จ! สถานะถูกเปลี่ยนเป็น 'รอจัดส่ง' แล้ว`);
        setGroupedCart({});
        navigate("/profile");
      }
    } catch (err) {
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  if (loading)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        กำลังโหลดตะกร้า... ⏳
      </div>
    );

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1>🛒 ตะกร้าสินค้า</h1>
      {Object.keys(groupedCart).length === 0 ? (
        <div
          style={{ textAlign: "center", padding: "3rem 0", color: "#64748b" }}
        >
          <p>ยังไม่มีสินค้าในตะกร้า</p>
          <button
            onClick={() => navigate("/")}
            style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
          >
            ไปช้อปปิ้งกันเลย!
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "2rem",
          }}
        >
          <div>
            {Object.entries(groupedCart).map(([orderId, group]) => (
              <div
                key={orderId}
                style={{
                  border: "1px solid #e2e8f0",
                  marginBottom: "1.5rem",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid #e2e8f0",
                    fontWeight: "bold",
                  }}
                >
                  🏪 ร้าน: {group.storeName} (บิล #{orderId})
                </div>
                {group.items.map((item) => (
                  <div
                    key={item.ORDER_DETAIL_ID}
                    style={{
                      padding: "1rem",
                      display: "flex",
                      gap: "1rem",
                      borderBottom: "1px solid #f1f5f9",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={item.IMAGE_URL || `https://placehold.co/100x100`}
                      alt={item.PRODUCT_NAME}
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 0.25rem 0" }}>
                        {item.PRODUCT_NAME}
                      </h4>
                      <p
                        style={{
                          margin: "0 0 0.5rem 0",
                          fontSize: "0.9rem",
                          color: "#059669",
                          fontWeight: "bold",
                        }}
                      >
                        ฿{item.UNIT_PRICE.toLocaleString()}
                      </p>

                      {/* ส่วนปุ่มปรับจำนวน */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            border: "1px solid #cbd5e0",
                            borderRadius: "4px",
                          }}
                        >
                          <button
                            onClick={() =>
                              handleUpdateQty(
                                item.ORDER_DETAIL_ID,
                                item.QUANTITY,
                                -1,
                              )
                            }
                            style={{
                              padding: "0.2rem 0.6rem",
                              background: "#f8fafc",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            -
                          </button>
                          <span
                            style={{ padding: "0 0.8rem", fontSize: "0.9rem" }}
                          >
                            {item.QUANTITY}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQty(
                                item.ORDER_DETAIL_ID,
                                item.QUANTITY,
                                1,
                              )
                            }
                            style={{
                              padding: "0.2rem 0.6rem",
                              background: "#f8fafc",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() =>
                            handleUpdateQty(
                              item.ORDER_DETAIL_ID,
                              item.QUANTITY,
                              -item.QUANTITY,
                            )
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          ลบทิ้ง
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "right",
                    background: "#fcfcfc",
                  }}
                >
                  รวมร้านนี้:{" "}
                  <strong style={{ color: "#059669" }}>
                    ฿{group.total.toLocaleString()}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: "1.5rem",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              backgroundColor: "#f8fafc",
              height: "fit-content",
            }}
          >
            <h3 style={{ margin: "0 0 1rem 0" }}>สรุปยอดทั้งหมด</h3>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1.2rem",
                marginBottom: "1.5rem",
              }}
            >
              <span>ยอดสุทธิรวม:</span>
              <strong style={{ color: "#059669" }}>
                ฿{grandTotal.toLocaleString()}
              </strong>
            </div>
            <button
              onClick={handleCheckout}
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "#059669",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
              }}
            >
              ยืนยันการสั่งซื้อทั้งหมด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Market;
