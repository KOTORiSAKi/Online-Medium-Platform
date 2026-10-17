import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// คอมโพเนนต์ส่วนกลาง
import Navbar from "./components/Navbar";
import { PopupProvider } from "./context/PopupContext";
import { ThemeProvider } from "./context/ThemeContext";

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
import Store from "./Pages/Store";
import ManageUsers from "./Pages/ManageUsers";
import ManageEmployees from "./Pages/ManageEmployees";
import NotFound from "./Pages/NotFound";

function App() {
  return (
    <ThemeProvider>
      <PopupProvider>
        <BrowserRouter>
          <div
            className="App"
            style={{
              minHeight: "100vh",
              backgroundColor: "var(--bg-main)",
              color: "var(--text-primary)",
            }}
          >
            <Navbar />
            {/* เพิ่ม paddingTop: '6rem' เพื่อดันเนื้อหาเว็บลงมาไม่ให้ไปซ่อนอยู่หลัง Navbar ที่ลอยอยู่ */}
            <main style={{ paddingTop: "6rem", paddingBottom: "3rem" }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<Product />} />
                <Route path="/store/:stId" element={<Store />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/market" element={<Market />} />
                <Route path="/history" element={<OrderHistory />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/product-manager/:stId"
                  element={<ProductManager />}
                />
                <Route path="/shipping-manager" element={<ShippingManager />} />
                <Route path="/admin/manage-users" element={<ManageUsers />} />
                <Route
                  path="/admin/manage-employees"
                  element={<ManageEmployees />}
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </PopupProvider>
    </ThemeProvider>
  );
}

export default App;
