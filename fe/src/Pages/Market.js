import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePopup } from "../context/PopupContext";

function Market() {
  const { showAlert, showConfirm } = usePopup();

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [groupedCart, setGroupedCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDetailIds, setSelectedDetailIds] = useState([]);
  const [isSelectionInitialized, setIsSelectionInitialized] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [destAddressId, setDestAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [activeOrders, setActiveOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [shippingProviders, setShippingProviders] = useState({});
  const [shippingTypes, setShippingTypes] = useState({});
  const [shippingConfigTypes, setShippingConfigTypes] = useState([]);
  const [shippingCosts, setShippingCosts] = useState({
    orderShippingCosts: {},
    totalShipping: 0,
  });
  const [shippingServices, setShippingServices] = useState({});

  // ฟังก์ชันดึงข้อมูลตะกร้าจาก DB (รวม IS_OPEN ของร้านค้า)
  const fetchCartData = useCallback(
    (acId) => {
      fetch(`http://localhost:5000/api/cart/${acId}`)
        .then((res) => res.json())
        .then((data) => {
          const groups = data.reduce((acc, item) => {
            if (!acc[item.ORDER_ID]) {
              acc[item.ORDER_ID] = {
                storeName: item.ST_NAME,
                stId: item.ST_ID,
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

          // Fetch shipping services for each store
          Object.keys(groups).forEach((orderId) => {
            const stId = groups[orderId].items[0].ST_ID;
            fetch(`http://localhost:5000/api/stores/${stId}/services`)
              .then((res) => res.json())
              .then((services) => {
                setShippingServices((prev) => ({
                  ...prev,
                  [orderId]: services,
                }));
                setShippingTypes((prev) => ({ ...prev, [orderId]: 1 }));
                if (services.length > 0) {
                  setShippingProviders((prev) => ({
                    ...prev,
                    [orderId]: services[0].DVSERVICE_ID,
                  }));
                }
              })
              .catch(console.error);
          });

          const openItemIds = data
            .filter((item) => item.IS_OPEN !== "N" && (item.STOCK ?? 1) > 0)
            .map((item) => item.ORDER_DETAIL_ID);

          setSelectedDetailIds((prev) => {
            if (!isSelectionInitialized) {
              return openItemIds;
            }
            // กรองเอาเฉพาะรายการที่เคยเลือกไว้ ยังอยู่ในร้านที่เปิด และยังมีสต็อก
            return prev.filter((id) => openItemIds.includes(id));
          });
          setIsSelectionInitialized(true);
          setLoading(false);
        })
        .catch(console.error);
    },
    [isSelectionInitialized],
  );

  const fetchActiveOrders = useCallback((acId) => {
    fetch(`http://localhost:5000/api/orders?acId=${acId}`)
      .then((res) => res.json())
      .then((data) => setActiveOrders(data))
      .catch((err) => console.error("Error fetching orders:", err));
  }, []);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser) {
      navigate("/login");
      return;
    }
    setUser(loggedInUser);
    fetchCartData(loggedInUser.AC_ID);
    fetchActiveOrders(loggedInUser.AC_ID);

    fetch("http://localhost:5000/api/shipping/config-prices")
      .then((res) => res.json())
      .then((data) => setShippingConfigTypes(data.dvServiceTypes))
      .catch(console.error);

    fetch(`http://localhost:5000/api/address/${loggedInUser.AC_ID}?type=HOME`)
      .then((res) => res.json())
      .then((data) => {
        setAddresses(data);
        const def = data.find((a) => a.IS_DEFAULT === "Y");
        if (def) setDestAddressId(def.ADDRESS_ID);
        else if (data.length > 0) setDestAddressId(data[0].ADDRESS_ID);
      })
      .catch(console.error);
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      if (Math.floor(Date.now() / 1000) % 3 === 0) {
        fetchActiveOrders(loggedInUser.AC_ID);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [navigate, fetchCartData, fetchActiveOrders]);

  // ดึงค่าจัดส่งทุกครั้งที่มีการเปลี่ยนการติ๊กสินค้า เปลี่ยนที่อยู่ หรือเปลี่ยนขนส่ง
  useEffect(() => {
    if (selectedDetailIds.length === 0 || !destAddressId) {
      setShippingCosts({ orderShippingCosts: {}, totalShipping: 0 });
      return;
    }
    fetch("http://localhost:5000/api/cart/calculate-shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedDetailIds,
        destAddressId,
        shippingProviders,
        shippingTypes,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.orderShippingCosts) {
          setShippingCosts(data);
        }
      })
      .catch(console.error);
  }, [selectedDetailIds, destAddressId, shippingProviders, shippingTypes]);

  // ฟังก์ชันจัดการเพิ่มลดจำนวนและลบ
  const handleUpdateQty = async (orderDetailId, currentQty, change) => {
    const newQty = currentQty + change;

    // ถ้ายอดกลายเป็น 0 ให้ขึ้นแจ้งเตือนก่อนลบ
    if (newQty <= 0) {
      if (!await showConfirm("ต้องการลบสินค้านี้ออกจากตะกร้าใช่หรือไม่?")) return;
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
      showAlert("เกิดข้อผิดพลาดในการอัปเดตตะกร้า");
    }
  };

  // ดึงสินค้าทั้งหมดที่มาจากร้านที่เปิดให้บริการ และยังมีสต็อก
  const allOpenItems = Object.values(groupedCart)
    .filter((group) => group.isOpen !== "N")
    .flatMap((group) => group.items)
    .filter((item) => (item.STOCK ?? 1) > 0);

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

  // ฟังก์ชันเลือก / ยกเลิกเลือกทั้งร้าน (เฉพาะชิ้นที่มีสต็อก)
  const toggleStoreSelection = (group) => {
    if (group.isOpen === "N") return;
    const storeItemIds = group.items
      .filter((it) => (it.STOCK ?? 1) > 0)
      .map((it) => it.ORDER_DETAIL_ID);
    if (storeItemIds.length === 0) return;

    const isStoreAllSelected = storeItemIds.every((id) =>
      selectedDetailIds.includes(id),
    );

    if (isStoreAllSelected) {
      setSelectedDetailIds((prev) =>
        prev.filter((id) => !storeItemIds.includes(id)),
      );
    } else {
      setSelectedDetailIds((prev) => {
        const set = new Set([...prev, ...storeItemIds]);
        return Array.from(set);
      });
    }
  };

  // ฟังก์ชันเลือก / ยกเลิกเลือกแต่ละชิ้น
  const toggleItemSelection = (orderDetailId, isSelectable) => {
    if (!isSelectable) return;
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
    0,
  );

  // ตรวจสอบว่ามีร้านค้าไหนในตะกร้าปิดอยู่หรือไม่
  const hasClosedStoreInCart = Object.values(groupedCart).some(
    (group) => group.isOpen === "N",
  );

  const handleCheckout = async () => {
    if (selectedDetailIds.length === 0) {
      showAlert("กรุณาเลือกสินค้าอย่างน้อย 1 ชิ้นที่ต้องการสั่งซื้อ");
      return;
    }
    if (!destAddressId) {
      showAlert("กรุณาเลือกที่อยู่จัดส่ง");
      return;
    }

    // ป้องกันกรณีที่มีสินค้าที่เลือกร้านปิดอยู่
    const hasSelectedClosed = selectedItems.some(
      (item) => item.IS_OPEN === "N",
    );
    if (hasSelectedClosed) {
      showAlert(
        "⚠️ ไม่สามารถสั่งซื้อได้: มีสินค้าจากร้านค้าที่ปิดให้บริการอยู่ในรายการที่เลือก",
      );
      return;
    }

    // ป้องกันกรณีที่มีสินค้าหมดสต็อกหรือสั่งซื้อเกินจำนวนสต็อก
    const outOfStockSelected = selectedItems.filter(
      (item) => (item.STOCK ?? 1) <= 0 || item.QUANTITY > item.STOCK,
    );
    if (outOfStockSelected.length > 0) {
      const names = outOfStockSelected.map((it) => it.PRODUCT_NAME).join(", ");
      showAlert(
        `⚠️ ไม่สามารถสั่งซื้อได้: มีสินค้าหมดสต็อกหรือจำนวนเกินสต็อกในรายการที่เลือก (${names}) กรุณาตรวจสอบและปรับลดจำนวนก่อนสั่งซื้อ`,
      );
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedDetailIds,
          destAddressId,
          paymentMethod,
          shippingProviders,
          shippingTypes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(
          data.message || "สั่งซื้อสำเร็จ! สถานะถูกเปลี่ยนเป็น 'รอจัดส่ง' แล้ว",
        );
        setSelectedDetailIds([]);
        fetchCartData(user.AC_ID);
        fetchActiveOrders(user.AC_ID);
        // navigate("/profile");
      } else {
        showAlert(data.error || "เกิดข้อผิดพลาดในการสั่งซื้อ");
      }
    } catch (err) {
      showAlert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);

  const handleReceive = (orderId) => {
    setReviewOrderId(orderId);
    setReviewRating(5);
    setReviewModalOpen(true);
  };

  const submitReview = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${reviewOrderId}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating }),
      });
      if (res.ok) {
        showAlert("ขอบคุณสำหรับการรีวิว!");
        setReviewModalOpen(false);
        fetchActiveOrders(user.AC_ID);
      } else {
        showAlert("เกิดข้อผิดพลาด");
      }
    } catch (err) {
      showAlert("Error: " + err.message);
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
      <h1>🛒 การสั่งซื้อ</h1>
      {Object.keys(groupedCart).length === 0 ? (
        <div
          style={{ textAlign: "center", padding: "3rem 0", color: "#64748b" }}
        >
          <p>ไม่มีสินค้าในตะกร้า</p>
          <button
            onClick={() => navigate("/")}
            style={{ padding: "0.5rem 1rem", cursor: "pointer", marginTop: "1rem" }}
          >
            เริ่มช้อปเลย!
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
                    cursor:
                      allOpenItemIds.length > 0 ? "pointer" : "not-allowed",
                  }}
                />
                <span>
                  เลือกสินค้าทั้งหมด ({selectedCount} / {allOpenItemIds.length}{" "}
                  รายการที่สั่งซื้อได้)
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
                selectedDetailIds.includes(it.ORDER_DETAIL_ID),
              );
              const storeSelectedTotal = storeSelectedItems.reduce(
                (sum, it) => sum + it.QUANTITY * it.UNIT_PRICE,
                0,
              );

              return (
                <div
                  key={orderId}
                  style={{
                    border: isClosed
                      ? "2px solid #ef4444"
                      : "1px solid #e2e8f0",
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
                      borderBottom: isClosed
                        ? "1px solid #fca5a5"
                        : "1px solid #e2e8f0",
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
                        🏪 ร้าน:{" "}
                        {group.stId ? (
                          <Link
                            to={`/store/${group.stId}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              color: "#2563eb",
                              textDecoration: "underline",
                            }}
                          >
                            {group.storeName}
                          </Link>
                        ) : (
                          group.storeName
                        )}{" "}
                        (บิล #{orderId})
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

                  {!isClosed &&
                    shippingServices[orderId] &&
                    shippingServices[orderId].length > 0 && (
                      <div
                        style={{
                          padding: "0.6rem 1rem",
                          borderBottom: "1px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        {/* แถวที่ 1: เลือกช่องทางจัดส่ง */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <label
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: "bold",
                              color: "#334155",
                              minWidth: "120px",
                            }}
                          >
                            🚚 ช่องทางจัดส่ง:
                          </label>
                          <select
                            value={shippingProviders[orderId] || ""}
                            onChange={(e) =>
                              setShippingProviders((prev) => ({
                                ...prev,
                                [orderId]: e.target.value,
                              }))
                            }
                            style={{
                              padding: "0.3rem 0.5rem",
                              borderRadius: "4px",
                              border: "1px solid #cbd5e1",
                              fontSize: "0.85rem",
                              backgroundColor: "#ffffff",
                            }}
                          >
                            {shippingServices[orderId]?.map((service) => (
                              <option
                                key={service.DVSERVICE_ID}
                                value={service.DVSERVICE_ID}
                              >
                                {service.DVSERVICE_NAME}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* แถวที่ 2: รูปแบบจัดส่ง */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <label
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: "bold",
                              color: "#334155",
                              minWidth: "120px",
                            }}
                          >
                            📦 รูปแบบจัดส่ง:
                          </label>
                          <select
                            value={shippingTypes[orderId] || 1}
                            onChange={(e) =>
                              setShippingTypes((prev) => ({
                                ...prev,
                                [orderId]: e.target.value,
                              }))
                            }
                            style={{
                              padding: "0.3rem 0.5rem",
                              borderRadius: "4px",
                              border: "1px solid #cbd5e1",
                              fontSize: "0.85rem",
                              backgroundColor: "#ffffff",
                            }}
                          >
                            {shippingConfigTypes.map((type) => (
                              <option
                                key={type.DVSERVICE_TYPE_ID}
                                value={type.DVSERVICE_TYPE_ID}
                              >
                                {type.TYPE_NAME}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                  {/* สินค้าในร้านนั้น */}
                  {group.items.map((item) => {
                    const isOutOfStock = (item.STOCK ?? 1) <= 0;
                    const isExceedStock = !isOutOfStock && item.QUANTITY > item.STOCK;
                    const isSelectable = !isClosed && !isOutOfStock;
                    const isChecked = selectedDetailIds.includes(
                      item.ORDER_DETAIL_ID,
                    );
                    return (
                      <div
                        key={item.ORDER_DETAIL_ID}
                        style={{
                          padding: "1rem",
                          display: "flex",
                          gap: "1rem",
                          borderBottom: "1px solid #f1f5f9",
                          alignItems: "center",
                          backgroundColor: isOutOfStock
                            ? "#fafafa"
                            : isChecked && !isClosed
                              ? "#f0f9ff"
                              : "transparent",
                          opacity: isOutOfStock ? 0.75 : 1,
                          transition: "background-color 0.2s ease",
                        }}
                      >
                        {/* Checkbox เลือกสินค้ารายชิ้น */}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!isSelectable}
                          onChange={() =>
                            toggleItemSelection(item.ORDER_DETAIL_ID, isSelectable)
                          }
                          style={{
                            width: "20px",
                            height: "20px",
                            accentColor: "#2563eb",
                            cursor: !isSelectable ? "not-allowed" : "pointer",
                            flexShrink: 0,
                          }}
                          title={
                            isClosed
                              ? "ร้านนี้ปิดให้บริการชั่วคราว"
                              : isOutOfStock
                                ? "สินค้าหมดสต็อก ไม่สามารถสั่งซื้อได้"
                                : "เลือกสินค้านี้เพื่อสั่งซื้อ"
                          }
                        />

                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <img
                            src={item.IMAGE_URL || `https://placehold.co/100x100`}
                            alt={item.PRODUCT_NAME}
                            style={{
                              width: "80px",
                              height: "80px",
                              objectFit: "cover",
                              borderRadius: "6px",
                              filter: isClosed || isOutOfStock ? "grayscale(80%)" : "none",
                              display: "block",
                            }}
                          />
                          {isOutOfStock && (
                            <div
                              style={{
                                position: "absolute",
                                top: 4,
                                left: 4,
                                right: 4,
                                backgroundColor: "rgba(220, 38, 38, 0.9)",
                                color: "white",
                                fontSize: "0.65rem",
                                fontWeight: "bold",
                                textAlign: "center",
                                borderRadius: "4px",
                                padding: "2px 0",
                              }}
                            >
                              หมดสต็อก
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <h4 style={{ margin: "0 0 0.25rem 0", color: isOutOfStock ? "#64748b" : "#1e293b" }}>
                              {item.PRODUCT_NAME}
                            </h4>
                            {isOutOfStock && (
                              <span
                                style={{
                                  backgroundColor: "#fee2e2",
                                  color: "#dc2626",
                                  border: "1px solid #fca5a5",
                                  padding: "0.1rem 0.45rem",
                                  borderRadius: "4px",
                                  fontSize: "0.72rem",
                                  fontWeight: "bold",
                                }}
                              >
                                🚫 สินค้าหมดสต็อก (Out of Stock)
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0 0 0.5rem 0", flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontSize: "0.9rem",
                                color: isOutOfStock ? "#94a3b8" : "#059669",
                                fontWeight: "bold",
                              }}
                            >
                              ฿{item.UNIT_PRICE.toLocaleString()}
                            </span>
                            <span style={{ fontSize: "0.8rem", color: isOutOfStock ? "#dc2626" : "#64748b" }}>
                              (คงเหลือในสต็อก: {item.STOCK ?? 0} ชิ้น)
                            </span>
                          </div>

                          {isExceedStock && (
                            <div
                              style={{
                                fontSize: "0.78rem",
                                color: "#b45309",
                                backgroundColor: "#fef3c7",
                                border: "1px solid #fde68a",
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                marginBottom: "0.5rem",
                                display: "inline-block",
                              }}
                            >
                              ⚠️ สินค้าในสต็อกเหลือเพียง {item.STOCK} ชิ้น กรุณาปรับลดจำนวน
                            </div>
                          )}

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
                                border: "2px solid #cbd5e0",
                                borderRadius: "4px",
                                backgroundColor: "#fff",
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
                                style={{
                                  padding: "0 0.8rem",
                                  fontSize: "0.9rem",
                                }}
                              >
                                {item.QUANTITY}
                              </span>
                              <button
                                disabled={isOutOfStock || item.QUANTITY >= item.STOCK}
                                onClick={() =>
                                  handleUpdateQty(
                                    item.ORDER_DETAIL_ID,
                                    item.QUANTITY,
                                    1,
                                  )
                                }
                                style={{
                                  padding: "0.2rem 0.6rem",
                                  background: (isOutOfStock || item.QUANTITY >= item.STOCK) ? "#e2e8f0" : "#f8fafc",
                                  border: "none",
                                  cursor: (isOutOfStock || item.QUANTITY >= item.STOCK) ? "not-allowed" : "pointer",
                                  color: (isOutOfStock || item.QUANTITY >= item.STOCK) ? "#94a3b8" : "inherit",
                                }}
                                title={(item.QUANTITY >= item.STOCK) ? "ไม่สามารถเพิ่มได้เกินสต็อกที่มีอยู่" : ""}
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
                              title="ลบออกจากตะกร้า"
                            >
                              🗑️ ลบทิ้ง
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
                      เลือก {storeSelectedItems.length} / {group.items.length}{" "}
                      รายการ
                    </span>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "0.2rem",
                      }}
                    >
                      <span>
                        ยอดรวมสินค้า:{" "}
                        <strong
                          style={{
                            color: isClosed ? "#991b1b" : "#059669",
                            fontSize: "1rem",
                          }}
                        >
                          ฿{storeSelectedTotal.toLocaleString()}
                        </strong>
                      </span>
                      <span>
                        ค่าจัดส่ง:{" "}
                        <strong
                          style={{
                            color: isClosed ? "#991b1b" : "#2563eb",
                            fontSize: "1rem",
                          }}
                        >
                          ฿
                          {shippingCosts.orderShippingCosts[orderId]
                            ? shippingCosts.orderShippingCosts[
                              orderId
                            ].toLocaleString()
                            : 0}
                        </strong>
                      </span>
                    </div>
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
            <h3
              style={{
                margin: "0 0 1rem 0",
                fontSize: "1.2rem",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "0.75rem",
              }}
            >
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
                marginBottom: "0.75rem",
                color: "#64748b",
                fontSize: "0.95rem",
              }}
            >
              <span>ยอดรวมสินค้า:</span>
              <strong style={{ color: "#1e293b" }}>
                ฿{selectedGrandTotal.toLocaleString()}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
                color: "#64748b",
                fontSize: "0.95rem",
              }}
            >
              <span>ค่าจัดส่งรวม:</span>
              <strong style={{ color: "#2563eb" }}>
                ฿{(shippingCosts.totalShipping || 0).toLocaleString()}
              </strong>
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
                ฿
                {(
                  selectedGrandTotal + (shippingCosts.totalShipping || 0)
                ).toLocaleString()}
              </strong>
            </div>

            <div style={{ marginBottom: "1rem", backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "0.4rem" }}>📍 เลือกที่อยู่จัดส่ง:</label>
                <select
                  value={destAddressId}
                  onChange={(e) => setDestAddressId(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                >
                  <option value="" disabled>-- กรุณาเลือกที่อยู่ --</option>
                  {addresses.map((a) => (
                    <option key={a.ADDRESS_ID} value={a.ADDRESS_ID}>
                      {a.ADDRESS_LINE} {a.SUB_DISTRICT} {a.DISTRICT} {a.PROVINCE} {a.ZIP_CODE}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "0.4rem" }}>💳 วิธีการชำระเงิน:</label>
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
                ℹ️ มีสินค้าจากร้านที่ปิดให้บริการอยู่ในตะกร้า
                สินค้าเหล่านั้นจะไม่สามารถเลือกสั่งซื้อได้ชั่วคราว
                (คุณยังคงสั่งซื้อสินค้าจากร้านอื่นที่เปิดได้ตามปกติ)
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
                boxShadow:
                  selectedCount > 0
                    ? "0 2px 4px rgba(5, 150, 105, 0.2)"
                    : "none",
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

      <hr style={{ margin: '3rem 0', borderColor: '#e2e8f0' }} />
      <h2>📦 สถานะการจัดส่ง</h2>

      {activeOrders.filter(o => o.STATUS === 'Pending' || o.STATUS === 'Delivered').length === 0 ? (
        <p style={{ color: '#64748b' }}>ไม่มีรายการจัดส่ง</p>
      ) : (
        activeOrders.filter(o => o.STATUS === 'Pending' || o.STATUS === 'Delivered').map((order) => {
          const isDelivered = order.STATUS === 'Delivered';
          const orderDate = order.ORDER_DATE ? new Date(order.ORDER_DATE).getTime() : 0;
          const deliveryDate = order.EST_DELIVERY_DATE ? new Date(order.EST_DELIVERY_DATE).getTime() : 0;
          const now = currentTime;

          let progress = 0;
          if (isDelivered || (deliveryDate > 0 && now >= deliveryDate)) {
            progress = 100;
          } else if (deliveryDate > orderDate && orderDate > 0) {
            progress = Math.min(100, Math.max(0, ((now - orderDate) / (deliveryDate - orderDate)) * 100));
          }

          return (
            <div key={order.ORDER_ID} style={{
              backgroundColor: isDelivered ? '#fef3c7' : '#fff',
              border: `1px solid ${isDelivered ? '#f59e0b' : '#e2e8f0'}`,
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>
                    ร้าน:{" "}
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
                    (บิล #{order.ORDER_ID})
                  </h3>
                  <small style={{ color: '#64748b' }}>
                    สั่งเมื่อ: {order.ORDER_DATE ? new Date(order.ORDER_DATE).toLocaleString() : 'เพิ่งสั่งซื้อ'}
                  </small>
                </div>
                <div>
                  <span style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    backgroundColor: isDelivered ? '#f59e0b' : '#3b82f6',
                    color: 'white'
                  }}>
                    {isDelivered ? 'พัสดุถึงแล้ว' : 'กำลังจัดส่ง'}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              {!isDelivered && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: '#64748b' }}>
                    <span>เตรียมจัดส่ง</span>
                    <span>คาดว่าจะถึง: {order.EST_DELIVERY_DATE ? new Date(order.EST_DELIVERY_DATE).toLocaleString() : 'กำลังจัดเตรียม...'}</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: '#3b82f6', width: `${progress}%`, transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>
              )}

              {/* Items */}
              <div style={{ marginBottom: '1rem' }}>
                {order.items.map(item => (
                  <div key={item.ORDER_DETAIL_ID} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <img src={item.IMAGE_URL} alt={item.PRODUCT_NAME} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    <span style={{ flex: 1 }}>{item.PRODUCT_NAME}</span>
                    <span style={{ color: '#64748b' }}>{item.QUANTITY} ชิ้น</span>
                  </div>
                ))}
              </div>

              {isDelivered && (
                <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', color: '#b45309', marginBottom: '0.5rem' }}>กรุณากดยืนยันเมื่อคุณได้รับสินค้าแล้ว</p>
                  <button
                    onClick={() => handleReceive(order.ORDER_ID)}
                    style={{
                      padding: '0.6rem 1.2rem',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ได้รับสินค้าแล้ว
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ marginTop: 0 }}>ให้คะแนนร้านค้า</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>กรุณาให้คะแนนความพึงพอใจ</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setReviewRating(star)}
                  style={{
                    fontSize: '2rem',
                    cursor: 'pointer',
                    color: star <= reviewRating ? '#f59e0b' : '#e2e8f0'
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setReviewModalOpen(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '6px', cursor: 'pointer' }}>ยกเลิก</button>
              <button onClick={submitReview} style={{ flex: 1, padding: '0.75rem', border: 'none', backgroundColor: '#059669', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Market;
