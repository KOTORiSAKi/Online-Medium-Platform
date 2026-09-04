import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// คอมโพเนนต์ส่วนกลาง
import Navbar from './components/Navbar';

// Pages ทั้งหมดในโฟลเดอร์ Pages
import Home from './Pages/Home';
import Product from './Pages/Product';
import Login from './Pages/Login';
import Profile from './Pages/Profile';
import Market from './Pages/Market';

function App() {
  return (
    <BrowserRouter>
      <div className="App" style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/market" element={<Market />} />
            {/* ดักจับกรณีพิมพ์ URL ไม่ถูกต้อง */}
            <Route path="*" element={
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <h2>404 - ไม่พบหน้าเว็บ</h2>
                <a href="/" style={{ color: '#2563eb' }}>กลับสู่หน้าแรก</a>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;