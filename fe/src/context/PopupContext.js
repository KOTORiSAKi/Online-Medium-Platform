import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useTheme } from "./ThemeContext";

const PopupContext = createContext();

export const usePopup = () => useContext(PopupContext);

function inferToastType(message, explicitType) {
  if (explicitType && explicitType !== "info") return explicitType;
  const text = String(message || "");
  if (
    text.includes("ไม่สำเร็จ") ||
    text.includes("ผิดพลาด") ||
    text.includes("ไม่ได้") ||
    text.includes("ไม่ตอบสนอง") ||
    text.includes("❌") ||
    text.includes("⛔") ||
    text.toLowerCase().includes("error")
  ) {
    return "error";
  }
  if (
    text.includes("⚠️") ||
    text.includes("คำเตือน") ||
    text.includes("กรุณา") ||
    text.includes("ขออภัย")
  ) {
    return "warning";
  }
  if (
    text.includes("สำเร็จ") ||
    text.includes("เรียบร้อย") ||
    text.includes("ยินดีต้อนรับ") ||
    text.includes("ขอบคุณ")
  ) {
    return "success";
  }
  return "info";
}

const TOAST_THEMES = {
  success: {
    icon: "✅",
    accent: "#10b981",
    bgIcon: "#d1fae5",
    bgIconDark: "rgba(16, 185, 129, 0.2)",
    title: "สำเร็จ",
  },
  error: {
    icon: "❌",
    accent: "#ef4444",
    bgIcon: "#fee2e2",
    bgIconDark: "rgba(239, 68, 68, 0.2)",
    title: "เกิดข้อผิดพลาด",
  },
  warning: {
    icon: "⚠️",
    accent: "#f59e0b",
    bgIcon: "#fef3c7",
    bgIconDark: "rgba(245, 158, 11, 0.2)",
    title: "แจ้งเตือน",
  },
  info: {
    icon: "ℹ️",
    accent: "#3b82f6",
    bgIcon: "#dbeafe",
    bgIconDark: "rgba(59, 130, 246, 0.2)",
    title: "ข้อมูล",
  },
};

export const PopupProvider = ({ children }) => {
  const { isDark } = useTheme() || { isDark: false };
  const [toasts, setToasts] = useState([]);
  const [confirmQueue, setConfirmQueue] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isLeaving: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 240);
  }, []);

  const showAlert = useCallback(
    (message, type = "info") => {
      const id = Date.now() + Math.random();
      const resolvedType = inferToastType(message, type);
      setToasts((prev) => [
        ...prev,
        { id, message, type: resolvedType, isLeaving: false },
      ]);

      setTimeout(() => {
        dismissToast(id);
      }, 3200);
    },
    [dismissToast]
  );

  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      const id = Date.now() + Math.random();
      const handleClose = (result) => {
        setConfirmQueue((prev) => prev.filter((c) => c.id !== id));
        resolve(result);
      };

      setConfirmQueue((prev) => [
        ...prev,
        { id, message, onResolve: handleClose },
      ]);
    });
  }, []);

  const activeConfirm = confirmQueue[0] || null;

  useEffect(() => {
    if (!activeConfirm) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        activeConfirm.onResolve(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeConfirm]);

  const isDangerConfirm =
    activeConfirm &&
    (String(activeConfirm.message).includes("ลบ") ||
      String(activeConfirm.message).includes("ปลด") ||
      String(activeConfirm.message).includes("ปิดร้าน") ||
      String(activeConfirm.message).includes("🚨"));

  return (
    <PopupContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Centered Confirmation Modal */}
      {activeConfirm && (
        <div
          className="modal-backdrop"
          data-html2canvas-ignore="true"
          onClick={() => activeConfirm.onResolve(false)}
          style={{ zIndex: 10000 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "1.75rem",
              textAlign: "center",
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              borderColor: isDark ? "#334155" : "rgba(226, 232, 240, 0.9)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: isDangerConfirm
                  ? isDark
                    ? "rgba(239, 68, 68, 0.2)"
                    : "#fee2e2"
                  : isDark
                  ? "rgba(245, 158, 11, 0.2)"
                  : "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.65rem",
                margin: "0 auto 1rem auto",
                border: isDangerConfirm
                  ? isDark
                    ? "1.5px solid rgba(248, 113, 113, 0.45)"
                    : "1.5px solid #fca5a5"
                  : isDark
                  ? "1.5px solid rgba(251, 191, 36, 0.45)"
                  : "1.5px solid #fde68a",
              }}
            >
              {isDangerConfirm ? "🚨" : "❓"}
            </div>
            <h3
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "1.2rem",
                color: isDark ? "#f8fafc" : "#0f172a",
              }}
            >
              {isDangerConfirm ? "ยืนยันการดำเนินการสำคัญ" : "ยืนยันการทำรายการ"}
            </h3>
            <p
              style={{
                margin: "0 0 1.5rem 0",
                fontSize: "0.95rem",
                color: isDark ? "#cbd5e1" : "#475569",
                lineHeight: "1.55",
                whiteSpace: "pre-wrap",
              }}
            >
              {activeConfirm.message}
            </p>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                onClick={() => activeConfirm.onResolve(false)}
                className="btn-interactive"
                style={{
                  flex: 1,
                  padding: "0.65rem 1rem",
                  border: isDark ? "1px solid #475569" : "1px solid #cbd5e1",
                  borderRadius: "10px",
                  cursor: "pointer",
                  backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                  color: isDark ? "#e2e8f0" : "#334155",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => activeConfirm.onResolve(true)}
                className="btn-interactive"
                style={{
                  flex: 1,
                  padding: "0.65rem 1rem",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  backgroundColor: isDangerConfirm ? "#dc2626" : "#2563eb",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  boxShadow: isDangerConfirm
                    ? "0 4px 12px rgba(220, 38, 38, 0.28)"
                    : "0 4px 12px rgba(37, 99, 235, 0.28)",
                }}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stackable Toast Notifications */}
      <div
        data-html2canvas-ignore="true"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => {
          const theme = TOAST_THEMES[toast.type] || TOAST_THEMES.info;
          return (
            <div
              key={toast.id}
              style={{
                backgroundColor: isDark
                  ? "rgba(30, 41, 59, 0.96)"
                  : "rgba(255, 255, 255, 0.96)",
                backdropFilter: "blur(12px)",
                boxShadow: isDark
                  ? "0 12px 28px -5px rgba(0, 0, 0, 0.55), 0 4px 12px -2px rgba(0, 0, 0, 0.35)"
                  : "0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 4px 10px -2px rgba(15, 23, 42, 0.08)",
                borderRadius: "14px",
                padding: "14px 16px",
                minWidth: "290px",
                maxWidth: "390px",
                pointerEvents: "auto",
                animation: toast.isLeaving
                  ? "toastSlideOut 0.24s cubic-bezier(0.4, 0, 1, 1) forwards"
                  : "toastSlideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                borderLeft: `5px solid ${theme.accent}`,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: isDark ? theme.bgIconDark : theme.bgIcon,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  flexShrink: 0,
                }}
              >
                {theme.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    color: theme.accent,
                    marginBottom: "2px",
                  }}
                >
                  {theme.title}
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: isDark ? "#f1f5f9" : "#1e293b",
                    lineHeight: "1.45",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {toast.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: isDark ? "#94a3b8" : "#94a3b8",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  padding: "2px 4px",
                  borderRadius: "4px",
                  lineHeight: 1,
                }}
                title="ปิดแจ้งเตือน"
              >
                ✕
              </button>

              {/* Progress bar countdown */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: "3px",
                  backgroundColor: theme.accent,
                  opacity: 0.35,
                  animation: "toastProgress 3.2s linear forwards",
                }}
              />
            </div>
          );
        })}
      </div>

      <style>
        {`
          @keyframes toastSlideIn {
            0% { transform: translateX(115%) scale(0.95); opacity: 0; }
            100% { transform: translateX(0) scale(1); opacity: 1; }
          }
          @keyframes toastSlideOut {
            0% { transform: translateX(0) scale(1); opacity: 1; }
            100% { transform: translateX(115%) scale(0.95); opacity: 0; }
          }
          @keyframes toastProgress {
            0% { width: 100%; }
            100% { width: 0%; }
          }
        `}
      </style>
    </PopupContext.Provider>
  );
};
