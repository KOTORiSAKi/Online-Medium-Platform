import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Market() {
  // จำลองสินค้าที่ผู้ใช้หยิบใส่ตะกร้าไว้
  const [cart, setCart] = useState([
    { id: 1, title: 'คีย์บอร์ด Custom Mechanical', price: 2490, qty: 1, seller: 'User_Somchai' },
    { id: 3, title: 'หนังสือ Clean Code ฉบับแปลไทย', price: 450, qty: 2, seller: 'BookWorm_Dev' },
  ]);

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shippingFee = cart.length > 0 ? 50 : 0;

  const handleCheckout = () => {
    alert(`ยืนยันการสั่งซื้อสำเร็จ! ยอดรวมทั้งสิ้น ฿${(totalAmount + shippingFee).toLocaleString()}`);
    setCart([]);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>🛒 ตะกร้าสินค้า (Market)</h1>
      <p style={{ color: '#64748b' }}>ตรวจสอบรายการสินค้าที่คุณเลือกไว้ก่อนกดยืนยันการสั่งซื้อ</p>

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>ยังไม่มีสินค้าในตะกร้า</p>
          <Link to="/" style={{ color: '#2563eb', fontWeight: 'bold' }}>ไปเลือกดูสินค้าที่หน้าแรก →</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
          {/* รายการสินค้าในตะกร้า */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cart.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0' }}>{item.title}</h4>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>ร้าน: {item.seller}</span>
                  <div style={{ marginTop: '0.25rem', color: '#059669', fontWeight: 'bold' }}>
                    ฿{item.price.toLocaleString()}
                  </div>
                </div>

                {/* ตัวปรับจำนวน & ลบ */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button onClick={() => updateQty(item.id, -1)} style={{ width: '28px', height: '28px', cursor: 'pointer' }}>-</button>
                  <span style={{ minWidth: '24px', textAlign: 'center' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} style={{ width: '28px', height: '28px', cursor: 'pointer' }}>+</button>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{ marginLeft: '1rem', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* สรุปยอดและการชำระเงิน */}
          <div style={{
            padding: '1.5rem',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            height: 'fit-content'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>สรุปคำสั่งซื้อ</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>ยอดรวมสินค้า:</span>
              <span>฿{totalAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>ค่าจัดส่ง:</span>
              <span>฿{shippingFee}</span>
            </div>
            <hr style={{ margin: '1rem 0', borderColor: '#cbd5e0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
              <span>ยอดสุทธิ:</span>
              <span style={{ color: '#059669' }}>฿{(totalAmount + shippingFee).toLocaleString()}</span>
            </div>

            <button
              onClick={handleCheckout}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              สั่งซื้อสินค้าทันที
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Market;