import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import LiquidGlassCard from '../LiquidGlassCard';
import html2canvas from 'html2canvas';

function Navbar() {
  const [bgCanvas, setBgCanvas] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isCapturing = useRef(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    } catch (e) {
      setUser(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  // ระบบแคปหน้าจอรัวๆ (Stress Test Loop)
  useEffect(() => {
    let isActive = true;

    const captureLoop = async () => {
      if (!isActive) return;

      // ถ้ายังแคปรูปเก่าไม่เสร็จ ให้รอรอบถัดไป (ป้องกันคิวล้นจนเบราว์เซอร์ค้าง)
      if (isCapturing.current) {
        requestAnimationFrame(captureLoop);
        return;
      }

      isCapturing.current = true;
      try {
        // สั่งแคปหน้าจอเฉพาะพื้นที่ที่ผู้ใช้มองเห็นอยู่ ณ ปัจจุบัน (Viewport)
        const canvas = await html2canvas(document.body, {
          x: window.scrollX,
          y: window.scrollY,
          width: window.innerWidth,
          height: window.innerHeight,
          useCORS: true, // อนุญาตให้ดึงรูปภาพจากเว็บอื่นได้ (ถ้าตั้งค่า Server ไว้)
          scale: 0.5, // ** ลองเปลี่ยนเป็น 0.5 ถ้าเครื่องกระตุกจนขยับไม่ได้ เพื่อลดความละเอียดภาพ **
          logging: false,
        });

        if (isActive) {
          setBgCanvas(canvas);
        }
      } catch (error) {
        console.error("Capture failed:", error);
      } finally {
        isCapturing.current = false;
        // วนลูปเรียกตัวเองแคปเฟรมต่อไปทันทีแบบไม่หยุดพัก!
        requestAnimationFrame(captureLoop);
      }
    };

    captureLoop(); // เริ่มรันลูป

    return () => {
      isActive = false; // เคลียร์ลูปเมื่อสลับหน้าเว็บ
    };
  }, []);

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
      // ใส่ attribute นี้เพื่อให้ html2canvas ข้ามการแคปตัว Navbar เอง (กันภาพซ้อน)
      data-html2canvas-ignore="true"
      style={{
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '900px',
        height: '64px',
        zIndex: 1000,
      }}
    >
      <LiquidGlassCard
        borderRadius={32}
        progress={0}
        dynamicBgSource={bgCanvas} // โยน Canvas ที่แคปสดๆ ร้อนๆ เข้าไปใน Shader
        style={{ width: '100%', height: '100%', borderRadius: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 1rem 0 1.5rem',
          height: '100%',
        }}>
          <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', textDecoration: 'none', color: '#000000', marginRight: '1rem' }}>
            🛍️ Mixiao Store
          </Link>

          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            <NavLink to="/" style={linkStyle}>หน้าแรก</NavLink>
            <NavLink to="/market" style={linkStyle}>ตะกร้า</NavLink>
            <NavLink to="/profile" style={linkStyle}>โปรไฟล์</NavLink>
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