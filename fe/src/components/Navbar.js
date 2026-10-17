import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import LiquidGlassCard from "../LiquidGlassCard";
import { useTheme } from "../context/ThemeContext";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchContainerRef = useRef(null);
  const { isDark, toggleTheme } = useTheme();

  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [badgeBump, setBadgeBump] = useState(false);

  const isHomePage = location.pathname === "/";

  const handleThemeToggle = (e) => {
    const btn = e.currentTarget;
    toggleTheme(e);
    if (btn && typeof btn.animate === "function") {
      btn.animate(
        [
          { transform: "scale(0.84) rotate(-22deg)" },
          { transform: "scale(1.12) rotate(10deg)", offset: 0.55 },
          { transform: "scale(1) rotate(0deg)" },
        ],
        {
          duration: 460,
          easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        }
      );
    }
  };

  // สเตทสำหรับระบบค้นหา
  const queryParam = searchParams.get("q") || "";
  const [searchText, setSearchText] = useState(queryParam);
  const [isFocused, setIsFocused] = useState(false);
  const [allProducts, setAllProducts] = useState([]);

  // ซิงก์ค่าช่องค้นหากับ URL query param
  useEffect(() => {
    setSearchText(queryParam);
  }, [queryParam]);

  // ดึงรายการสินค้าสำหรับ Suggest Box
  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAllProducts(data);
      })
      .catch(console.error);
  }, [location.pathname]);

  // ดักจับการคลิกนอกพื้นที่ Suggest Box เพื่อปิด Suggestion
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ดึงจำนวนสินค้าในตะกร้า
  const fetchCartCount = useCallback((acId) => {
    if (!acId) {
      setCartCount(0);
      return;
    }
    fetch(`http://localhost:5000/api/cart/${acId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const totalItems = data.reduce(
            (sum, item) => sum + (Number(item.QUANTITY) || 1),
            0
          );
          setCartCount((prev) => {
            if (prev !== totalItems && totalItems > 0) {
              setBadgeBump(true);
              setTimeout(() => setBadgeBump(false), 350);
            }
            return totalItems;
          });
        }
      })
      .catch(() => {});
  }, []);

  // ดักจับการเข้าสู่ระบบของผู้ใช้ และอัปเดตตะกร้า
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const parsed = storedUser ? JSON.parse(storedUser) : null;
      setUser(parsed);
      fetchCartCount(parsed?.AC_ID);
    } catch (e) {
      setUser(null);
      setCartCount(0);
    }
  }, [location, fetchCartCount]);

  useEffect(() => {
    const handleCartUpdated = () => {
      try {
        const storedUser = localStorage.getItem("user");
        const parsed = storedUser ? JSON.parse(storedUser) : null;
        fetchCartCount(parsed?.AC_ID);
      } catch (e) {}
    };
    window.addEventListener("cart-updated", handleCartUpdated);
    return () => window.removeEventListener("cart-updated", handleCartUpdated);
  }, [fetchCartCount]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setCartCount(0);
    navigate("/login");
  };

  // ฟังก์ชันการค้นหา
  const handleSearchChange = (val) => {
    setSearchText(val);
    if (isHomePage) {
      if (val.trim()) {
        setSearchParams({ q: val }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }
  };

  const handleClearSearch = () => {
    setSearchText("");
    if (isHomePage) {
      setSearchParams({}, { replace: true });
    }
    setIsFocused(false);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const q = searchText.trim();
    if (q) {
      if (isHomePage) {
        setSearchParams({ q }, { replace: true });
      } else {
        navigate(`/?q=${encodeURIComponent(q)}`);
      }
    } else if (isHomePage) {
      setSearchParams({}, { replace: true });
    }
    setIsFocused(false);
  };

  const handleSelectSuggestion = (term) => {
    setSearchText(term);
    if (isHomePage) {
      setSearchParams({ q: term }, { replace: true });
    } else {
      navigate(`/?q=${encodeURIComponent(term)}`);
    }
    setIsFocused(false);
  };

  const handleSelectProduct = (productId) => {
    setIsFocused(false);
    navigate(`/product/${productId}`);
  };

  // ประมวลผล Suggestions จากชื่อสินค้า, Type, และชื่อร้านค้า
  const trimmed = searchText.trim().toLowerCase();

  const matchedCategories = trimmed
    ? Array.from(
        new Set(
          allProducts
            .filter((p) => p.TYPE && p.TYPE.toLowerCase().includes(trimmed))
            .map((p) => p.TYPE)
        )
      )
    : [];

  const matchedStores = trimmed
    ? Array.from(
        new Set(
          allProducts
            .filter(
              (p) => p.ST_NAME && p.ST_NAME.toLowerCase().includes(trimmed)
            )
            .map((p) => p.ST_NAME)
        )
      )
    : [];

  const matchedProducts = trimmed
    ? allProducts.filter(
        (p) =>
          (p.PRODUCT_NAME && p.PRODUCT_NAME.toLowerCase().includes(trimmed)) ||
          (p.TYPE && p.TYPE.toLowerCase().includes(trimmed)) ||
          (p.ST_NAME && p.ST_NAME.toLowerCase().includes(trimmed))
      )
    : [];

  const suggestItemBg = isDark
    ? "rgba(15, 23, 42, 0.65)"
    : "rgba(255, 255, 255, 0.55)";
  const suggestItemHoverBg = isDark
    ? "rgba(30, 41, 59, 0.94)"
    : "rgba(255, 255, 255, 0.92)";

  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive
      ? isDark
        ? "#f8fafc"
        : "#0f172a"
      : isDark
      ? "#cbd5e1"
      : "#64748b",
    fontWeight: isActive ? "700" : "500",
    padding: "0.45rem 0.85rem",
    borderRadius: "9999px",
    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    backgroundColor: isActive
      ? isDark
        ? "rgba(59, 130, 246, 0.24)"
        : "rgba(255, 255, 255, 0.65)"
      : "transparent",
    boxShadow: isActive
      ? isDark
        ? "0 2px 10px rgba(59, 130, 246, 0.22), inset 0 0 0 1px rgba(147, 197, 253, 0.3)"
        : "0 2px 8px rgba(15, 23, 42, 0.08)"
      : "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.9rem",
  });

  return (
    <div
      data-html2canvas-ignore="true"
      style={{
        position: "fixed",
        top: "1.25rem",
        left: "50%",
        transform: "translateX(-50%)",
        width: "92%",
        maxWidth: "1080px",
        height: "64px",
        zIndex: 1000,
        transition: "max-width 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <LiquidGlassCard
        borderRadius={32}
        progress={0}
        blurAmount={14}
        ignoreCapture={true}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "32px",
          boxShadow: isDark
            ? "0 8px 24px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.3)"
            : "0 4px 12px rgba(15, 23, 42, 0.06), 0 12px 28px rgba(15, 23, 42, 0.12)",
          border: isDark
            ? "1px solid rgba(148, 163, 184, 0.24)"
            : "1px solid rgba(255, 255, 255, 0.55)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 1rem 0 1.4rem",
            height: "100%",
            gap: "0.85rem",
          }}
        >
          {/* โลโก้ */}
          <Link
            to="/"
            onClick={() => {
              if (isHomePage) setSearchParams({});
            }}
            style={{
              fontSize: "1.18rem",
              fontWeight: "800",
              textDecoration: "none",
              color: isDark ? "#f8fafc" : "#0f172a",
              marginRight: "0.2rem",
              whiteSpace: "nowrap",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              letterSpacing: "-0.02em",
              transition: "color 0.2s ease",
            }}
          >
            <span style={{ fontSize: "1.35rem" }}>🛍️</span>
            <span>OnlinePlatform</span>
          </Link>

          {/* กล่อง Search Engine: ค้นหาได้จากทุกหน้า */}
          <div
            ref={searchContainerRef}
            style={{
              position: "relative",
              flex: 1,
              maxWidth: "410px",
            }}
          >
            <form
              onSubmit={handleSearchSubmit}
              style={{
                position: "relative",
                width: "100%",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: "13px",
                  fontSize: "0.9rem",
                  color: isFocused
                    ? isDark
                      ? "#60a5fa"
                      : "#2563eb"
                    : isDark
                    ? "#94a3b8"
                    : "#64748b",
                  pointerEvents: "none",
                  transition: "color 0.2s ease",
                }}
              >
                🔍
              </span>
              <input
                type="text"
                className="navbar-search-input"
                placeholder="ค้นหาชื่อสินค้า, หมวดหมู่, ร้านค้า..."
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                style={{
                  width: "100%",
                  padding: "0.52rem 2.2rem 0.52rem 2.35rem",
                  borderRadius: "9999px",
                  border: isFocused
                    ? isDark
                      ? "1.5px solid #60a5fa"
                      : "1.5px solid #2563eb"
                    : isDark
                    ? "1px solid rgba(148, 163, 184, 0.28)"
                    : "1px solid rgba(15, 23, 42, 0.12)",
                  backgroundColor: isFocused
                    ? isDark
                      ? "rgba(15, 23, 42, 0.85)"
                      : "rgba(255, 255, 255, 0.85)"
                    : isDark
                    ? "rgba(15, 23, 42, 0.55)"
                    : "rgba(255, 255, 255, 0.55)",
                  backdropFilter: "blur(8px)",
                  fontSize: "0.86rem",
                  outline: "none",
                  transition: "all 0.22s ease",
                  boxShadow: isFocused
                    ? isDark
                      ? "0 0 0 3.5px rgba(96, 165, 250, 0.22)"
                      : "0 0 0 3.5px rgba(37, 99, 235, 0.16)"
                    : "0 1px 3px rgba(0, 0, 0, 0.04)",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  boxSizing: "border-box",
                }}
              />
              {searchText && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    position: "absolute",
                    right: "8px",
                    background: isDark
                      ? "rgba(148, 163, 184, 0.22)"
                      : "rgba(100, 116, 139, 0.12)",
                    border: "none",
                    color: isDark ? "#e2e8f0" : "#475569",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    width: "22px",
                    height: "22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    transition: "background-color 0.15s ease",
                  }}
                  title="ล้างคำค้นหา"
                >
                  ✕
                </button>
              )}
            </form>

            {/* Suggest Box ใช้ LiquidGlassCard อัตโนมัติพร้อม Animation */}
            {isFocused && searchText.trim().length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 12px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "100%",
                  minWidth: "380px",
                  maxWidth: "460px",
                  zIndex: 1001,
                  animation:
                    "dropdownSlideDown 0.24s cubic-bezier(0.16, 1, 0.3, 1) both",
                }}
              >
                <LiquidGlassCard
                  borderRadius={20}
                  progress={0}
                  blurAmount={16}
                  ignoreCapture={true}
                  style={{
                    width: "100%",
                    borderRadius: "20px",
                    boxShadow: isDark
                      ? "0 22px 44px rgba(0, 0, 0, 0.55)"
                      : "0 20px 40px rgba(15, 23, 42, 0.22)",
                    border: isDark
                      ? "1px solid rgba(148, 163, 184, 0.28)"
                      : "1px solid rgba(255, 255, 255, 0.65)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "0.85rem",
                      maxHeight: "380px",
                      overflowY: "auto",
                      color: isDark ? "#f1f5f9" : "#1e293b",
                    }}
                  >
                    {/* 1. แสดงหมวดหมู่สินค้าที่ตรงกัน */}
                    {matchedCategories.length > 0 && (
                      <div style={{ marginBottom: "0.75rem" }}>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            color: isDark ? "#94a3b8" : "#64748b",
                            marginBottom: "0.35rem",
                            paddingLeft: "0.4rem",
                          }}
                        >
                          🏷️ หมวดหมู่สินค้า
                        </div>
                        {matchedCategories.map((cat) => (
                          <div
                            key={cat}
                            onClick={() => handleSelectSuggestion(cat)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0.45rem 0.75rem",
                              borderRadius: "10px",
                              cursor: "pointer",
                              backgroundColor: suggestItemBg,
                              marginBottom: "0.25rem",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                suggestItemHoverBg;
                              e.currentTarget.style.transform =
                                "translateX(3px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                suggestItemBg;
                              e.currentTarget.style.transform = "translateX(0)";
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: "bold",
                                color: isDark ? "#f1f5f9" : "#1e293b",
                              }}
                            >
                              {cat}
                            </span>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: isDark ? "#60a5fa" : "#2563eb",
                                fontWeight: "600",
                              }}
                            >
                              กรองหมวดหมู่นี้ →
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 2. แสดงชื่อร้านค้าที่ตรงกัน */}
                    {matchedStores.length > 0 && (
                      <div style={{ marginBottom: "0.75rem" }}>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            color: isDark ? "#94a3b8" : "#64748b",
                            marginBottom: "0.35rem",
                            paddingLeft: "0.4rem",
                          }}
                        >
                          🏪 ร้านค้า
                        </div>
                        {matchedStores.map((st) => (
                          <div
                            key={st}
                            onClick={() => handleSelectSuggestion(st)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0.45rem 0.75rem",
                              borderRadius: "10px",
                              cursor: "pointer",
                              backgroundColor: suggestItemBg,
                              marginBottom: "0.25rem",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                suggestItemHoverBg;
                              e.currentTarget.style.transform =
                                "translateX(3px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                suggestItemBg;
                              e.currentTarget.style.transform = "translateX(0)";
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: "bold",
                                color: isDark ? "#f1f5f9" : "#1e293b",
                              }}
                            >
                              {st}
                            </span>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: isDark ? "#34d399" : "#059669",
                                fontWeight: "600",
                              }}
                            >
                              กรองร้านค้านี้ →
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 3. แสดงสินค้าที่ตรงกัน */}
                    {matchedProducts.length > 0 && (
                      <div style={{ marginBottom: "0.5rem" }}>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            color: isDark ? "#94a3b8" : "#64748b",
                            marginBottom: "0.35rem",
                            paddingLeft: "0.4rem",
                          }}
                        >
                          📦 สินค้าที่ตรงกัน ({matchedProducts.length} ชิ้น)
                        </div>
                        {matchedProducts.slice(0, 5).map((item) => (
                          <div
                            key={item.PRODUCT_ID}
                            onClick={() =>
                              handleSelectProduct(item.PRODUCT_ID)
                            }
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.7rem",
                              padding: "0.45rem 0.6rem",
                              borderRadius: "10px",
                              cursor: "pointer",
                              backgroundColor: suggestItemBg,
                              marginBottom: "0.3rem",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                suggestItemHoverBg;
                              e.currentTarget.style.transform =
                                "translateX(3px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                suggestItemBg;
                              e.currentTarget.style.transform = "translateX(0)";
                            }}
                          >
                            <img
                              src={
                                item.IMAGE_URL ||
                                `https://placehold.co/40x40?text=${encodeURIComponent(
                                  item.PRODUCT_NAME
                                )}`
                              }
                              alt={item.PRODUCT_NAME}
                              style={{
                                width: "38px",
                                height: "38px",
                                objectFit: "cover",
                                borderRadius: "8px",
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  fontWeight: "bold",
                                  color: isDark ? "#f8fafc" : "#0f172a",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {item.PRODUCT_NAME}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.72rem",
                                  color: isDark ? "#94a3b8" : "#64748b",
                                }}
                              >
                                {item.TYPE} • {item.ST_NAME}
                              </div>
                            </div>
                            <div
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: "bold",
                                color: isDark ? "#34d399" : "#059669",
                                flexShrink: 0,
                              }}
                            >
                              ฿
                              {item.PRODUCT_PRICE
                                ? item.PRODUCT_PRICE.toLocaleString()
                                : 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 4. สรุปผลลัพธ์ หรือแจ้งเตือนเมื่อไม่พบ */}
                    {matchedProducts.length > 0 ? (
                      <div
                        onClick={handleSearchSubmit}
                        style={{
                          marginTop: "0.5rem",
                          padding: "0.55rem",
                          borderRadius: "10px",
                          textAlign: "center",
                          fontSize: "0.82rem",
                          fontWeight: "bold",
                          color: isDark ? "#93c5fd" : "#1d4ed8",
                          backgroundColor: isDark
                            ? "rgba(59, 130, 246, 0.22)"
                            : "rgba(37, 99, 235, 0.14)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = isDark
                            ? "rgba(59, 130, 246, 0.35)"
                            : "rgba(37, 99, 235, 0.24)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = isDark
                            ? "rgba(59, 130, 246, 0.22)"
                            : "rgba(37, 99, 235, 0.14)")
                        }
                      >
                        🔍 ดูผลลัพธ์ทั้งหมดสำหรับ "{searchText}" (
                        {matchedProducts.length} รายการ)
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "1.25rem 0.5rem",
                          textAlign: "center",
                          color: isDark ? "#94a3b8" : "#64748b",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "1.6rem",
                            marginBottom: "0.35rem",
                          }}
                        >
                          🔍
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "bold",
                            color: isDark ? "#e2e8f0" : "#334155",
                          }}
                        >
                          ไม่พบสินค้า หมวดหมู่ หรือร้านค้าที่ตรงกับ "
                          {searchText}"
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            marginTop: "0.25rem",
                          }}
                        >
                          ลองค้นหาด้วยคำค้นอื่น
                        </div>
                      </div>
                    )}
                  </div>
                </LiquidGlassCard>
              </div>
            )}
          </div>

          {/* เมนูนำทางขวา */}
          <div
            style={{
              display: "flex",
              gap: "0.3rem",
              alignItems: "center",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <NavLink to="/" style={linkStyle}>
              หน้าแรก
            </NavLink>
            <NavLink to="/market" style={linkStyle}>
              <span>การสั่งซื้อ</span>
              {cartCount > 0 && (
                <span
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontSize: "0.72rem",
                    fontWeight: "800",
                    minWidth: "20px",
                    height: "20px",
                    padding: "0 6px",
                    borderRadius: "9999px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(37, 99, 235, 0.35)",
                    animation: badgeBump
                      ? "badgePop 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
                      : "none",
                  }}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/profile" style={linkStyle}>
              โปรไฟล์
            </NavLink>

            {/* ปุ่มสลับธีม Light / Dark Mode พร้อม Animation และการขยายวงกลมจากปุ่ม */}
            <button
              type="button"
              onClick={handleThemeToggle}
              className="theme-toggle-btn"
              aria-label={
                isDark
                  ? "สลับเป็นโหมดสว่าง (Light Mode)"
                  : "สลับเป็นโหมดมืด (Dark Mode)"
              }
              title={
                isDark
                  ? "โหมดมืด (คลิกเพื่อสลับเป็นโหมดสว่าง)"
                  : "โหมดสว่าง (คลิกเพื่อสลับเป็นโหมดมืด)"
              }
              style={{
                position: "relative",
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                border: isDark
                  ? "1px solid rgba(147, 197, 253, 0.35)"
                  : "1px solid rgba(15, 23, 42, 0.14)",
                backgroundColor: isDark
                  ? "rgba(30, 41, 59, 0.78)"
                  : "rgba(255, 255, 255, 0.72)",
                color: isDark ? "#fde047" : "#f59e0b",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                marginLeft: "0.2rem",
                overflow: "hidden",
                contain: "layout style paint",
                willChange: "transform",
                boxShadow: isDark
                  ? "0 2px 10px rgba(59, 130, 246, 0.25), inset 0 0 8px rgba(96, 165, 250, 0.18)"
                  : "0 2px 8px rgba(245, 158, 11, 0.18), inset 0 0 6px rgba(255, 255, 255, 0.8)",
                transition:
                  "transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {/* ไอคอนพระอาทิตย์ (Light Mode) */}
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  willChange: "transform, opacity",
                  transition:
                    "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.28s ease",
                  transform: isDark
                    ? "rotate(110deg) scale(0)"
                    : "rotate(0deg) scale(1)",
                  opacity: isDark ? 0 : 1,
                }}
              >
                <circle cx="12" cy="12" r="4.5" fill="rgba(251, 191, 36, 0.28)" />
                <line x1="12" y1="2" x2="12" y2="4.2" />
                <line x1="12" y1="19.8" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="6.48" y2="6.48" />
                <line x1="17.52" y1="17.52" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="4.2" y2="12" />
                <line x1="19.8" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="6.48" y2="17.52" />
                <line x1="17.52" y1="6.48" x2="19.07" y2="4.93" />
              </svg>

              {/* ไอคอนพระจันทร์เสี้ยวและดวงดาว (Dark Mode) */}
              <svg
                viewBox="0 0 24 24"
                width="19"
                height="19"
                fill="rgba(96, 165, 250, 0.32)"
                stroke="#93c5fd"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  willChange: "transform, opacity",
                  transition:
                    "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.28s ease",
                  transform: isDark
                    ? "rotate(0deg) scale(1)"
                    : "rotate(-110deg) scale(0)",
                  opacity: isDark ? 1 : 0,
                }}
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                <circle cx="18.5" cy="5.5" r="0.9" fill="#fde047" stroke="none" />
                <circle cx="15" cy="3.5" r="0.65" fill="#bae6fd" stroke="none" />
              </svg>
            </button>

            {user ? (
              <button
                onClick={handleLogout}
                className="btn-interactive"
                style={{
                  border: "none",
                  cursor: "pointer",
                  color: "#ffffff",
                  backgroundColor: "#ef4444",
                  padding: "0.48rem 1.1rem",
                  borderRadius: "9999px",
                  fontSize: "0.88rem",
                  fontWeight: "bold",
                  marginLeft: "0.25rem",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.28)",
                }}
              >
                ออกจากระบบ
              </button>
            ) : (
              <NavLink
                to="/login"
                className="btn-interactive"
                style={{
                  textDecoration: "none",
                  color: "#ffffff",
                  backgroundColor: "#2563eb",
                  padding: "0.48rem 1.1rem",
                  borderRadius: "9999px",
                  fontSize: "0.88rem",
                  fontWeight: "bold",
                  marginLeft: "0.25rem",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.28)",
                }}
              >
                เข้าสู่ระบบ
              </NavLink>
            )}
          </div>
        </div>
      </LiquidGlassCard>
    </div>
  );
}

export default Navbar;