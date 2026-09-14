import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// คอมโพเนนต์ส่วนกลาง
import Navbar from "./components/Navbar";

// Pages ทั้งหมดในโฟลเดอร์ Pages
import Home from "./Pages/Home";
import Product from "./Pages/Product";
import Login from "./Pages/Login";
import Profile from "./Pages/Profile";
import Market from "./Pages/Market";
import Register from "./Pages/Register";
import ProductManager from "./Pages/ProductManager";
import ShippingManager from "./Pages/ShippingManager";
import OrderHistory from "./Pages/OrderHistory";

function App() {
  return (
    <BrowserRouter>
      {/* ปรับพื้นหลังเป็น #f4f6f8 เพื่อให้เห็นเงากระจกและ Navbar ได้สวยขึ้น */}
      <div
        className="App"
        style={{ minHeight: "100vh", backgroundColor: "#f4f6f8" }}
      >
        <Navbar />
        {/* เพิ่ม paddingTop: '6rem' เพื่อดันเนื้อหาเว็บลงมาไม่ให้ไปซ่อนอยู่หลัง Navbar ที่ลอยอยู่ */}
        <main style={{ paddingTop: "6rem" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/market" element={<Market />} />
            <Route path="/history" element={<OrderHistory />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product-manager/:stId" element={<ProductManager />} />
            <Route path="/shipping-manager" element={<ShippingManager />} />
            <Route
              path="*"
              element={
                <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
                  <h2>404 - ไม่พบหน้าเว็บ</h2>
                  <a href="/" style={{ color: "#2563eb" }}>
                    กลับสู่หน้าแรก
                  </a>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
