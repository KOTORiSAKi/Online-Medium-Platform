import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('seller'); // เพื่อจำลองดู Dashboard ในหน้า Profile
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    alert(`เข้าสู่ระบบในฐานะ: ${email} (${role === 'seller' ? 'มีสิทธิ์ Seller Dashboard' : 'ผู้ซื้อทั่วไป'})`);
    navigate('/profile');
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>🔐 เข้าสู่ระบบ</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        เข้าใช้งานบัญชี Marketplace ของคุณ
      </p>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>อีเมล / ชื่อผู้ใช้</label>
          <input
            type="text"
            required
            placeholder="your-name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.6rem', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #cbd5e0' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>รหัสผ่าน</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.6rem', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #cbd5e0' }}
          />
        </div>

        {/* ตัวเลือกจำลอง Role สำหรับทดสอบหน้า Profile */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>จำลองสถานะบัญชี:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
          >
            <option value="seller">ผู้ขาย / ร้านค้า (แสดง Dashboard)</option>
            <option value="buyer">ผู้ซื้อทั่วไป (เฉพาะข้อมูลบัญชี)</option>
          </select>
        </div>

        <button
          type="submit"
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          เข้าสู่ระบบ
        </button>
      </form>
    </div>
  );
}

export default Login;