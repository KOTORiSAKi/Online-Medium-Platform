import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function OrderHistory() {
  const navigate = useNavigate();
  
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser) {
      navigate("/login");
      return;
    }
    

    fetch(`http://localhost:5000/api/orders?acId=${loggedInUser.AC_ID}`)
      .then((res) => res.json())
      .then((data) => {
        // Filter only 'Reviewed' orders for history
        setHistoryOrders(data.filter((o) => o.STATUS === 'Reviewed'));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [navigate]);

  if (loading) return <div style={{ textAlign: "center", padding: "2rem" }}>กำลังโหลด...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1>📋 ประวัติการสั่งซื้อ</h1>

      {historyOrders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
          ยังไม่มีประวัติการสั่งซื้อ
        </div>
      ) : (
        historyOrders.map((order) => (
          <div key={order.ORDER_ID} style={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>ร้าน: {order.ST_NAME} (บิล #{order.ORDER_ID})</h3>
                <small style={{ color: '#64748b' }}>สั่งเมื่อ: {new Date(order.ORDER_DATE).toLocaleString()}</small>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#f59e0b', fontSize: '1.2rem' }}>
                  {Array(order.RATING || 5).fill('★').join('')}
                  {Array(5 - (order.RATING || 5)).fill('☆').join('')}
                </div>
                <small style={{ color: '#10b981', fontWeight: 'bold' }}>สำเร็จ</small>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              {order.items.map(item => (
                <div key={item.ORDER_DETAIL_ID} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <img src={item.IMAGE_URL} alt={item.PRODUCT_NAME} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                  <span style={{ flex: 1 }}>{item.PRODUCT_NAME}</span>
                  <span style={{ color: '#64748b' }}>{item.QUANTITY} ชิ้น</span>
                  <strong style={{ color: '#0f172a' }}>฿{(item.QUANTITY * item.UNIT_PRICE).toLocaleString()}</strong>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'right', borderTop: '1px dashed #e2e8f0', paddingTop: '1rem' }}>
              <span>ยอดรวมทั้งสิ้น: </span>
              <strong style={{ fontSize: '1.2rem', color: '#059669' }}>฿{Number(order.TOTAL_PRICE).toLocaleString()}</strong>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default OrderHistory;

