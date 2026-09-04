import React from 'react';
import { Link, NavLink } from 'react-router-dom';

function Navbar() {
  const linkStyle = ({ isActive }) => ({
    textDecoration: 'none',
    color: isActive ? '#2563eb' : '#475569',
    fontWeight: isActive ? 'bold' : 'normal',
    padding: '0.25rem 0.5rem'
  });

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem 2rem',
      borderBottom: '1px solid #e2e8f0',
      backgroundColor: '#ffffff'
    }}>
      <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', textDecoration: 'none', color: '#0f172a' }}>
        🛍️ OnlinePlatform
      </Link>

      <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
        <NavLink to="/" style={linkStyle}>หน้าแรก (Home)</NavLink>
        <NavLink to="/market" style={linkStyle}>ตะกร้า (Market)</NavLink>
        <NavLink to="/profile" style={linkStyle}>โปรไฟล์ & Dashboard</NavLink>
        <NavLink
          to="/login"
          style={{
            textDecoration: 'none',
            color: 'white',
            backgroundColor: '#0f172a',
            padding: '0.35rem 0.9rem',
            borderRadius: '6px',
            fontSize: '0.9rem'
          }}
        >
          เข้าสู่ระบบ
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;