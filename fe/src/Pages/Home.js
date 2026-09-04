import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  // จำลองรายการสินค้าที่ User ต่างๆ ลงขาย
  const products = [
    {
      id: 1,
      title: 'คีย์บอร์ด Custom Mechanical (Gateron Yellow)',
      price: 2490,
      seller: 'User_Somchai',
      category: 'Electronics',
      image: 'https://placehold.co/300x200?text=Mechanical+Keyboard',
      location: 'กรุงเทพฯ'
    },
    {
      id: 2,
      title: 'iPad Air 5 64GB Wi-Fi สภาพ 98%',
      price: 15500,
      seller: 'KOTORiSAKi',
      category: 'Gadgets',
      image: 'https://placehold.co/300x200?text=iPad+Air+5',
      location: 'เชียงใหม่'
    },
    {
      id: 3,
      title: 'หนังสือ Clean Code ฉบับแปลไทย',
      price: 450,
      seller: 'BookWorm_Dev',
      category: 'Books',
      image: 'https://placehold.co/300x200?text=Clean+Code+Book',
      location: 'นนทบุรี'
    },
    {
      id: 4,
      title: 'เก้าอี้เพื่อสุขภาพ Ergonomic Chair',
      price: 3890,
      seller: 'ErgoComfort',
      category: 'Furniture',
      image: 'https://placehold.co/300x200?text=Ergonomic+Chair',
      location: 'กรุงเทพฯ'
    },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>🛍️ ตลาดสินค้าชุมชน (Marketplace)</h1>
        <p style={{ color: '#64748b' }}>สำรวจสินค้าคุณภาพที่ลงขายโดยผู้ใช้งานในแพลตฟอร์ม</p>
      </header>

      {/* Grid แสดงการ์ดสินค้า */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '1.5rem'
      }}>
        {products.map((item) => (
          <div
            key={item.id}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#fff',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <img src={item.image} alt={item.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
            
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>
                {item.category} • 📍{item.location}
              </span>
              <h3 style={{ fontSize: '1rem', margin: '0.5rem 0', flexGrow: 1 }}>{item.title}</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#059669' }}>
                  ฿{item.price.toLocaleString()}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>โดย: {item.seller}</span>
              </div>

              <Link
                to={`/product/${item.id}`}
                style={{
                  marginTop: '1rem',
                  display: 'block',
                  textAlign: 'center',
                  padding: '0.5rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                ดูรายละเอียด
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;