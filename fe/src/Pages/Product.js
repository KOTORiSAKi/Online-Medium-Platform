import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

function Product() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ตัวอย่างข้อมูลจำลองตาม ID
  const product = {
    id: id,
    title: `สินค้าตัวอย่าง รหัส #${id}`,
    price: 2490,
    seller: 'User_Somchai',
    rating: '4.9 ★ (18 รีวิว)',
    stock: 3,
    description: 'สินค้าของแท้ 100% ใช้งานไปเพียง 2 สัปดาห์ สภาพนางฟ้า อุปกรณ์ครบกล่องพร้อมใบเสร็จ ประกันศูนย์ยังเหลือ 10 เดือนเต็ม สนใจสอบถามหรือกดสั่งซื้อได้ทันทีครับ',
    image: 'https://placehold.co/500x350?text=Product+Image'
  };

  const handleAddToCart = () => {
    alert(`เพิ่ม "${product.title}" ลงในตะกร้า Market เรียบร้อยแล้ว!`);
    navigate('/market');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <Link to="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
        ← กลับหน้าแรก
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
        {/* รูปสินค้า */}
        <div>
          <img
            src={product.image}
            alt={product.title}
            style={{ width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0' }}
          />
        </div>

        {/* ข้อมูลสินค้า */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#2563eb', fontSize: '0.85rem', fontWeight: 'bold' }}>รหัสสินค้า #{product.id}</span>
          <h1 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{product.title}</h1>
          <p style={{ color: '#eab308', margin: '0 0 1rem 0' }}>{product.rating}</p>

          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#059669' }}>
              ฿{product.price.toLocaleString()}
            </span>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
              เหลือในสต็อก: {product.stock} ชิ้น
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>รายละเอียดจากผู้ขาย</h4>
            <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.95rem' }}>
              {product.description}
            </p>
            <div style={{ marginTop: '0.5rem', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              👤 ผู้ขาย: <strong>{product.seller}</strong>
            </div>
          </div>

          {/* ปุ่ม Action */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
            <button
              onClick={handleAddToCart}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🛒 เพิ่มลงตะกร้า (Market)
            </button>
            <button
              onClick={() => {
                alert('สั่งซื้อทันที!');
                navigate('/market');
              }}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ⚡ ซื้อเลย
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Product;