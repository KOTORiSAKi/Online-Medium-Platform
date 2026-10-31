import React from "react";
import { Link, useNavigate } from "react-router-dom";
import LiquidGlassCard from "../LiquidGlassCard";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="page-enter"
      style={{
        padding: "4rem 1.5rem",
        maxWidth: "560px",
        margin: "2rem auto",
        textAlign: "center",
      }}
    >
      <LiquidGlassCard
        borderRadius={26}
        blurAmount={14}
        bevelRatio={0.18}
        className="liquid-glass-surface"
        style={{
          display: "block",
          width: "100%",
        }}
      >
        <div style={{ padding: "3rem 2rem" }}>
          <div
            style={{
              fontSize: "4.2rem",
              fontWeight: "900",
              background:
                "linear-gradient(135deg var(--in-oklab), #2563eb, #7c3aed)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.1,
              marginBottom: "0.75rem",
            }}
          >
            404
          </div>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🧭</div>
          <h2
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "1.45rem",
              color: "#0f172a",
            }}
          >
            ไม่พบหน้าที่คุณกำลังค้นหา
          </h2>
          <p
            style={{
              color: "#64748b",
              fontSize: "0.95rem",
              margin: "0 0 2rem 0",
              lineHeight: 1.6,
            }}
          >
            ลิงก์ที่คุณเข้าถึงอาจถูกย้าย ลบออก หรือพิมพ์ที่อยู่ URL ไม่ถูกต้อง
          </p>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-interactive glass-subtle"
              style={{
                padding: "0.65rem 1.35rem",
                color: "#334155",
                borderRadius: "10px",
                fontWeight: "600",
                fontSize: "0.92rem",
                cursor: "pointer",
              }}
            >
              ← ย้อนกลับ
            </button>
            <Link
              to="/"
              className="btn-interactive"
              style={{
                padding: "0.65rem 1.5rem",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "700",
                fontSize: "0.92rem",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.28)",
              }}
            >
              🏠 กลับสู่หน้าแรก
            </Link>
          </div>
        </div>
      </LiquidGlassCard>
    </div>
  );
}

export default NotFound;

