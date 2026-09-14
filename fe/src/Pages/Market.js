import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function Market() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [groupedCart, setGroupedCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDetailIds, setSelectedDetailIds] = useState([]);
  const [isSelectionInitialized, setIsSelectionInitialized] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [destAddressId, setDestAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // ฟังก์ชันดึงข้อมูลตะกร้าจาก DB (รวม IS_OPEN ของร้านค้า)
  const fetchCartData = useCallback((acId) => {
    fetch(`http://localhost:5000/api/cart/${acId}`)
      .then((res) => res.json())
      .then((data) => {
        const groups = data.reduce((acc, item) => {
          if (!acc[item.ORDER_ID]) {
            acc[item.ORDER_ID] = {
              storeName: item.ST_NAME,
              isOpen: item.IS_OPEN,
              items: [],
              total: 0,
            };
          }
          acc[item.ORDER_ID].items.push(item);
          acc[item.ORDER_ID].total += item.QUANTITY * item.UNIT_PRICE;
          return acc;
        }, {});
        setGroupedCart(groups);

        const openItemIds = data
          .filter((item) => item.IS_OPEN !== "N")
          .map((item) => item.ORDER_DETAIL_ID);

        setSelectedDetailIds((prev) => {
          if (!isSelectionInitialized) {
            return openItemIds;
          }
          // กรองเอาเฉพาะรายการที่เคยเลือกไว้ และยังอยู่ในร้านที่เปิด
          return prev.filter((id) => openItemIds.includes(id));
        });
        setIsSelectionInitialized(true);
        setLoading(false);
      })
      .catch(console.error);
  }, [isSelectionInitialized]);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser) {
      navigate("/login");
      return;
    }
    setUser(loggedInUser);
    fetchCartData(loggedInUser.AC_ID);
    
    fetch(`http://localhost:5000/api/address/${loggedInUser.AC_ID}?type=HOME`)
      .then(res => res.json())
      .then(data => {
        setAddresses(data);
        const def = data.find(a => a.IS_DEFAULT === 'Y');
        if (def) setDestAddressId(def.ADDRESS_ID);
        else if (data.length > 0) setDestAddressId(data[0].ADDRESS_ID);
      })
      .catch(console.error);
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
      // อัปเดตเสร็จ สั่งให้ดึงข้อมูลตะกร้าใหม่ทันที
      fetchCartData(user.AC_ID);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการอัปเดตตะกร้า");
    }
  };

  // ดึงสินค้าทั้งหมดที่มาจากร้านที่เปิดให้บริการ
  const allOpenItems = Object.values(groupedCart)
    .filter((group) => group.isOpen !== "N")
    .flatMap((group) => group.items);

  const allOpenItemIds = allOpenItems.map((item) => item.ORDER_DETAIL_ID);

  const isAllSelected =
    allOpenItemIds.length > 0 &&
    allOpenItemIds.every((id) => selectedDetailIds.includes(id));

  // ฟังก์ชันเลือก / ยกเลิกเลือกสินค้าทั้งหมด
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedDetailIds([]);
    } else {
      setSelectedDetailIds(allOpenItemIds);
    }
  };

  // ฟังก์ชันเลือก / ยกเลิกเลือกทั้งร้าน
  const toggleStoreSelection = (group) => {
    if (group.isOpen === "N") return;
    const storeItemIds = group.items.map((it) => it.ORDER_DETAIL_ID);
    const isStoreAllSelected = storeItemIds.every((id) =>
      selectedDetailIds.includes(id)
    );

    if (isStoreAllSelected) {
      setSelectedDetailIds((prev) =>
        prev.filter((id) => !storeItemIds.includes(id))
      );
    } else {
      setSelectedDetailIds((prev) => {
        const set = new Set([...prev, ...storeItemIds]);
        return Array.from(set);
      });
    }
  };

  // ฟังก์ชันเลือก / ยกเลิกเลือกแต่ละชิ้น
  const toggleItemSelection = (orderDetailId, isOpen) => {
    if (!isOpen) return;
    setSelectedDetailIds((prev) => {
      if (prev.includes(orderDetailId)) {
        return prev.filter((id) => id !== orderDetailId);
      } else {
        return [...prev, orderDetailId];
      }
    });
  };

  // คำนวณยอดเฉพาะสินค้าที่ถูกเลือกติ๊ก
  const selectedItems = Object.values(groupedCart)
    .flatMap((group) => group.items)
    .filter((item) => selectedDetailIds.includes(item.ORDER_DETAIL_ID));

  const selectedCount = selectedItems.length;
  const selectedGrandTotal = selectedItems.reduce(
    (sum, item) => sum + item.QUANTITY * item.UNIT_PRICE,
    0
  );

  // ตรวจสอบว่ามีร้านค้าไหนในตะกร้าปิดอยู่หรือไม่
  const hasClosedStoreInCart = Object.values(groupedCart).some(
    (group) => group.isOpen === "N"
  );

  const handleCheckout = async () => {
    if (selectedDetailIds.length === 0) {
      alert("กรุณาเลือกสินค้าอย่างน้อย 1 ชิ้นที่ต้องการสั่งซื้อ");
      return;
    }
    if (!destAddressId) {
      alert("กรุณาเลือกที่อยู่จัดส่ง");
      return;
    }
    if (false) {
      alert("กรุณาเลือกสินค้าอย่างน้อย 1 ชิ้นที่ต้องการสั่งซื้อ");
      return;
    }

    // ป้องกันกรณีที่มีสินค้าที่เลือกร้านปิดอยู่
    const hasSelectedClosed = selectedItems.some((item) => item.IS_OPEN === "N");
    if (hasSelectedClosed) {
      alert("⚠️ ไม่สามารถสั่งซื้อได้: มีสินค้าจากร้านค้าที่ปิดให้บริการอยู่ในรายการที่เลือก");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedDetailIds, destAddressId, paymentMethod }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "สั่งซื้อสำเร็จ! สถานะถูกเปลี่ยนเป็น 'รอจัดส่ง' แล้ว");
        setSelectedDetailIds([]);
        fetchCartData(user.AC_ID);
        navigate("/profile");
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการสั่งซื้อ");
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
          
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "0.4rem" }}>
                📍 เลือกที่อยู่จัดส่ง:
              </label>
              <select
                value={destAddressId}
                onChange={(e) => setDestAddressId(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              >
                <option value="" disabled>-- กรุณาเลือกที่อยู่ --</option>
                {addresses.map(a => (
                  <option key={a.ADDRESS_ID} value={a.ADDRESS_ID}>
                    {a.ADDRESS_LINE} {a.SUB_DISTRICT} {a.DISTRICT} {a.PROVINCE} {a.ZIP_CODE}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "0.4rem" }}>
                💳 เลือกช่องทางการชำระเงิน:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              >
                <option value="Cash">เงินสด (Cash)</option>
                <option value="Credit Card">บัตรเครดิต (Credit Card)</option>
                <option value="Bank Transfer">โอนเงิน (Bank Transfer)</option>
              </select>
            </div>
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
            {/* บาร์เลือกสินค้าทั้งหมด */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginBottom: "1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  cursor: allOpenItemIds.length > 0 ? "pointer" : "not-allowed",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  disabled={allOpenItemIds.length === 0}
                  onChange={toggleSelectAll}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "#2563eb",
                    cursor: allOpenItemIds.length > 0 ? "pointer" : "not-allowed",
                  }}
                />
                <span>
                  เลือกสินค้าทั้งหมด ({selectedCount} / {allOpenItemIds.length} รายการที่สั่งซื้อได้)
                </span>
              </label>

              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDetailIds([])}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  ล้างการเลือก
                </button>
              )}
            </div>

            {Object.entries(groupedCart).map(([orderId, group]) => {
              const isClosed = group.isOpen === "N";
              const storeItemIds = group.items.map((it) => it.ORDER_DETAIL_ID);
              const isStoreAllSelected =
                !isClosed &&
                group.items.length > 0 &&
                storeItemIds.every((id) => selectedDetailIds.includes(id));
              const storeSelectedItems = group.items.filter((it) =>
                selectedDetailIds.includes(it.ORDER_DETAIL_ID)
              );
              const storeSelectedTotal = storeSelectedItems.reduce(
                (sum, it) => sum + it.QUANTITY * it.UNIT_PRICE,
                0
              );

              return (
                <div
                  key={orderId}
                  style={{
                    border: isClosed ? "2px solid #ef4444" : "1px solid #e2e8f0",
                    marginBottom: "1.5rem",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: isClosed ? "#fef2f2" : "#ffffff",
                  }}
                >
                  {/* Header ร้านค้า พร้อม Checkbox เลือกทั้งร้าน */}
                  <div
                    style={{
                      background: isClosed ? "#fee2e2" : "#f8fafc",
                      padding: "0.75rem 1rem",
                      borderBottom: isClosed ? "1px solid #fca5a5" : "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        cursor: isClosed ? "not-allowed" : "pointer",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isStoreAllSelected}
                        disabled={isClosed}
                        onChange={() => toggleStoreSelection(group)}
                        style={{
                          width: "18px",
                          height: "18px",
                          accentColor: "#2563eb",
                          cursor: isClosed ? "not-allowed" : "pointer",
                        }}
                      />
                      <span
                        style={{
                          fontWeight: "bold",
                          color: isClosed ? "#991b1b" : "#1e293b",
                        }}
                      >
                        🏪 ร้าน: {group.storeName} (บิล #{orderId})
                      </span>
                    </label>

                    {isClosed ? (
                      <span
                        style={{
                          backgroundColor: "#dc2626",
                          color: "white",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                        }}
                      >
                        ⛔ ร้านปิดให้บริการ (สั่งซื้อไม่ได้)
                      </span>
                    ) : (
                      <span
                        style={{
                          backgroundColor: "#16a34a",
                          color: "white",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                        }}
                      >
                        🟢 ร้านเปิดให้บริการ
                      </span>
                    )}
                  </div>

                  {/* สินค้าในร้านนั้น */}
                  {group.items.map((item) => {
                    const isChecked = selectedDetailIds.includes(item.ORDER_DETAIL_ID);
                    return (
                      <div
                        key={item.ORDER_DETAIL_ID}
                        style={{
                          padding: "1rem",
                          display: "flex",
                          gap: "1rem",
                          borderBottom: "1px solid #f1f5f9",
                          alignItems: "center",
                          backgroundColor: isChecked && !isClosed ? "#f0f9ff" : "transparent",
                          transition: "background-color 0.2s ease",
                        }}
                      >
                        {/* Checkbox เลือกสินค้ารายชิ้น */}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isClosed}
                          onChange={() => toggleItemSelection(item.ORDER_DETAIL_ID, !isClosed)}
                          style={{
                            width: "20px",
                            height: "20px",
                            accentColor: "#2563eb",
                            cursor: isClosed ? "not-allowed" : "pointer",
                            flexShrink: 0,
                          }}
                          title={isClosed ? "ร้านนี้ปิดให้บริการชั่วคราว" : "เลือกสินค้านี้เพื่อสั่งซื้อ"}
                        />

                        <img
                          src={item.IMAGE_URL || `https://placehold.co/100x100`}
                          alt={item.PRODUCT_NAME}
                          style={{
                            width: "80px",
                            height: "80px",
                            objectFit: "cover",
                            borderRadius: "6px",
                            filter: isClosed ? "grayscale(40%)" : "none",
                            flexShrink: 0,
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
                                backgroundColor: "#fff",
                              }}
                            >
                              <button
                                onClick={() =>
                                  handleUpdateQty(
                                    item.ORDER_DETAIL_ID,
                                    item.QUANTITY,
                                    -1
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
                                style={{
                                  padding: "0 0.8rem",
                                  fontSize: "0.9rem",
                                }}
                              >
                                {item.QUANTITY}
                              </span>
                              <button
                                onClick={() =>
                                  handleUpdateQty(
                                    item.ORDER_DETAIL_ID,
                                    item.QUANTITY,
                                    1
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
                                  -item.QUANTITY
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
                    );
                  })}

                  <div
                    style={{
                      padding: "0.75rem 1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: isClosed ? "#fef2f2" : "#fcfcfc",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>
                      เลือก {storeSelectedItems.length} / {group.items.length} รายการ
                    </span>
                    <span>
                      รวมร้านนี้ (เฉพาะที่เลือก):{" "}
                      <strong style={{ color: isClosed ? "#991b1b" : "#059669", fontSize: "1rem" }}>
                        ฿{storeSelectedTotal.toLocaleString()}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: "1.5rem",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              height: "fit-content",
            }}
          >
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.75rem" }}>
              สรุปยอดคำสั่งซื้อ
            </h3>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
                color: "#64748b",
                fontSize: "0.95rem",
              }}
            >
              <span>สินค้าที่เลือก:</span>
              <strong style={{ color: "#1e293b" }}>{selectedCount} ชิ้น</strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1.25rem",
                marginBottom: "1.5rem",
                borderTop: "1px dashed #e2e8f0",
                paddingTop: "0.75rem",
              }}
            >
              <span>ยอดสุทธิรวม:</span>
              <strong style={{ color: "#059669" }}>
                ฿{selectedGrandTotal.toLocaleString()}
              </strong>
            </div>

            {hasClosedStoreInCart && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fca5a5",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  fontSize: "0.8rem",
                  color: "#991b1b",
                  marginBottom: "1rem",
                  lineHeight: "1.4",
                }}
              >
                ℹ️ มีสินค้าจากร้านที่ปิดให้บริการอยู่ในตะกร้า สินค้าเหล่านั้นจะไม่สามารถเลือกสั่งซื้อได้ชั่วคราว (คุณยังคงสั่งซื้อสินค้าจากร้านอื่นที่เปิดได้ตามปกติ)
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={selectedCount === 0}
              style={{
                width: "100%",
                padding: "0.85rem",
                backgroundColor: selectedCount === 0 ? "#cbd5e1" : "#059669",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: selectedCount === 0 ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
                boxShadow: selectedCount > 0 ? "0 2px 4px rgba(5, 150, 105, 0.2)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              {selectedCount === 0
                ? "กรุณาเลือกสินค้าที่ต้องการสั่งซื้อ"
                : `💳 สั่งซื้อสินค้าที่เลือก (${selectedCount} ชิ้น)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Market;
