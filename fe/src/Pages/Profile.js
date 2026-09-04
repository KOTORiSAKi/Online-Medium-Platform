import React, { useState } from 'react';

function Profile() {
  // สลับดูโหมดผู้ใช้ทั่วไป หรือโหมดที่มี Dashboard ร้านค้า
  const [isSeller, setIsSeller] = useState(true);

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* ส่วนหัวข้อมูลบัญชี */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '1.5rem',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          backgroundColor: '#2563eb',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          fontWeight: 'bold'
        }}>
          K
        </div>
        <div style={{ flexGrow: 1 }}>
          <h2 style={{ margin: '0 0 0.25rem 0' }}>KOTORiSAKi</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>kotorisaki@platform.local</p>
          <span style={{
            display: 'inline-block',
            marginTop: '0.5rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            backgroundColor: isSeller ? '#dcfce7' : '#e0e7ff',
            color: isSeller ? '#166534' : '#3730a3'
          }}>
            {isSeller ? '🏪 บัญชีผู้ขาย (Seller & Merchant)' : '👤 บัญชีผู้ซื้อทั่วไป'}
          </span>
        </div>

        {/* ปุ่มสลับทดสอบ */}
        <button
          onClick={() => setIsSeller(!isSeller)}
          style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '6px', border: '1px solid #cbd5e0' }}
        >
          สลับมุมมอง ({isSeller ? 'ซ่อน Dashboard' : 'เปิด Dashboard'})
        </button>
      </div>

      {/* ถ้าเป็น Seller / Admin จะมีส่วน Dashboard ขึ้นมาให้ */}
      {isSeller && (
        <section style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>📊 ร้านค้าและ Dashboard ของฉัน</h3>
            <button style={{
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              + ลงขายสินค้าชิ้นใหม่
            </button>
          </div>

          {/* สถิติ Dashboard */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>ยอดขายเดือนนี้</span>
              <h2 style={{ margin: '0.5rem 0 0 0', color: '#059669' }}>฿48,900</h2>
            </div>
            <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>คำสั่งซื้อที่รอส่ง</span>
              <h2 style={{ margin: '0.5rem 0 0 0', color: '#2563eb' }}>4 ออเดอร์</h2>
            </div>
            <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>สินค้าที่กำลังวางขาย</span>
              <h2 style={{ margin: '0.5rem 0 0 0', color: '#d97706' }}>12 รายการ</h2>
            </div>
          </div>
        </section>
      )}

      {/* รายการประวัติคำสั่งซื้อส่วนตัว */}
      <section style={{ marginTop: '2.5rem' }}>
        <h3>📦 ประวัติการสั่งซื้อล่าสุดของฉัน</h3>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
            <span>เลขออเดอร์: #ORD-20260904-01</span>
            <span style={{ color: '#059669', fontWeight: 'bold' }}>จัดส่งสำเร็จ</span>
          </div>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#475569' }}>
            iPad Air 5 64GB Wi-Fi (฿15,500)
          </p>
        </div>
      </section>
    </div>
  );
}

export default Profile;