import React, { useState, useEffect } from "react";
import { usePopup } from "../context/PopupContext";

const ShippingManager = () => {
  const { showAlert } = usePopup();

  const [sizeTiers, setSizeTiers] = useState([]);
  const [weightTiers, setWeightTiers] = useState([]);
  const [routeFees, setRouteFees] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [szRes, wtRes, rfRes] = await Promise.all([
        fetch("http://localhost:5000/api/admin/size-tiers"),
        fetch("http://localhost:5000/api/admin/weight-tiers"),
        fetch("http://localhost:5000/api/admin/route-fees"),
      ]);
      setSizeTiers(await szRes.json());
      setWeightTiers(await wtRes.json());
      setRouteFees(await rfRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const updateField = (setter, data, index, field, value) => {
    const newData = [...data];
    newData[index][field] = value;
    setter(newData);
  };

  const handleSaveSize = async (item) => {
    await fetch(
      `http://localhost:5000/api/admin/size-tiers/${item.SIZE_TIER_ID}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      },
    );
    showAlert("บันทึกข้อมูลระดับขนาดกล่องสำเร็จ");
  };

  const handleSaveWeight = async (item) => {
    await fetch(
      `http://localhost:5000/api/admin/weight-tiers/${item.WEIGHT_TIER_ID}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      },
    );
    showAlert("บันทึกข้อมูลระดับน้ำหนักสำเร็จ");
  };

  const handleSaveRoute = async (item) => {
    await fetch(`http://localhost:5000/api/admin/route-fees/${item.ROUTE_ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    showAlert("บันทึกข้อมูลค่าส่งตามเขตสำเร็จ");
  };

  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "var(--shadow-sm)",
    overflow: "hidden",
    marginBottom: "2.25rem",
  };

  const thStyle = {
    padding: "0.9rem 1.15rem",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "0.88rem",
    fontWeight: "700",
  };

  const tdStyle = {
    padding: "0.85rem 1.15rem",
    borderBottom: "1px solid #f1f5f9",
    color: "#1e293b",
    fontSize: "0.92rem",
  };

  const inputStyle = {
    padding: "0.45rem 0.7rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    width: "100%",
    boxSizing: "border-box",
  };

  const saveBtnStyle = {
    padding: "0.45rem 1rem",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "0.85rem",
    cursor: "pointer",
  };

  return (
    <div
      className="page-enter"
      style={{ padding: "2rem", maxWidth: "1020px", margin: "0 auto" }}
    >
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.4rem 0", color: "#0f172a" }}>
          ⚙️ จัดการระบบคำนวณค่าจัดส่ง
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
          ปรับแต่งเรทราคาที่ใช้ในการคำนวณค่าจัดส่งอัตโนมัติ (Tier-based
          Shipping)
        </p>
      </div>

      {/* 1. Size Tiers */}
      <section className="stagger-item" style={{ ...cardStyle, "--stagger-index": 0 }}>
        <div
          style={{
            padding: "1.1rem 1.25rem",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.15rem", color: "#0f172a" }}>
            📦 1. จัดการระดับขนาดกล่อง (Size Tiers)
          </h2>
        </div>
        <table
          style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
        >
          <thead>
            <tr>
              <th style={{ ...thStyle, width: "80px" }}>ID</th>
              <th style={thStyle}>ชื่อขนาด (Tier Name)</th>
              <th style={thStyle}>ต่ำสุด (ซม.)</th>
              <th style={thStyle}>สูงสุด (ซม.)</th>
              <th style={{ ...thStyle, width: "130px", textAlign: "center" }}>
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            {sizeTiers.map((t, i) => (
              <tr key={t.SIZE_TIER_ID}>
                <td style={{ ...tdStyle, fontWeight: "bold", color: "#64748b" }}>
                  #{t.SIZE_TIER_ID}
                </td>
                <td style={tdStyle}>
                  <input
                    className="form-input"
                    type="text"
                    style={inputStyle}
                    value={t.TIER_NAME || ""}
                    onChange={(e) =>
                      updateField(
                        setSizeTiers,
                        sizeTiers,
                        i,
                        "TIER_NAME",
                        e.target.value,
                      )
                    }
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    className="form-input"
                    type="number"
                    style={inputStyle}
                    value={t.MIN_SIZE || 0}
                    onChange={(e) =>
                      updateField(
                        setSizeTiers,
                        sizeTiers,
                        i,
                        "MIN_SIZE",
                        e.target.value,
                      )
                    }
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    className="form-input"
                    type="number"
                    style={inputStyle}
                    value={t.MAX_SIZE || 0}
                    onChange={(e) =>
                      updateField(
                        setSizeTiers,
                        sizeTiers,
                        i,
                        "MAX_SIZE",
                        e.target.value,
                      )
                    }
                  />
                </td>
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  <button
                    className="btn-interactive"
                    style={saveBtnStyle}
                    onClick={() => handleSaveSize(t)}
                  >
                    💾 บันทึก
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 2. Weight Tiers */}
      <section className="stagger-item" style={{ ...cardStyle, "--stagger-index": 1 }}>
        <div
          style={{
            padding: "1.1rem 1.25rem",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.15rem", color: "#0f172a" }}>
            ⚖️ 2. จัดการระดับน้ำหนัก (Weight Tiers)
          </h2>
        </div>
        <table
          style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
        >
          <thead>
            <tr>
              <th style={{ ...thStyle, width: "80px" }}>ID</th>
              <th style={thStyle}>ชื่อน้ำหนัก (Tier Name)</th>
              <th style={thStyle}>ต่ำสุด (กก.)</th>
              <th style={thStyle}>สูงสุด (กก.)</th>
              <th style={{ ...thStyle, width: "130px", textAlign: "center" }}>
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            {weightTiers.map((t, i) => (
              <tr key={t.WEIGHT_TIER_ID}>
                <td style={{ ...tdStyle, fontWeight: "bold", color: "#64748b" }}>
                  #{t.WEIGHT_TIER_ID}
                </td>
                <td style={tdStyle}>
                  <input
                    className="form-input"
                    type="text"
                    style={inputStyle}
                    value={t.TIER_NAME || ""}
                    onChange={(e) =>
                      updateField(
                        setWeightTiers,
                        weightTiers,
                        i,
                        "TIER_NAME",
                        e.target.value,
                      )
                    }
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    className="form-input"
                    type="number"
                    style={inputStyle}
                    value={t.MIN_WEIGHT || 0}
                    onChange={(e) =>
                      updateField(
                        setWeightTiers,
                        weightTiers,
                        i,
                        "MIN_WEIGHT",
                        e.target.value,
                      )
                    }
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    className="form-input"
                    type="number"
                    style={inputStyle}
                    value={t.MAX_WEIGHT || 0}
                    onChange={(e) =>
                      updateField(
                        setWeightTiers,
                        weightTiers,
                        i,
                        "MAX_WEIGHT",
                        e.target.value,
                      )
                    }
                  />
                </td>
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  <button
                    className="btn-interactive"
                    style={saveBtnStyle}
                    onClick={() => handleSaveWeight(t)}
                  >
                    💾 บันทึก
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 3. Route Fees */}
      <section className="stagger-item" style={{ ...cardStyle, "--stagger-index": 2 }}>
        <div
          style={{
            padding: "1.1rem 1.25rem",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.15rem", color: "#0f172a" }}>
            🗺️ 3. จัดการค่าส่งตามเขต (Static Route Fee)
          </h2>
        </div>
        <table
          style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
        >
          <thead>
            <tr>
              <th style={{ ...thStyle, width: "160px" }}>รหัส (Type)</th>
              <th style={thStyle}>คำอธิบาย</th>
              <th style={{ ...thStyle, width: "180px" }}>บวกเงินเพิ่ม (บาท)</th>
              <th style={{ ...thStyle, width: "130px", textAlign: "center" }}>
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            {routeFees.map((t, i) => (
              <tr key={t.ROUTE_ID}>
                <td style={tdStyle}>
                  <span
                    style={{
                      backgroundColor: "#eff6ff",
                      color: "#1d4ed8",
                      padding: "0.25rem 0.6rem",
                      borderRadius: "6px",
                      fontWeight: "700",
                      fontSize: "0.82rem",
                    }}
                  >
                    {t.ROUTE_TYPE}
                  </span>
                </td>
                <td style={tdStyle}>
                  <input
                    className="form-input"
                    type="text"
                    style={inputStyle}
                    value={t.DESCRIPTION || ""}
                    onChange={(e) =>
                      updateField(
                        setRouteFees,
                        routeFees,
                        i,
                        "DESCRIPTION",
                        e.target.value,
                      )
                    }
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    className="form-input"
                    type="number"
                    style={inputStyle}
                    value={t.EXTRA_FEE || 0}
                    onChange={(e) =>
                      updateField(
                        setRouteFees,
                        routeFees,
                        i,
                        "EXTRA_FEE",
                        e.target.value,
                      )
                    }
                  />
                </td>
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  <button
                    className="btn-interactive"
                    style={saveBtnStyle}
                    onClick={() => handleSaveRoute(t)}
                  >
                    💾 บันทึก
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default ShippingManager;
