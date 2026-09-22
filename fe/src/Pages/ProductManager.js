import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { usePopup } from "../context/PopupContext";

function ProductManager() {
  const { showAlert, showConfirm } = usePopup();

  const { stId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // สเตทสำหรับ Modal เพิ่ม / แก้ไขสินค้า
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  // สเตทสำหรับ Modal แก้ไขข้อมูลร้านค้า (ST_NAME, LOCATION)
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeForm, setStoreForm] = useState({ stName: "", addressId: "" });
  const [userAddresses, setUserAddresses] = useState([]);

  const [form, setForm] = useState({
    productName: "",
    type: "เครื่องดื่ม",
    price: "",
    stock: "",
    imageUrl: "",
    description: "",
    weight: "",
    width: "",
    length: "",
    height: "",
  });

  // โหลดข้อมูลร้านค้าและตรวจสอบสิทธิ์
  const fetchStoreAndProducts = useCallback(async (loggedInUser) => {
    try {
      // 1. ดึงข้อมูลร้านค้า
      const storeRes = await fetch(`http://localhost:5000/api/stores/${stId}`);
      if (!storeRes.ok) {
        setErrorMsg("ไม่พบร้านค้านี้ในระบบ");
        setLoading(false);
        return;
      }
      const storeData = await storeRes.json();
      setStore(storeData);

      // 2. ตรวจสอบสิทธิ์ (ต้องเป็นเจ้าของร้าน หรือ Admin)
      const isOwner = storeData.AC_ID === loggedInUser.AC_ID;
      const isAdmin = loggedInUser.TYPE === "Admin";

      if (!isOwner && !isAdmin) {
        setErrorMsg("⛔ คุณไม่มีสิทธิ์จัดการสินค้าในร้านนี้ (เฉพาะเจ้าของร้านหรือ Admin เท่านั้น)");
        setLoading(false);
        return;
      }

      // 3. ดึงสินค้าในร้าน
      const prodRes = await fetch(`http://localhost:5000/api/stores/${stId}/products`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
    } catch (err) {
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }, [stId]);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser) {
      navigate("/login");
      return;
    }
    setUser(loggedInUser);
    fetchStoreAndProducts(loggedInUser);
  }, [navigate, fetchStoreAndProducts]);

  // เปิด Modal แก้ไขร้านค้า
  const handleOpenEditStore = async () => {
    if (!store) return;
    setStoreForm({
      stName: store.ST_NAME || "",
      addressId: store.ADDRESS_ID || "",
    });
    setIsStoreModalOpen(true);
    try {
      const res = await fetch(`http://localhost:5000/api/address/${user.AC_ID}`);
      const data = await res.json();
      setUserAddresses(data);
    } catch (e) { }
  };

  // บันทึกแก้ไขข้อมูลร้านค้า
  const handleSubmitStore = async (e) => {
    e.preventDefault();
    if (!storeForm.stName.trim() || !storeForm.addressId) {
      showAlert("กรุณากรอกชื่อร้านและเลือกสถานที่ตั้งให้ครบถ้วน");
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/stores/${stId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stName: storeForm.stName,
          addressId: storeForm.addressId,
          acId: user.AC_ID,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(data.message);
        setStore((prev) => ({
          ...prev,
          ST_NAME: storeForm.stName,
          ADDRESS_ID: storeForm.addressId,
        }));
        setIsStoreModalOpen(false);
      } else {
        showAlert(data.error || "แก้ไขข้อมูลร้านไม่สำเร็จ");
      }
    } catch (err) {
      showAlert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  // เปิด Modal เพื่อเพิ่มสินค้าใหม่
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setSelectedProductId(null);
    setForm({
      productName: "",
      type: "เครื่องดื่ม",
      price: "",
      stock: "",
      imageUrl: "",
      description: "",
      weight: "",
      width: "",
      length: "",
      height: "",
    });
    setIsModalOpen(true);
  };

  // เปิด Modal เพื่อแก้ไขสินค้า
  const handleOpenEditModal = (item) => {
    setIsEditing(true);
    setSelectedProductId(item.PRODUCT_ID);
    setForm({
      productName: item.PRODUCT_NAME || "",
      type: item.TYPE || "ทั่วไป",
      price: item.PRODUCT_PRICE || "",
      stock: item.STOCK || "",
      imageUrl: item.IMAGE_URL || "",
      description: item.DESCRIPTION || "",
      weight: item.WEIGHT || "",
      width: item.WIDTH || "",
      length: item.LENGTH || "",
      height: item.HEIGHT || "",
    });
    setIsModalOpen(true);
  };

  // บันทึกข้อมูลสินค้า (เพิ่ม / แก้ไข)
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      const url = isEditing
        ? `http://localhost:5000/api/products/${selectedProductId}`
        : `http://localhost:5000/api/products`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          stId,
          acId: user.AC_ID,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showAlert(data.message);
        setIsModalOpen(false);
        fetchStoreAndProducts(user);
      } else {
        showAlert(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูลสินค้า");
      }
    } catch (err) {
      showAlert("เซิร์ฟเวอร์ไม่ตอบสนอง");
    }
  };

  // ลบสินค้า
  const handleDeleteProduct = async (productId, productName) => {
    if (!await showConfirm(`คุณแน่ใจว่าต้องการลบสินค้า "${productName}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acId: user.AC_ID }),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(data.message);
        fetchStoreAndProducts(user);
      } else {
        showAlert(data.error || "ลบสินค้าไม่สำเร็จ");
      }
    } catch (err) {
      showAlert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center" }}>กำลังตรวจสอบสิทธิ์และโหลดข้อมูลสินค้า... ⏳</div>;
  }

  if (errorMsg) {
    return (
      <div style={{ padding: "3rem", maxWidth: "600px", margin: "2rem auto", textAlign: "center" }}>
        <div style={{ padding: "1.5rem", backgroundColor: "#fee2e2", border: "1px solid #f87171", borderRadius: "12px", color: "#991b1b" }}>
          <h3>{errorMsg}</h3>
          <Link to="/profile" style={{ display: "inline-block", marginTop: "1rem", color: "#2563eb", textDecoration: "underline" }}>
            ← กลับสู่หน้าโปรไฟล์
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto", color: "#1e293b" }}>

      {/* ส่วนหัวแสดงข้อมูลร้านค้า */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <Link to="/profile" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.9rem" }}>
            ← กลับหน้าจัดการโปรไฟล์
          </Link>
          <h1 style={{ margin: "0.5rem 0 0 0", fontSize: "1.6rem" }}>
            📦 จัดการสินค้า: {store?.ST_NAME} <span style={{ fontSize: "1rem", color: "#64748b" }}>#{store?.ST_ID}</span>
          </h1>
          <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.85rem" }}>
            📍 ที่ตั้งร้าน: {store?.ADDRESS_LINE ? `${store.ADDRESS_LINE} ${store.SUB_DISTRICT || ""} ${store.DISTRICT || ""} ${store.PROVINCE || ""} ${store.ZIP_CODE || ""}`.trim() : (store?.LOCATION || (store?.ADDRESS_ID ? `รหัสที่อยู่ #${store.ADDRESS_ID}` : "ไม่ระบุที่อยู่"))} • สถานะร้าน:{" "}
            <strong style={{ color: store?.IS_OPEN === "Y" ? "#16a34a" : "#dc2626" }}>
              {store?.IS_OPEN === "Y" ? "🟢 เปิดให้บริการ" : "🔴 ปิดให้บริการ"}
            </strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleOpenEditStore}
            style={{
              padding: "0.65rem 1rem",
              backgroundColor: "#f1f5f9",
              color: "#1e293b",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            ✏️ แก้ไขชื่อ/ที่ตั้งร้าน
          </button>
          <button
            onClick={handleOpenAddModal}
            style={{
              padding: "0.65rem 1.25rem",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
            }}
          >
            ➕ เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      {/* รายการสินค้าทั้งหมดในร้าน */}
      {products.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
          <p style={{ color: "#64748b", fontSize: "1.1rem" }}>ร้านนี้ยังไม่มีสินค้าวางจำหน่าย</p>
          <button
            onClick={handleOpenAddModal}
            style={{ padding: "0.5rem 1.2rem", backgroundColor: "#059669", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
          >
            เพิ่มสินค้าชิ้นแรกเลย!
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1.5rem" }}>
          {products.map((item) => (
            <div
              key={item.PRODUCT_ID}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                position: "relative"
              }}
            >
              <img
                src={item.IMAGE_URL || `https://placehold.co/300x180?text=${encodeURIComponent(item.PRODUCT_NAME)}`}
                alt={item.PRODUCT_NAME}
                style={{ width: "100%", height: "160px", objectFit: "cover" }}
              />

              <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "#64748b" }}>
                  <span>หมวด: {item.TYPE}</span>
                  <span style={{ fontWeight: "bold", color: item.STOCK <= 0 ? "#dc2626" : "#059669" }}>
                    คงเหลือ: {item.STOCK} ชิ้น
                  </span>
                </div>

                <h3 style={{ margin: "0.5rem 0", fontSize: "1.1rem" }}>{item.PRODUCT_NAME}</h3>

                <p style={{ margin: "0 0 0.5rem 0", color: "#64748b", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {item.DESCRIPTION || "ไม่มีคำอธิบาย"}
                </p>

                <div style={{ marginTop: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "0.5rem", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#059669" }}>
                      ฿{item.PRODUCT_PRICE ? item.PRODUCT_PRICE.toLocaleString() : 0}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      style={{
                        flex: 1,
                        padding: "0.45rem",
                        backgroundColor: "#f1f5f9",
                        color: "#1e293b",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "0.85rem"
                      }}
                    >
                      ✏️ แก้ไข
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(item.PRODUCT_ID, item.PRODUCT_NAME)}
                      style={{
                        padding: "0.45rem 0.8rem",
                        backgroundColor: "#fee2e2",
                        color: "#b91c1c",
                        border: "1px solid #fca5a5",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "0.85rem"
                      }}
                    >
                      🗑️ ลบ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal เพิ่ม/แก้ไขสินค้า */}
      {isModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            padding: "2rem",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "560px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)"
          }}>
            <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.3rem" }}>
              {isEditing ? "✏️ แก้ไขข้อมูลสินค้า" : "➕ เพิ่มสินค้าใหม่ในร้าน"}
            </h2>

            <form onSubmit={handleSubmitProduct} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>ชื่อสินค้า (PRODUCT_NAME) *:</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ชานมไข่มุกพรีเมียม"
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  style={{ width: "100%", padding: "0.55rem", marginTop: "0.2rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>หมวดหมู่ (TYPE):</label>
                  <input
                    type="text"
                    placeholder="เช่น อาหาร, เครื่องดื่ม, เสื้อผ้า"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem", marginTop: "0.2rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>ราคา (บาท) *:</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="เช่น 55"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem", marginTop: "0.2rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>สต็อก (STOCK) *:</label>
                  <input
                    type="number"
                    required
                    placeholder="เช่น 20"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem", marginTop: "0.2rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>น้ำหนัก (WEIGHT):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="kg"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem", marginTop: "0.2rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>กว้าง (ซม.):</label>
                  <input type="number" step="0.01" placeholder="cm" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} style={{ width: "100%", padding: "0.55rem", marginTop: "0.2rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>ยาว (ซม.):</label>
                  <input type="number" step="0.01" placeholder="cm" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} style={{ width: "100%", padding: "0.55rem", marginTop: "0.2rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>สูง (ซม.):</label>
                  <input type="number" step="0.01" placeholder="cm" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} style={{ width: "100%", padding: "0.55rem", marginTop: "0.2rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>ลิงก์รูปภาพ (IMAGE_URL):</label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  style={{ width: "100%", padding: "0.55rem", marginTop: "0.2rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>รายละเอียดสินค้า (DESCRIPTION):</label>
                <textarea
                  rows="3"
                  placeholder="อธิบายจุดเด่น ส่วนผสม หรือรายละเอียดของสินค้า..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: "100%", padding: "0.55rem", marginTop: "0.2rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "0.6rem 1.2rem", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer" }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  style={{ padding: "0.6rem 1.5rem", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                >
                  {isEditing ? "💾 บันทึกการแก้ไข" : "➕ เพิ่มสินค้า"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* Modal: แก้ไขข้อมูลร้านค้า (ST_NAME, LOCATION) */}
      {/* ==================================================== */}
      {isStoreModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            padding: "2rem",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "460px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)"
          }}>
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem" }}>✏️ แก้ไขข้อมูลร้านค้า #{stId}</h3>
            <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 1.25rem 0" }}>
              แก้ไขชื่อร้านค้าและสถานที่ตั้งสำหรับร้านนี้
            </p>

            <form onSubmit={handleSubmitStore} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", color: "#334155" }}>
                  ชื่อร้านค้า (ST_NAME):
                </label>
                <input
                  type="text"
                  required
                  value={storeForm.stName}
                  onChange={(e) => setStoreForm({ ...storeForm, stName: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", marginTop: "0.3rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", color: "#334155" }}>
                  สถานที่ตั้ง (ที่อยู่):
                </label>
                <select
                  required
                  value={storeForm.addressId}
                  onChange={(e) => setStoreForm({ ...storeForm, addressId: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", marginTop: "0.3rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                >
                  <option value="" disabled>เลือกที่อยู่ของร้านค้า</option>
                  {userAddresses.map(addr => (
                    <option key={addr.ADDRESS_ID} value={addr.ADDRESS_ID}>
                      {addr.ADDRESS_LINE} {addr.SUB_DISTRICT} {addr.DISTRICT} {addr.PROVINCE} {addr.ZIP_CODE}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>* หากต้องการเพิ่มที่อยู่ใหม่ ให้ไปที่หน้าจัดการโปรไฟล์</p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setIsStoreModalOpen(false)}
                  style={{ padding: "0.5rem 1rem", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer" }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  style={{ padding: "0.5rem 1.4rem", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                >
                  💾 บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default ProductManager;

