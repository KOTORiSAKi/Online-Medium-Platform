import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import LiquidGlassCard from '../LiquidGlassCard';
import html2canvas from 'html2canvas';

function Navbar() {
  const fullPageCanvasRef = useRef(null);
  const viewportCanvasRef = useRef(document.createElement('canvas'));
  const currentBgColorRef = useRef('#f4f6f8');
  const isCapturing = useRef(false);
  const location = useLocation(); // ไว้ดักจับเวลาเปลี่ยนหน้าเว็บ (Routing)
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchContainerRef = useRef(null);

  const [user, setUser] = useState(null);

  // ตรวจสอบว่าอยู่หน้า Home หรือไม่
  const isHomePage = location.pathname === '/';

  // สเตทสำหรับระบบค้นหา
  const queryParam = searchParams.get('q') || '';
  const [searchText, setSearchText] = useState(queryParam);
  const [isFocused, setIsFocused] = useState(false);
  const [allProducts, setAllProducts] = useState([]);

  // ซิงก์ค่าช่องค้นหากับ URL query param
  useEffect(() => {
    setSearchText(queryParam);
  }, [queryParam]);

  // ดึงรายการสินค้าทั้งหมดมาเตรียมไว้สำหรับ Suggest Box เมื่ออยู่หน้า Home
  useEffect(() => {
    if (isHomePage) {
      fetch("http://localhost:5000/api/products")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setAllProducts(data);
        })
        .catch(console.error);
    }
  }, [isHomePage]);

  // ดักจับการคลิกนอกพื้นที่ Suggest Box เพื่อปิด Suggestion
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ดักจับการเข้าสู่ระบบของผู้ใช้
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    } catch (e) {
      setUser(null);
    }
  }, [location]);

  // Logic Liquid Glass: แคปทั้งหน้าและคัดลอกส่วน Viewport มาเรนเดอร์ใน Shader
  useEffect(() => {
    let isActive = true;
    let resizeTimer;
    const scale = 0.5;

    // ฟังก์ชันดึงสีพื้นหลังปัจจุบันของหน้าเว็บ (รองรับ Theme Switcher ในอนาคต)
    const getWebBackgroundColor = () => {
      try {
        const candidates = [
          document.querySelector('.App'),
          document.body,
          document.documentElement,
        ];
        for (const el of candidates) {
          if (!el) continue;
          const bg = window.getComputedStyle(el).backgroundColor;
          if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
            return bg;
          }
        }
      } catch (e) { }
      return '#f4f6f8';
    };

    const updateCurrentBgColor = () => {
      const bg = getWebBackgroundColor();
      currentBgColorRef.current = bg;
      return bg;
    };

    // อัปเดตสีพื้นหลังปัจจุบันทันที
    updateCurrentBgColor();

    // เริ่มต้น Canvas ของ Viewport ทันทีโดยไม่ต้องรอ html2canvas
    // เพื่อให้เวลากดโหลดเว็บครั้งแรก Navbar จะได้สีเดียวกับ Background (ไม่เป็นกล่องดำ)
    const vwInit = Math.max(1, Math.floor(window.innerWidth * scale));
    const vhInit = Math.max(1, Math.floor(window.innerHeight * scale));
    viewportCanvasRef.current.width = vwInit;
    viewportCanvasRef.current.height = vhInit;
    const initCtx = viewportCanvasRef.current.getContext('2d', { alpha: false });
    if (initCtx) {
      initCtx.fillStyle = currentBgColorRef.current;
      initCtx.fillRect(0, 0, vwInit, vhInit);
    }

    const captureFullPage = async () => {
      if (isCapturing.current) return;
      isCapturing.current = true;
      try {
        const canvas = await html2canvas(document.body, {
          useCORS: true,
          scale: scale,
          logging: false,
        });
        if (isActive) {
          fullPageCanvasRef.current = canvas;
        }
      } catch (err) {
        console.error("Full page capture failed", err);
      } finally {
        isCapturing.current = false;
      }
    };

    // แคปทันทีที่โหลด หรือเมื่อเปลี่ยนหน้าเว็บผ่าน React Router
    captureFullPage();

    // ดักจับ Event พิเศษที่ส่งมาจากหน้าอื่นๆ (เช่น กดเปิด Modal, โหลดสินค้าใหม่เสร็จ, หรือเปลี่ยน Theme)
    const handleManualUpdate = () => {
      updateCurrentBgColor();
      clearTimeout(resizeTimer);
      captureFullPage();
    };
    window.addEventListener('update-glass', handleManualUpdate);
    window.addEventListener('theme-change', handleManualUpdate);

    // ดักจับการเปลี่ยนแปลง Theme (เช่น การสลับคลาส dark/light หรือ style ใน html / body / .App)
    const themeObserver = new MutationObserver(() => {
      updateCurrentBgColor();
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(captureFullPage, 50);
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme'],
    });
    if (document.body) {
      themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-theme'],
      });
    }
    const appEl = document.querySelector('.App');
    if (appEl) {
      themeObserver.observe(appEl, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-theme'],
      });
    }

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      // ลดเวลาหน่วงลงเหลือ 150ms เพื่อให้แคปตามได้ไวขึ้นเมื่อหน้าเว็บยืดออก
      resizeTimer = setTimeout(captureFullPage, 150);
    });
    resizeObserver.observe(document.body);

    const renderLoop = () => {
      if (!isActive) return;

      const vw = Math.max(1, Math.floor(window.innerWidth * scale));
      const vh = Math.max(1, Math.floor(window.innerHeight * scale));

      if (viewportCanvasRef.current.width !== vw || viewportCanvasRef.current.height !== vh) {
        viewportCanvasRef.current.width = vw;
        viewportCanvasRef.current.height = vh;
      }

      const ctx = viewportCanvasRef.current.getContext('2d', { alpha: false });
      if (ctx) {
        // ถมสีพื้นหลังไว้ก่อนเสมอ (ดึงจาก currentBgColorRef)
        // ช่วยแก้ปัญหา "กล่องดำ" ระหว่างรอ Render และตอนเลื่อนจอลงเร็วๆ แล้วหลุดขอบภาพที่แคปไว้
        ctx.fillStyle = currentBgColorRef.current || "#f4f6f8";
        ctx.fillRect(0, 0, vw, vh);

        if (fullPageCanvasRef.current) {
          const sy = window.scrollY * scale;
          const sx = window.scrollX * scale;
          ctx.drawImage(
            fullPageCanvasRef.current,
            sx, sy, vw, vh,
            0, 0, vw, vh
          );
        }
      }

      requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      isActive = false;
      resizeObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener('update-glass', handleManualUpdate);
      window.removeEventListener('theme-change', handleManualUpdate);
      clearTimeout(resizeTimer);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  // ฟังก์ชันการค้นหา
  const handleSearchChange = (val) => {
    setSearchText(val);
    if (val.trim()) {
      setSearchParams({ q: val }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleClearSearch = () => {
    setSearchText('');
    setSearchParams({}, { replace: true });
    setIsFocused(false);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchText.trim()) {
      setSearchParams({ q: searchText.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
    setIsFocused(false);
  };

  const handleSelectSuggestion = (term) => {
    setSearchText(term);
    setSearchParams({ q: term }, { replace: true });
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
          .filter((p) => p.ST_NAME && p.ST_NAME.toLowerCase().includes(trimmed))
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

  const linkStyle = ({ isActive }) => ({
    textDecoration: 'none',
    color: isActive ? '#000000' : '#828891',
    fontWeight: isActive ? 'bold' : '500',
    padding: '0.4rem 0.8rem',
    borderRadius: '9999px',
    transition: 'all 0.3s ease',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
  });

  return (
    <div
      data-html2canvas-ignore="true"
      style={{
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '92%',
        maxWidth: isHomePage ? '1040px' : '900px',
        height: '64px',
        zIndex: 1000,
        transition: 'max-width 0.3s ease',
      }}
    >
      <LiquidGlassCard
        borderRadius={32}
        progress={0}
        dynamicBgSource={viewportCanvasRef.current}
        fallbackBgColor={currentBgColorRef.current}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '32px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 1rem 0 1.5rem',
            height: '100%',
            gap: '1rem',
          }}
        >
          {/* โลโก้ */}
          <Link
            to="/"
            onClick={() => {
              if (isHomePage) setSearchParams({});
            }}
            style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              textDecoration: 'none',
              color: '#000000',
              marginRight: '0.5rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            🛍️ OnlinePlatform
          </Link>

          {/* กล่อง Search Engine: แสดงเฉพาะเมื่ออยู่หน้า Home */}
          {isHomePage && (
            <div
              ref={searchContainerRef}
              style={{
                position: 'relative',
                flex: 1,
                maxWidth: '400px',
              }}
            >
              <form
                onSubmit={handleSearchSubmit}
                style={{
                  position: 'relative',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    fontSize: '0.9rem',
                    color: '#64748b',
                    pointerEvents: 'none',
                  }}
                >
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อสินค้า, หมวดหมู่, ร้านค้า..."
                  value={searchText}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 2.2rem 0.5rem 2.3rem',
                    borderRadius: '9999px',
                    border: isFocused
                      ? '1.5px solid #2563eb'
                      : '1px solid rgba(0, 0, 0, 0.12)',
                    backgroundColor: 'rgba(255, 255, 255, 0.55)',
                    backdropFilter: 'blur(8px)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: isFocused
                      ? '0 0 0 3px rgba(37, 99, 235, 0.15)'
                      : '0 1px 3px rgba(0, 0, 0, 0.04)',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                  }}
                />
                {searchText && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      padding: '2px 6px',
                      borderRadius: '50%',
                    }}
                    title="ล้างคำค้นหา"
                  >
                    ✕
                  </button>
                )}
              </form>

              {/* Suggest Box ใช้ LiquidGlassCard ร่วมกับ viewportCanvasRef ของ Navbar */}
              {isFocused && searchText.trim().length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    minWidth: '380px',
                    maxWidth: '460px',
                    zIndex: 1001,
                  }}
                >
                  <LiquidGlassCard
                    borderRadius={20}
                    progress={0}
                    dynamicBgSource={viewportCanvasRef.current}
                    fallbackBgColor={currentBgColorRef.current}
                    style={{
                      width: '100%',
                      borderRadius: '20px',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '0.85rem',
                        maxHeight: '380px',
                        overflowY: 'auto',
                        color: '#1e293b',
                      }}
                    >
                      {/* 1. แสดงหมวดหมู่สินค้าที่ตรงกัน */}
                      {matchedCategories.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              color: '#64748b',
                              marginBottom: '0.35rem',
                              paddingLeft: '0.4rem',
                            }}
                          >
                            🏷️ หมวดหมู่สินค้า
                          </div>
                          {matchedCategories.map((cat) => (
                            <div
                              key={cat}
                              onClick={() => handleSelectSuggestion(cat)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.45rem 0.75rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: 'rgba(255, 255, 255, 0.45)',
                                marginBottom: '0.25rem',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                'rgba(255, 255, 255, 0.85)')
                              }
                              onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                'rgba(255, 255, 255, 0.45)')
                              }
                            >
                              <span
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 'bold',
                                  color: '#1e293b',
                                }}
                              >
                                {cat}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: '#2563eb',
                                  fontWeight: '500',
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
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              color: '#64748b',
                              marginBottom: '0.35rem',
                              paddingLeft: '0.4rem',
                            }}
                          >
                            🏪 ร้านค้า
                          </div>
                          {matchedStores.map((st) => (
                            <div
                              key={st}
                              onClick={() => handleSelectSuggestion(st)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.45rem 0.75rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: 'rgba(255, 255, 255, 0.45)',
                                marginBottom: '0.25rem',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                'rgba(255, 255, 255, 0.85)')
                              }
                              onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                'rgba(255, 255, 255, 0.45)')
                              }
                            >
                              <span
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 'bold',
                                  color: '#1e293b',
                                }}
                              >
                                {st}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: '#059669',
                                  fontWeight: '500',
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
                        <div style={{ marginBottom: '0.5rem' }}>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              color: '#64748b',
                              marginBottom: '0.35rem',
                              paddingLeft: '0.4rem',
                            }}
                          >
                            📦 สินค้าที่ตรงกัน ({matchedProducts.length} ชิ้น)
                          </div>
                          {matchedProducts.slice(0, 5).map((item) => (
                            <div
                              key={item.PRODUCT_ID}
                              onClick={() => handleSelectProduct(item.PRODUCT_ID)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.7rem',
                                padding: '0.45rem 0.6rem',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                backgroundColor: 'rgba(255, 255, 255, 0.45)',
                                marginBottom: '0.3rem',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                'rgba(255, 255, 255, 0.85)')
                              }
                              onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                'rgba(255, 255, 255, 0.45)')
                              }
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
                                  width: '38px',
                                  height: '38px',
                                  objectFit: 'cover',
                                  borderRadius: '6px',
                                  flexShrink: 0,
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    color: '#0f172a',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {item.PRODUCT_NAME}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.72rem',
                                    color: '#64748b',
                                  }}
                                >
                                  {item.TYPE} • {item.ST_NAME}
                                </div>
                              </div>
                              <div
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 'bold',
                                  color: '#059669',
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
                            marginTop: '0.5rem',
                            padding: '0.55rem',
                            borderRadius: '10px',
                            textAlign: 'center',
                            fontSize: '0.82rem',
                            fontWeight: 'bold',
                            color: '#1d4ed8',
                            backgroundColor: 'rgba(37, 99, 235, 0.12)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            'rgba(37, 99, 235, 0.22)')
                          }
                          onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            'rgba(37, 99, 235, 0.12)')
                          }
                        >
                          🔍 ดูผลลัพธ์ทั้งหมดสำหรับ "{searchText}" (
                          {matchedProducts.length} รายการ)
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '1.25rem 0.5rem',
                            textAlign: 'center',
                            color: '#64748b',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '1.6rem',
                              marginBottom: '0.35rem',
                            }}
                          >
                            🔍
                          </div>
                          <div
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: 'bold',
                              color: '#334155',
                            }}
                          >
                            ไม่พบสินค้า หมวดหมู่ หรือร้านค้าที่ตรงกับ "
                            {searchText}"
                          </div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              marginTop: '0.25rem',
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
          )}

          {/* เมนูนำทางขวา */}
          <div
            style={{
              display: 'flex',
              gap: '0.25rem',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <NavLink to="/" style={linkStyle}>
              หน้าแรก
            </NavLink>
            <NavLink to="/market" style={linkStyle}>
              การสั่งซื้อ
            </NavLink>
            <NavLink to="/profile" style={linkStyle}>
              โปรไฟล์
            </NavLink>
            {user ? (
              <button
                onClick={handleLogout}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ffffff',
                  backgroundColor: '#ef4444',
                  padding: '0.5rem 1.2rem',
                  borderRadius: '9999px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  marginLeft: '0.5rem',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                  transition: 'background-color 0.2s',
                }}
              >
                ออกจากระบบ
              </button>
            ) : (
              <NavLink
                to="/login"
                style={{
                  textDecoration: 'none',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  padding: '0.5rem 1.2rem',
                  borderRadius: '9999px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  marginLeft: '0.5rem',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
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