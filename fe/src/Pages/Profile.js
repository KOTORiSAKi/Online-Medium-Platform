import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";

function Profile() {
  const { showAlert, showConfirm } = usePopup();

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Address States
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({
    id: null,
    addressLine: "",
    subDistrict: "",
    district: "",
    province: "",
    zipCode: "",
    isDefault: "N",
  });
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // สเตทสำหรับโหมดแก้ไขข้อมูล
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    currentPassword: "",
    newUsername: "",
    newPassword: "",
    newEmail: "",
    newGender: "",
    newFname: "",
    newLname: "",
    newPhone: "",
  });

  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [shippingDelaySec, setShippingDelaySec] = useState(60);

  // สเตทสำหรับสลับบทบาท Customer <-> Seller
  const [switchRoleOpen, setSwitchRoleOpen] = useState(false);
  const [switchPassword, setSwitchPassword] = useState("");

  // สเตทสำหรับร้านค้า
  const [storeForm, setStoreForm] = useState({ stName: "", addressId: "" });
  const [stores, setStores] = useState([]);
  const [storeLoading, setStoreLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // สำหรับ Admin / Employee ค้นหาร้าน

  // สเตทสำหรับแก้ไขชื่อร้านและที่อยู่ร้าน
  const [editStoreModalOpen, setEditStoreModalOpen] = useState(false);
  const [storeEditForm, setStoreEditForm] = useState({
    stId: null,
    stName: "",
    addressId: "",
  });

  // สเตทสำหรับจัดการช่องทางขนส่งของร้านค้า
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [currentStoreForShipping, setCurrentStoreForShipping] = useState(null);
  const [storeShippingServices, setStoreShippingServices] = useState([]);
  const [shippingConfig, setShippingConfig] = useState(null);

  // ฟังก์ชันดึงข้อมูลบัญชีล่าสุดจาก DB
  const fetchAccount = useCallback(async (acId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/account/${acId}`);
      if (res.ok) {
        const freshData = await res.json();
        setUser(freshData);
        localStorage.setItem("user", JSON.stringify(freshData));
      }
    } catch (err) {
      console.error("Fetch account failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ฟังก์ชันดึงข้อมูลที่อยู่ทั้งหมดของผู้ใช้
  const fetchAddresses = useCallback(async (acId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/address/${acId}`);
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (err) {
      console.error("Fetch addresses failed:", err);
    }
  }, []);

  // ฟังก์ชันดึงข้อมูลร้านค้าทั้งหมด
  const fetchStores = useCallback(async () => {
    setStoreLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/stores");
      if (res.ok) {
        const data = await res.json();
        setStores(data);
      }
    } catch (err) {
      console.error("Fetch stores failed:", err);
    } finally {
      setStoreLoading(false);
    }
  }, []);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser) {
      navigate("/login");
      return;
    }
    fetchAccount(loggedInUser.AC_ID);
    fetchStores();
    fetchAddresses(loggedInUser.AC_ID);

    if (loggedInUser.TYPE === 'Admin') {
      fetch('http://localhost:5000/api/config/shipping-delay')
        .then(r => r.json())
        .then(d => setShippingDelaySec(d.delaySec || 60))
        .catch(console.error);
    }
  }, [navigate, fetchAccount, fetchStores, fetchAddresses]);

  // ตั้งค่าฟอร์มแก้ไขเมื่อเปิดโหมดแก้ไข
  useEffect(() => {
    if (user) {
      setEditForm({
        currentPassword: "",
        newUsername: user.USERNAME || "",
        newPassword: "",
        newEmail: user.EMAIL || "",
        newGender: user.GENDER || "",
        newFname: user.FNAME || "",
        newLname: user.LNAME || "",
        newPhone: user.PHONE || "",
      });
    }
  }, [user, editMode]);

  const saveDelay = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/config/shipping-delay', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delaySec: shippingDelaySec })
      });
      if (res.ok) {
        showAlert('บันทึกเวลาจัดส่งสำเร็จ');
        setDelayModalOpen(false);
      }
    } catch (e) {
      showAlert('Error saving delay');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // 1. บันทึกการแก้ไขข้อมูลบัญชี
  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!editForm.currentPassword) {
      showAlert("กรุณาระบุรหัสผ่านปัจจุบัน (Current Password) เพื่อยืนยันตัวตน");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acId: user.AC_ID,
          ...editForm,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.requireRelogin) {
          showAlert(
            "คุณได้เปลี่ยนแปลง Email หรือ รหัสผ่าน ระบบจะทำการออกจากระบบเพื่อให้ Login ใหม่อีกครั้ง",
          );
          handleLogout();
        } else {
          showAlert("อัปเดตข้อมูลบัญชีสำเร็จ!");
          setEditMode(false);
          fetchAccount(user.AC_ID);
        }
      } else {
        showAlert(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      showAlert("เซิร์ฟเวอร์ไม่ตอบสนอง กรุณาลองใหม่อีกครั้ง");
    }
  };

  // 2. สลับบทบาทระหว่าง Customer <-> Seller
  const handleSwitchRole = async (e) => {
    e.preventDefault();
    if (!switchPassword) {
      showAlert("กรุณากรอกรหัสผ่านเพื่อยืนยันการสลับบทบาท");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/account/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acId: user.AC_ID,
          password: switchPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showAlert(data.message);
        setSwitchPassword("");
        setSwitchRoleOpen(false);
        fetchAccount(user.AC_ID);
        fetchStores();
      } else {
        showAlert(data.error || "สลับบทบาทไม่สำเร็จ");
      }
    } catch (err) {
      showAlert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  // 3. สร้างร้านค้าใหม่ (เฉพาะ Seller)
  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!storeForm.stName.trim()) {
      showAlert("กรุณากรอกชื่อร้านค้า");
      return;
    }
    if (!storeForm.addressId) {
      if (addresses.length === 0) {
        showAlert(
          "คุณยังไม่มีที่อยู่ในระบบ กรุณากด '+ เพิ่มที่อยู่ใหม่' ด้านบนก่อนเปิดร้านค้า",
        );
      } else {
        showAlert("กรุณาเลือกที่อยู่สำหรับร้านค้า");
      }
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acId: user.AC_ID,
          stName: storeForm.stName.trim(),
          addressId: storeForm.addressId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showAlert(data.message);
        setStoreForm({ stName: "", addressId: "" });
        fetchStores();
        fetchAccount(user.AC_ID);
      } else {
        showAlert(data.error || "สร้างร้านค้าไม่สำเร็จ");
      }
    } catch (err) {
      showAlert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  // 4. สลับสถานะเปิด-ปิดร้านค้า (IS_OPEN = 'Y' หรือ 'N')
  const handleToggleStoreStatus = async (stId, currentStatus) => {
    const nextStatus = currentStatus === "Y" ? "N" : "Y";
    const actionText =
      nextStatus === "Y" ? "เปิดร้านให้บริการ" : "ปิดร้านชั่วคราว";

    if (!await showConfirm(`ต้องการ "${actionText}" ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/stores/${stId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isOpen: nextStatus }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        showAlert(data.message);
        fetchStores();
      } else {
        showAlert(data.error || "เปลี่ยนสถานะไม่สำเร็จ");
      }
    } catch (err) {
      showAlert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  // 4.1 ฟังก์ชันเปิด Modal แก้ไขชื่อและที่อยู่ร้าน
  const handleOpenEditStore = (s) => {
    setStoreEditForm({
      stId: s.ST_ID,
      stName: s.ST_NAME || "",
      addressId: s.ADDRESS_ID ? String(s.ADDRESS_ID) : "",
    });
    setEditStoreModalOpen(true);
  };

  // 4.2 บันทึกการแก้ไขชื่อและที่อยู่ร้านค้า
  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (!storeEditForm.stName.trim() || !storeEditForm.addressId) {
      showAlert("กรุณากรอกชื่อร้านค้าและเลือกสถานที่ตั้งให้ครบถ้วน");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/stores/${storeEditForm.stId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stName: storeEditForm.stName.trim(),
            addressId: storeEditForm.addressId,
            acId: user.AC_ID,
          }),
        },
      );

      const data = await res.json();
      if (res.ok) {
        showAlert(data.message);
        setEditStoreModalOpen(false);
        fetchStores();
      } else {
        showAlert(data.error || "แก้ไขข้อมูลร้านไม่สำเร็จ");
      }
    } catch (err) {
      showAlert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  // 4.3 จัดการขนส่งร้านค้า
  const handleOpenShipping = async (s) => {
    setCurrentStoreForShipping(s);
    try {
      const res = await fetch(
        `http://localhost:5000/api/stores/${s.ST_ID}/services/all`,
      );
      const configRes = await fetch(
        `http://localhost:5000/api/shipping/config-prices`,
      );
      if (res.ok && configRes.ok) {
        const data = await res.json();
        const configData = await configRes.json();
        setStoreShippingServices(data);
        setShippingConfig(configData);
        setShippingModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveShipping = async () => {
    try {
      const payload = storeShippingServices.map((s) => ({
        DVSERVICE_ID: s.DVSERVICE_ID,
        IS_ACTIVE: s.IS_ACTIVE,
        IS_PICKUP: s.IS_PICKUP_ENABLED,
        IS_DROPOFF: s.IS_DROPOFF_ENABLED,
      }));
      const res = await fetch(
        `http://localhost:5000/api/stores/${currentStoreForShipping.ST_ID}/services`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ services: payload }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        showAlert(data.message);
        setShippingModalOpen(false);
      } else {
        showAlert(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      showAlert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  const toggleShippingService = (idx, field) => {
    setStoreShippingServices((prev) => {
      const nw = [...prev];
      nw[idx] = { ...nw[idx] };
      nw[idx][field] = nw[idx][field] === "Y" ? "N" : "Y";
      return nw;
    });
  };

  // จัดการที่อยู่ (Address Functions)
  const handleOpenAddressModal = (addr = null) => {
    if (addr) {
      setAddressForm({
        id: addr.ADDRESS_ID,
        addressLine: addr.ADDRESS_LINE || "",
        subDistrict: addr.SUB_DISTRICT || "",
        district: addr.DISTRICT || "",
        province: addr.PROVINCE || "",
        zipCode: addr.ZIP_CODE || "",
        isDefault: addr.IS_DEFAULT || "N",
      });
    } else {
      setAddressForm({
        id: null,
        addressLine: "",
        subDistrict: "",
        district: "",
        province: "",
        zipCode: "",
        isDefault: "N",
      });
    }
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const url = addressForm.id
      ? `http://localhost:5000/api/address/${addressForm.id}`
      : "http://localhost:5000/api/address";
    const method = addressForm.id ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acId: user.AC_ID,
          addressLine: addressForm.addressLine,
          subDistrict: addressForm.subDistrict,
          district: addressForm.district,
          province: addressForm.province,
          zipCode: addressForm.zipCode,
          isDefault: addressForm.isDefault,
          addressType: "HOME",
        }),
      });
      if (res.ok) {
        showAlert("บันทึกที่อยู่เรียบร้อย");
        setIsAddressModalOpen(false);
        fetchAddresses(user.AC_ID);
      } else {
        const data = await res.json();
        showAlert(data.error || "เกิดข้อผิดพลาดในการบันทึกที่อยู่");
      }
    } catch (err) {
      showAlert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  // 5. ลบบัญชีผู้ใช้
  const handleDeleteAccount = async () => {
    if (
      !await showConfirm(
        "🚨 คำเตือน: คุณต้องการ 'ลบบัญชีนี้ถาวร' จริงๆ หรือไม่? ข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้!",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/auth/delete/${user.AC_ID}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (res.ok) {
        showAlert(data.message);
        handleLogout();
      } else {
        showAlert(data.error || "ไม่สามารถลบบัญชีได้");
      }
    } catch (err) {
      showAlert("เซิร์ฟเวอร์ไม่ตอบสนอง");
    }
  };

  if (loading || !user) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        กำลังโหลดข้อมูลบัญชีผู้ใช้... ⏳
      </div>
    );
  }

  const isCustomerOrSeller = user.TYPE === "Customer" || user.TYPE === "Seller";
  const targetRole = user.TYPE === "Customer" ? "Seller" : "Customer";
  const isAdminOrEmployee = user.TYPE === "Admin" || user.TYPE === "Employee";

  // ร้านค้าที่เป็นของ User ปัจจุบัน (ดูจาก STORE.AC_ID)
  const myStores = stores.filter((s) => s.AC_ID === user.AC_ID);

  // กรองร้านค้าตามสิทธิ์การเข้าถึง
  let displayedStores = [];
  if (isAdminOrEmployee) {
    // Admin, Employee ค้นหาและดูได้ทุกร้าน
    displayedStores = stores.filter(
      (s) =>
        s.ST_NAME?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.LOCATION?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(s.ST_ID).includes(searchQuery),
    );
  } else if (user.TYPE === "Seller") {
    // Seller ให้เห็นเฉพาะทุกร้านของตัวเอง (1 Account มีได้หลายร้าน)
    displayedStores = myStores;
  } else if (user.TYPE === "Customer" && myStores.length > 0) {
    // Customer ถ้าเคยมีร้านของตัวเองในระบบ ให้เห็นร้านของตัวเอง
    displayedStores = myStores;
  }

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "900px",
        margin: "0 auto",
        color: "#1e293b",
      }}
    >
      {/* ==================================================== */}
      {/* 1. การ์ดแสดงข้อมูลส่วนตัวบัญชี (ตามตาราง ACCOUNT) */}
      {/* ==================================================== */}
      <div
        style={{
          padding: "2rem",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1rem",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "1.5rem",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <h1 style={{ margin: 0, fontSize: "1.6rem" }}>
                {user.FNAME} {user.LNAME}
              </h1>
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  backgroundColor:
                    user.TYPE === "Seller"
                      ? "#dcfce7"
                      : user.TYPE === "Admin"
                        ? "#fee2e2"
                        : user.TYPE === "Employee"
                          ? "#fef3c7"
                          : "#e0e7ff",
                  color:
                    user.TYPE === "Seller"
                      ? "#15803d"
                      : user.TYPE === "Admin"
                        ? "#b91c1c"
                        : user.TYPE === "Employee"
                          ? "#b45309"
                          : "#4338ca",
                }}
              >
                บทบาท: {user.TYPE}
              </span>
            </div>
            <p
              style={{
                margin: "0.4rem 0 0 0",
                color: "#64748b",
                fontSize: "0.95rem",
              }}
            >
              @{user.USERNAME} • ID บัญชี: #{user.AC_ID}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {isCustomerOrSeller && (
              <button
                onClick={() => setSwitchRoleOpen(true)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#6366f1",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  boxShadow: "0 2px 4px rgba(99, 102, 241, 0.2)",
                }}
              >
                🔄 สลับบทบาทเป็น {targetRole}
              </button>
            )}
            <button
              onClick={() => setEditMode(!editMode)}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: editMode ? "#94a3b8" : "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "0.9rem",
              }}
            >
              {editMode ? "✕ ปิดหน้าแก้ไข" : "⚙️ แก้ไขบัญชี"}
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "0.9rem",
              }}
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* ข้อมูลทั้งหมดในตาราง ACCOUNT */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
            marginTop: "1.5rem",
            fontSize: "0.95rem",
          }}
        >
          <div>
            <span
              style={{
                color: "#64748b",
                display: "block",
                fontSize: "0.85rem",
              }}
            >
              📧 อีเมล (EMAIL)
            </span>
            <strong>{user.EMAIL || "-"}</strong>
          </div>
          <div>
            <span
              style={{
                color: "#64748b",
                display: "block",
                fontSize: "0.85rem",
              }}
            >
              📱 เบอร์โทรศัพท์ (PHONE)
            </span>
            <strong>{user.PHONE || "-"}</strong>
          </div>
          <div>
            <span
              style={{
                color: "#64748b",
                display: "block",
                fontSize: "0.85rem",
              }}
            >
              ⚧️ เพศ (GENDER)
            </span>
            <strong>{user.GENDER || "-"}</strong>
          </div>
          <div>
            <span
              style={{
                color: "#64748b",
                display: "block",
                fontSize: "0.85rem",
              }}
            >
              🎂 วันเกิด (BIRTH_DATE)
            </span>
            <strong>{user.BIRTH_DATE || "-"}</strong>
          </div>
          <div>
            <span
              style={{
                color: "#64748b",
                display: "block",
                fontSize: "0.85rem",
              }}
            >
              📅 วันที่ลงทะเบียน (REGISTED_DATE)
            </span>
            <strong>{user.REGISTED_DATE || user.REGISTERED_DATE || "-"}</strong>
          </div>
          <div>
            <span
              style={{
                color: "#64748b",
                display: "block",
                fontSize: "0.85rem",
              }}
            >
              🏪 ร้านค้าในครอบครอง
            </span>
            <strong>
              {myStores.length > 0
                ? `${myStores.length} ร้านค้า`
                : "ยังไม่มีร้านค้า"}
            </strong>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. ฟอร์มแก้ไขข้อมูลบัญชี */}
      {/* ==================================================== */}
      {editMode && (
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "2px dashed #94a3b8",
            borderRadius: "16px",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "1.3rem" }}>
            ✏️ แก้ไขข้อมูลบัญชีของคุณ
          </h2>
          <p
            style={{
              color: "#64748b",
              fontSize: "0.9rem",
              marginTop: "-0.5rem",
            }}
          >
            * จำเป็นต้องระบุรหัสผ่านปัจจุบันทุกครั้ง และหากเปลี่ยน{" "}
            <strong>Email</strong> หรือ <strong>Password</strong> ระบบจะให้
            Login ใหม่โดยอัตโนมัติ
          </p>

          <form
            onSubmit={handleUpdateAccount}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            <div
              style={{
                backgroundColor: "#fee2e2",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid #f87171",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  color: "#991b1b",
                  fontSize: "0.9rem",
                }}
              >
                🔒 รหัสผ่านปัจจุบัน (Current Password) *จำเป็น:
              </label>
              <input
                type="password"
                required
                placeholder="กรอกรหัสผ่านเดิมเพื่อยืนยันการแก้ไข"
                value={editForm.currentPassword}
                onChange={(e) =>
                  setEditForm({ ...editForm, currentPassword: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  marginTop: "0.4rem",
                  borderRadius: "6px",
                  border: "1px solid #f87171",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label style={{ fontSize: "0.85rem", color: "#475569" }}>
                  Username:
                </label>
                <input
                  type="text"
                  value={editForm.newUsername}
                  onChange={(e) =>
                    setEditForm({ ...editForm, newUsername: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    marginTop: "0.25rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#475569" }}>
                  Password ใหม่ (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน):
                </label>
                <input
                  type="password"
                  placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  minLength={6}
                  value={editForm.newPassword}
                  onChange={(e) =>
                    setEditForm({ ...editForm, newPassword: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    marginTop: "0.25rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label style={{ fontSize: "0.85rem", color: "#475569" }}>
                  ชื่อจริง (FNAME):
                </label>
                <input
                  type="text"
                  value={editForm.newFname}
                  onChange={(e) =>
                    setEditForm({ ...editForm, newFname: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    marginTop: "0.25rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#475569" }}>
                  นามสกุล (LNAME):
                </label>
                <input
                  type="text"
                  value={editForm.newLname}
                  onChange={(e) =>
                    setEditForm({ ...editForm, newLname: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    marginTop: "0.25rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label style={{ fontSize: "0.85rem", color: "#475569" }}>
                  อีเมล (EMAIL):
                </label>
                <input
                  type="email"
                  value={editForm.newEmail}
                  onChange={(e) =>
                    setEditForm({ ...editForm, newEmail: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    marginTop: "0.25rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#475569" }}>
                  เบอร์โทรศัพท์ (PHONE):
                </label>
                <input
                  type="tel"
                  placeholder="เบอร์โทรศัพท์ (10 หลัก)"
                  pattern="[0-9]{10}"
                  title="กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลข 10 หลัก"
                  value={editForm.newPhone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, newPhone: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    marginTop: "0.25rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#475569" }}>
                  เพศ (GENDER):
                </label>
                <select
                  value={editForm.newGender}
                  onChange={(e) =>
                    setEditForm({ ...editForm, newGender: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    marginTop: "0.25rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">ไม่ระบุ</option>
                  <option value="Male">ชาย</option>
                  <option value="Female">หญิง</option>
                  <option value="Other">อื่นๆ</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                marginTop: "1rem",
              }}
            >
              <button
                type="button"
                onClick={() => setEditMode(false)}
                style={{
                  padding: "0.6rem 1.2rem",
                  backgroundColor: "#e2e8f0",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                style={{
                  padding: "0.6rem 1.5rem",
                  backgroundColor: "#059669",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                💾 บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </form>

          <div
            style={{
              marginTop: "2rem",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "#ef4444",
                fontSize: "0.9rem",
                fontWeight: "bold",
              }}
            >
              โซนอันตราย (Danger Zone):
            </span>
            <button
              onClick={handleDeleteAccount}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#991b1b",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              🗑️ ลบบัญชีผู้ใช้นี้ทิ้งถาวร
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. Modal สลับบทบาท Customer <-> Seller */}
      {/* ==================================================== */}
      {switchRoleOpen && (
        <div
          style={{
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
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "2rem",
              borderRadius: "16px",
              width: "90%",
              maxWidth: "440px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.25rem" }}>
              🔄 สลับบทบาทเป็น "{targetRole}"
            </h3>
            <p
              style={{
                color: "#64748b",
                fontSize: "0.85rem",
                margin: "0.5rem 0 1.25rem 0",
              }}
            >
              {user.TYPE === "Seller" ? (
                <span style={{ color: "#dc2626" }}>
                  ⚠️ ข้อควรทราบ: เมื่อสลับเป็น Customer ร้านค้าที่คุณดูแลจะถูก{" "}
                  <strong>ปิดให้บริการ (IS_OPEN = 'N')</strong> อัตโนมัติทันที
                </span>
              ) : (
                <span>
                  การสลับบทบาทจำเป็นต้องยืนยันรหัสผ่านเพื่อความปลอดภัย
                </span>
              )}
            </p>

            <form onSubmit={handleSwitchRole}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  color: "#334155",
                }}
              >
                กรุณากรอกรหัสผ่านของคุณ:
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="รหัสผ่านปัจจุบัน"
                value={switchPassword}
                onChange={(e) => setSwitchPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  marginTop: "0.4rem",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  boxSizing: "border-box",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSwitchRoleOpen(false);
                    setSwitchPassword("");
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#f1f5f9",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.5rem 1.2rem",
                    backgroundColor: "#6366f1",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ยืนยันสลับบทบาท
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3.5 พื้นที่จัดการที่อยู่ (Address) */}
      {/* ==================================================== */}
      <section
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "2rem",
          marginBottom: "2rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#334155" }}>
              📍 ที่อยู่ของคุณ (My Addresses)
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: "0.85rem",
                margin: "0.25rem 0 0 0",
              }}
            >
              จัดการที่อยู่สำหรับการจัดส่ง และที่ตั้งสำหรับร้านค้าของคุณ
            </p>
          </div>
          <button
            onClick={() => handleOpenAddressModal()}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#3b82f6",
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ➕ เพิ่มที่อยู่ใหม่
          </button>
        </div>

        {addresses.length === 0 ? (
          <div
            style={{
              padding: "1.5rem",
              textAlign: "center",
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              color: "#94a3b8",
            }}
          >
            คุณยังไม่มีที่อยู่บันทึกไว้ในระบบ กดปุ่ม "+ เพิ่มที่อยู่ใหม่"
            เพื่อเพิ่มที่อยู่
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
          >
            {addresses.map((addr) => (
              <div
                key={addr.ADDRESS_ID}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "1rem",
                  position: "relative",
                  backgroundColor: "#f8fafc",
                }}
              >
                {addr.IS_DEFAULT === "Y" && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      backgroundColor: "#22c55e",
                      color: "white",
                      fontSize: "0.7rem",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    ค่าเริ่มต้น
                  </span>
                )}
                <p
                  style={{
                    margin: "0 0 0.5rem 0",
                    fontWeight: "bold",
                    fontSize: "0.95rem",
                  }}
                >
                  ที่อยู่ #{addr.ADDRESS_ID}{" "}
                  {addr.ADDRESS_TYPE ? `(${addr.ADDRESS_TYPE})` : ""}
                </p>
                <p
                  style={{
                    margin: "0",
                    fontSize: "0.9rem",
                    color: "#475569",
                    lineHeight: "1.4",
                  }}
                >
                  {addr.ADDRESS_LINE} {addr.SUB_DISTRICT} {addr.DISTRICT}{" "}
                  {addr.PROVINCE} {addr.ZIP_CODE}
                </p>
                <button
                  onClick={() => handleOpenAddressModal(addr)}
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.4rem 0.8rem",
                    backgroundColor: "#e2e8f0",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  ✏️ แก้ไขที่อยู่
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal จัดการที่อยู่ */}
      {isAddressModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "2rem",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>
              {addressForm.id ? "✏️ แก้ไขที่อยู่" : "➕ เพิ่มที่อยู่ใหม่"}
            </h3>
            <form
              onSubmit={handleSaveAddress}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    color: "#334155",
                  }}
                >
                  บ้านเลขที่, ถนน, ซอย:
                </label>
                <input
                  required
                  placeholder="เช่น 123/45 ถ.สุขุมวิท"
                  value={addressForm.addressLine}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      addressLine: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    boxSizing: "border-box",
                    marginTop: "0.2rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      color: "#334155",
                    }}
                  >
                    ตำบล / แขวง:
                  </label>
                  <input
                    required
                    placeholder="ตำบล / แขวง"
                    value={addressForm.subDistrict}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        subDistrict: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      boxSizing: "border-box",
                      marginTop: "0.2rem",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      color: "#334155",
                    }}
                  >
                    อำเภอ / เขต:
                  </label>
                  <input
                    required
                    placeholder="อำเภอ / เขต"
                    value={addressForm.district}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        district: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      boxSizing: "border-box",
                      marginTop: "0.2rem",
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      color: "#334155",
                    }}
                  >
                    จังหวัด:
                  </label>
                  <input
                    required
                    placeholder="จังหวัด"
                    value={addressForm.province}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        province: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      boxSizing: "border-box",
                      marginTop: "0.2rem",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      color: "#334155",
                    }}
                  >
                    รหัสไปรษณีย์:
                  </label>
                  <input
                    required
                    placeholder="รหัสไปรษณีย์"
                    value={addressForm.zipCode}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        zipCode: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      boxSizing: "border-box",
                      marginTop: "0.2rem",
                    }}
                  />
                </div>
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  marginTop: "0.25rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={addressForm.isDefault === "Y"}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      isDefault: e.target.checked ? "Y" : "N",
                    })
                  }
                />
                ตั้งเป็นที่อยู่เริ่มต้น
              </label>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  style={{
                    padding: "0.6rem 1rem",
                    backgroundColor: "#e2e8f0",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.6rem 1.4rem",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. พื้นที่จัดการร้านค้า (เงื่อนไขสิทธิ์ตาม Role) */}
      {/* ==================================================== */}
      {(user.TYPE === "Seller" ||
        isAdminOrEmployee ||
        (user.TYPE === "Customer" && myStores.length > 0)) && (
          <section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "2rem",
              marginBottom: "2rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* หัวข้อตาม Role */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.35rem",
                    color: isAdminOrEmployee ? "#b45309" : "#0f766e",
                  }}
                >
                  {isAdminOrEmployee
                    ? "🏬 ตรวจสอบและค้นหาร้านค้าทั้งหมด (Admin / Employee)"
                    : user.TYPE === "Seller"
                      ? "🏪 ร้านค้าของฉัน (Seller Store Area)"
                      : "🏪 ข้อมูลร้านค้าของคุณ (บทบาท Customer)"}
                </h2>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "0.85rem",
                    margin: "0.25rem 0 0 0",
                  }}
                >
                  {isAdminOrEmployee
                    ? "สิทธิพิเศษสำหรับเจ้าหน้าที่ สามารถดูและค้นหาข้อมูลร้านค้าทุกร้านในระบบได้"
                    : user.TYPE === "Seller"
                      ? "คุณสามารถเปิด/ปิดร้านค้า หรือสร้างร้านค้าใหม่ได้ที่นี่"
                      : "ร้านของคุณถูกปิดให้บริการอยู่ หากต้องการเปิดร้าน กรุณาสลับบทบาทเป็น Seller ก่อน"}
                </p>
              </div>

              {/* ช่องค้นหาสำหรับ Admin และ Employee */}
              {isAdminOrEmployee && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="🔍 ค้นหาร้านค้า / ที่ตั้ง..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      width: "240px",
                    }}
                  />
                </div>
              )}
            </div>

            {/* ฟอร์มสร้างร้านค้าใหม่ (เฉพาะ Seller เท่านั้น) */}
            {user.TYPE === "Seller" && (
              <form
                onSubmit={handleCreateStore}
                style={{
                  backgroundColor: "#f0fdf4",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  border: "1px solid #bbf7d0",
                  marginTop: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <h4 style={{ margin: "0 0 1rem 0", color: "#166534" }}>
                  ➕ เปิดร้านค้าใหม่ (สร้างกี่ร้านก็ได้)
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto",
                    gap: "1rem",
                    alignItems: "flex-end",
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "bold",
                        color: "#166534",
                      }}
                    >
                      ชื่อร้านค้า (ST_NAME):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น ร้านสะดวกช้อป 24 ชม."
                      value={storeForm.stName}
                      onChange={(e) =>
                        setStoreForm({ ...storeForm, stName: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        marginTop: "0.25rem",
                        borderRadius: "6px",
                        border: "1px solid #86efac",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: "bold",
                          color: "#166534",
                        }}
                      >
                        สถานที่ตั้ง (เลือกที่อยู่):
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenAddressModal()}
                        style={{
                          fontSize: "0.75rem",
                          color: "#2563eb",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                          padding: 0,
                        }}
                      >
                        ➕ เพิ่มที่อยู่ใหม่
                      </button>
                    </div>
                    <select
                      required
                      value={storeForm.addressId}
                      onChange={(e) =>
                        setStoreForm({ ...storeForm, addressId: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        marginTop: "0.25rem",
                        borderRadius: "6px",
                        border: "1px solid #86efac",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="" disabled>
                        -- กรุณาเลือกที่อยู่ร้านค้า --
                      </option>
                      {addresses.map((a) => (
                        <option key={a.ADDRESS_ID} value={a.ADDRESS_ID}>
                          {a.ADDRESS_LINE} {a.SUB_DISTRICT || ""}{" "}
                          {a.DISTRICT || ""} {a.PROVINCE} {a.ZIP_CODE || ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    style={{
                      padding: "0.65rem 1.4rem",
                      backgroundColor: "#16a34a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                    }}
                  >
                    สร้างร้านค้า
                  </button>
                </div>
                <div
                  style={{
                    marginTop: "0.6rem",
                    fontSize: "0.8rem",
                    color: "#15803d",
                  }}
                >
                  * กำหนดค่าเริ่มต้น: Rating Point = 0 | Selling Rate = 2.5 |
                  IS_OPEN = 'Y' (เปิดทันที)
                </div>
              </form>
            )}

            {/* รายการร้านค้า */}
            <div>
              <h3 style={{ fontSize: "1.05rem", margin: "0 0 1rem 0" }}>
                📦{" "}
                {isAdminOrEmployee
                  ? `ผลการค้นหาร้านค้า (${displayedStores.length} ร้าน)`
                  : "ร้านค้าในการดูแลของคุณ"}
              </h3>

              {storeLoading ? (
                <p style={{ color: "#64748b" }}>กำลังโหลดข้อมูลร้านค้า... ⏳</p>
              ) : displayedStores.length === 0 ? (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                    color: "#94a3b8",
                  }}
                >
                  {isAdminOrEmployee
                    ? "ไม่พบร้านค้าที่ตรงกับคำค้นหา"
                    : user.TYPE === "Seller"
                      ? "คุณยังไม่มีร้านค้า กรุณาสร้างร้านค้าใหม่ด้านบน"
                      : "ไม่มีข้อมูลร้านค้า"}
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  {displayedStores.map((s) => {
                    const isOpen = s.IS_OPEN === "Y";
                    const isMyStore = s.AC_ID === user.AC_ID;

                    return (
                      <div
                        key={s.ST_ID}
                        style={{
                          border: isOpen
                            ? "2px solid #86efac"
                            : "2px solid #fca5a5",
                          padding: "1.25rem",
                          borderRadius: "12px",
                          backgroundColor: isOpen ? "#f0fdf4" : "#fef2f2",
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          {/* ป้ายสถานะเปิด/ปิดร้าน */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <span
                              style={{
                                backgroundColor: isOpen ? "#16a34a" : "#dc2626",
                                color: "white",
                                padding: "0.2rem 0.6rem",
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                              }}
                            >
                              {isOpen
                                ? "🟢 เปิดให้บริการ (IS_OPEN = Y)"
                                : "🔴 ปิดให้บริการ (IS_OPEN = N)"}
                            </span>
                            {isMyStore && (
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#0f766e",
                                  fontWeight: "bold",
                                }}
                              >
                                ⭐ ร้านของคุณ
                              </span>
                            )}
                          </div>

                          <h4
                            style={{
                              margin: "0 0 0.35rem 0",
                              fontSize: "1.1rem",
                              cursor: "pointer",
                            }}
                            onClick={() => navigate(`/store/${s.ST_ID}`)}
                            title="คลิกเพื่อเปิดดูหน้าร้านค้า"
                          >
                            <span style={{ color: "#2563eb", textDecoration: "underline" }}>
                              {s.ST_NAME}
                            </span>{" "}
                            <span
                              style={{ fontSize: "0.8rem", color: "#64748b" }}
                            >
                              #{s.ST_ID}
                            </span>
                          </h4>
                          <p
                            style={{
                              margin: "0 0 0.75rem 0",
                              color: "#64748b",
                              fontSize: "0.85rem",
                            }}
                          >
                            📍{" "}
                            {s.ADDRESS_LINE
                              ? `${s.ADDRESS_LINE} ${s.SUB_DISTRICT || ""} ${s.DISTRICT || ""} ${s.PROVINCE || ""} ${s.ZIP_CODE || ""}`.trim()
                              : s.LOCATION || "ไม่ระบุที่อยู่"}
                          </p>
                        </div>

                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.8rem",
                              color: "#334155",
                              borderTop: "1px dashed #cbd5e1",
                              paddingTop: "0.5rem",
                              marginBottom: "0.75rem",
                            }}
                          >
                            <span>
                              ⭐ Rating: <strong>{s.RATING_POINT ?? 0}</strong>
                            </span>
                            <span>
                              📈 Rate: <strong>{s.SELLING_RATE ?? 2.5}</strong>
                            </span>
                          </div>

                          {/* ปุ่มเปิดดูหน้าร้านค้า */}
                          <div style={{ marginBottom: "0.5rem" }}>
                            <button
                              onClick={() => navigate(`/store/${s.ST_ID}`)}
                              style={{
                                width: "100%",
                                padding: "0.5rem",
                                backgroundColor: "#3b82f6",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "bold",
                                fontSize: "0.85rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.4rem",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                              }}
                            >
                              👁️ ดูหน้าร้านค้า (Store Front)
                            </button>
                          </div>

                          {/* ปุ่มจัดการสินค้าในร้าน และปุ่มแก้ไขข้อมูลร้าน (เฉพาะเจ้าของร้าน หรือ Admin เท่านั้น) */}
                          {((user.TYPE === "Seller" && isMyStore) ||
                            user.TYPE === "Admin") && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: "0.5rem",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                <button
                                  onClick={() =>
                                    navigate(`/product-manager/${s.ST_ID}`)
                                  }
                                  style={{
                                    flex: 1,
                                    padding: "0.5rem",
                                    backgroundColor: "#2563eb",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: "0.85rem",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                  }}
                                >
                                  📦 จัดการสินค้า
                                </button>
                                <button
                                  onClick={() => handleOpenEditStore(s)}
                                  style={{
                                    padding: "0.5rem 0.8rem",
                                    backgroundColor: "#f1f5f9",
                                    color: "#1e293b",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: "0.85rem",
                                  }}
                                  title="แก้ไขชื่อและที่ตั้งร้านค้า"
                                >
                                  ✏️ แก้ไขร้าน
                                </button>
                                <button
                                  onClick={() => handleOpenShipping(s)}
                                  style={{
                                    padding: "0.5rem 0.8rem",
                                    backgroundColor: "#f8fafc",
                                    color: "#0f766e",
                                    border: "1px solid #ccfbf1",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  🚚 จัดการขนส่ง
                                </button>
                              </div>
                            )}

                          {/* ปุ่มกดเปิด-ปิดร้านค้า (Seller จัดการร้านตัวเอง, Admin/Employee จัดการได้ทุกร้าน) */}
                          {(user.TYPE === "Seller" && isMyStore) ||
                            isAdminOrEmployee ? (
                            <button
                              onClick={() =>
                                handleToggleStoreStatus(s.ST_ID, s.IS_OPEN)
                              }
                              style={{
                                width: "100%",
                                padding: "0.5rem",
                                backgroundColor: isOpen ? "#ef4444" : "#16a34a",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "bold",
                                fontSize: "0.85rem",
                              }}
                            >
                              {isOpen
                                ? "🔴 กดเพื่อปิดร้านชั่วคราว"
                                : "🟢 กดเพื่อเปิดร้านให้บริการ"}
                            </button>
                          ) : (
                            user.TYPE === "Customer" && (
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#b91c1c",
                                  textAlign: "center",
                                  fontStyle: "italic",
                                }}
                              >
                                * ต้องสลับเป็น Seller เพื่อเปิดร้าน
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

      {/* ==================================================== */}
      {/* 5. เมนูสิทธิ์ตาม Role */}
      {/* ==================================================== */}
      <section
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "1.5rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem" }}>
          📋 เมนูและสิทธิ์การใช้งาน (Role: {user.TYPE})
        </h3>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {user.TYPE === "Admin" && (
            <button
              onClick={() => navigate("/admin/manage-employees")}
              style={{
                padding: "0.75rem 1rem",
                background: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              👨‍💼 จัดการข้อมูลพนักงาน
            </button>
          )}
          {isAdminOrEmployee && (
            <button
              onClick={() => navigate("/admin/manage-users")}
              style={{
                padding: "0.75rem 1rem",
                background: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              👥 จัดการข้อมูลลูกค้า/ผู้ขาย
            </button>
          )}

          <button
            onClick={() => navigate("/market")}
            style={{
              padding: "0.75rem 1rem",
              background: "#e0e7ff",
              border: "1px solid #6366f1",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            🛒 ตะกร้าสินค้าและการสั่งซื้อ
          </button>

          <button
            onClick={() => navigate('/history')}
            style={{
              padding: '0.75rem 1rem',
              background: '#dcfce7',
              border: '1px solid #10b981',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            📋 ประวัติการสั่งซื้อ
          </button>

          {user.TYPE === 'Admin' && (
            <button
              onClick={() => setDelayModalOpen(true)}
              style={{
                padding: '0.75rem 1rem',
                background: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              ⚙️ จัดการเวลาจัดส่ง (Delay)
            </button>
          )}

        </div>
      </section>

      {/* Modal แก้ไขชื่อร้านและสถานที่ตั้ง */}
      {editStoreModalOpen && (
        <div
          style={{
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
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "2rem",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem" }}>
              ✏️ แก้ไขข้อมูลร้านค้า #{storeEditForm.stId}
            </h3>
            <p
              style={{
                color: "#64748b",
                fontSize: "0.85rem",
                margin: "0 0 1.25rem 0",
              }}
            >
              คุณสามารถเปลี่ยนชื่อร้านค้าและสถานที่ตั้งของร้านได้
            </p>

            <form
              onSubmit={handleSaveStore}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                    color: "#334155",
                  }}
                >
                  ชื่อร้านค้า (ST_NAME):
                </label>
                <input
                  type="text"
                  required
                  value={storeEditForm.stName}
                  onChange={(e) =>
                    setStoreEditForm({
                      ...storeEditForm,
                      stName: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    marginTop: "0.3rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: "bold",
                      color: "#334155",
                    }}
                  >
                    สถานที่ตั้ง (เลือกที่อยู่):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditStoreModalOpen(false);
                      handleOpenAddressModal();
                    }}
                    style={{
                      fontSize: "0.75rem",
                      color: "#2563eb",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    ➕ เพิ่มที่อยู่ใหม่
                  </button>
                </div>
                <select
                  required
                  value={storeEditForm.addressId}
                  onChange={(e) =>
                    setStoreEditForm({
                      ...storeEditForm,
                      addressId: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    marginTop: "0.3rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="" disabled>
                    -- กรุณาเลือกที่อยู่ร้านค้า --
                  </option>
                  {addresses.map((a) => (
                    <option key={a.ADDRESS_ID} value={a.ADDRESS_ID}>
                      {a.ADDRESS_LINE} {a.SUB_DISTRICT || ""} {a.DISTRICT || ""}{" "}
                      {a.PROVINCE} {a.ZIP_CODE || ""}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditStoreModalOpen(false)}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.5rem 1.4rem",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  💾 บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal จัดการขนส่งร้านค้า */}
      {shippingModalOpen && currentStoreForShipping && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ marginTop: 0 }}>🚚 จัดการช่องทางขนส่ง</h2>
            <p style={{ color: "#64748b" }}>
              ร้าน: {currentStoreForShipping.ST_NAME}
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              {storeShippingServices.map((srv, idx) => (
                <div
                  key={srv.DVSERVICE_ID}
                  style={{
                    border: "1px solid #e2e8f0",
                    padding: "1rem",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <strong style={{ fontSize: "1.1rem" }}>
                      {srv.DVSERVICE_NAME}
                    </strong>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={srv.IS_ACTIVE === "Y"}
                        onChange={() => toggleShippingService(idx, "IS_ACTIVE")}
                        style={{ width: "18px", height: "18px" }}
                      />
                      <span>เปิดให้บริการ</span>
                    </label>
                  </div>
                  {srv.IS_ACTIVE === "Y" && (
                    <div
                      style={{
                        display: "flex",
                        gap: "1.5rem",
                        marginTop: "0.5rem",
                        paddingLeft: "1rem",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={srv.IS_PICKUP_ENABLED === "Y"}
                          onChange={() =>
                            toggleShippingService(idx, "IS_PICKUP_ENABLED")
                          }
                        />
                        <span>รองรับ Pickup</span>
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={srv.IS_DROPOFF_ENABLED === "Y"}
                          onChange={() =>
                            toggleShippingService(idx, "IS_DROPOFF_ENABLED")
                          }
                        />
                        <span>รองรับ Dropoff</span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {shippingConfig && (
              <div
                style={{
                  marginTop: "2rem",
                  padding: "1rem",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              >
                <h3 style={{ marginTop: 0, color: "#334155" }}>
                  ℹ️ ข้อมูลราคาพื้นฐานจากระบบ
                </h3>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
                  <div style={{ flex: "1 1 300px" }}>
                    <h4>บริษัทขนส่ง (DVService)</h4>
                    <ul
                      style={{
                        paddingLeft: "1.2rem",
                        color: "#475569",
                        fontSize: "0.9rem",
                      }}
                    >
                      {shippingConfig.dvServices.map((s) => (
                        <li key={s.DVSERVICE_ID}>
                          {s.DVSERVICE_NAME} (เริ่มต้น: {s.DEFAULT_PRICE} บ.)
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ flex: "1 1 300px" }}>
                    <h4>ประเภทการขนส่ง (DVService Type)</h4>
                    <ul
                      style={{
                        paddingLeft: "1.2rem",
                        color: "#475569",
                        fontSize: "0.9rem",
                      }}
                    >
                      {shippingConfig.dvServiceTypes.map((s) => (
                        <li key={s.DVSERVICE_TYPE_ID}>
                          {s.TYPE_NAME} (เริ่มต้น: {s.DEFAULT_TYPE_PRICE} บ.)
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ flex: "1 1 300px" }}>
                    <h4>ค่าธรรมเนียมระยะทาง (Route Fee)</h4>
                    <ul
                      style={{
                        paddingLeft: "1.2rem",
                        color: "#475569",
                        fontSize: "0.9rem",
                      }}
                    >
                      {shippingConfig.routeFees.map((r) => (
                        <li key={r.ROUTE_ID}>
                          {r.DESCRIPTION} (+{r.EXTRA_FEE} บ.)
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ flex: "1 1 300px" }}>
                    <h4>Tier น้ำหนัก (Weight Tier)</h4>
                    <ul
                      style={{
                        paddingLeft: "1.2rem",
                        color: "#475569",
                        fontSize: "0.9rem",
                      }}
                    >
                      {shippingConfig.weightTiers.map((w) => (
                        <li key={w.WEIGHT_TIER_ID}>
                          {w.TIER_NAME} (+{w.DEFAULT_WEIGHT_PRICE} บ.)
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ flex: "1 1 300px" }}>
                    <h4>Tier ขนาด (Size Tier)</h4>
                    <ul
                      style={{
                        paddingLeft: "1.2rem",
                        color: "#475569",
                        fontSize: "0.9rem",
                      }}
                    >
                      {shippingConfig.sizeTiers.map((s) => (
                        <li key={s.SIZE_TIER_ID}>
                          {s.TIER_NAME} (+{s.DEFAULT_SIZE_PRICE} บ.)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
                marginTop: "2rem",
              }}
            >
              <button
                onClick={() => setShippingModalOpen(false)}
                style={{
                  padding: "0.6rem 1.2rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveShipping}
                style={{
                  padding: "0.6rem 1.2rem",
                  border: "none",
                  borderRadius: "8px",
                  background: "#2563eb",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        </div>
      )}

      {delayModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0 }}>⚙️ จัดการเวลาจัดส่ง</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>ระยะเวลาจัดส่งจำลอง (วินาที):</label>
              <input
                type="number"
                value={shippingDelaySec}
                onChange={e => setShippingDelaySec(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setDelayModalOpen(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '6px', cursor: 'pointer' }}>ยกเลิก</button>
              <button onClick={saveDelay} style={{ flex: 1, padding: '0.75rem', border: 'none', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Profile;
