import React, { useState, useEffect } from 'react';

const ShippingManager = () => {
  const [sizeTiers, setSizeTiers] = useState([]);
  const [weightTiers, setWeightTiers] = useState([]);
  const [routeFees, setRouteFees] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [szRes, wtRes, rfRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/size-tiers'),
        fetch('http://localhost:5000/api/admin/weight-tiers'),
        fetch('http://localhost:5000/api/admin/route-fees')
      ]);
      setSizeTiers(await szRes.json());
      setWeightTiers(await wtRes.json());
      setRouteFees(await rfRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const updateField = (setter, data, index, field, value) => {
    const newData = [...data];
    newData[index][field] = value;
    setter(newData);
  };

  const handleSaveSize = async (item) => {
    await fetch(`http://localhost:5000/api/admin/size-tiers/${item.SIZE_TIER_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    alert('บันทึกสำเร็จ');
  };

  const handleSaveWeight = async (item) => {
    await fetch(`http://localhost:5000/api/admin/weight-tiers/${item.WEIGHT_TIER_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    alert('บันทึกสำเร็จ');
  };

  const handleSaveRoute = async (item) => {
    await fetch(`http://localhost:5000/api/admin/route-fees/${item.ROUTE_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    alert('บันทึกสำเร็จ');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>⚙️ จัดการระบบคำนวณค่าจัดส่ง</h1>
      <p style={{ color: '#555', marginBottom: '2rem' }}>หน้านี้ใช้สำหรับปรับแต่งเรทราคาที่ใช้ในการคำนวณค่าจัดส่งอัตโนมัติ (Tier-based Shipping)</p>

      <section style={{ marginBottom: '3rem' }}>
        <h2>1. จัดการระดับขนาดกล่อง (Size Tiers)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>ชื่อขนาด (Tier Name)</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>ต่ำสุด (ซม.)</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>สูงสุด (ซม.)</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sizeTiers.map((t, i) => (
              <tr key={t.SIZE_TIER_ID}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{t.SIZE_TIER_ID}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <input type="text" value={t.TIER_NAME || ''} onChange={e => updateField(setSizeTiers, sizeTiers, i, 'TIER_NAME', e.target.value)} />
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <input type="number" value={t.MIN_SIZE || 0} onChange={e => updateField(setSizeTiers, sizeTiers, i, 'MIN_SIZE', e.target.value)} />
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <input type="number" value={t.MAX_SIZE || 0} onChange={e => updateField(setSizeTiers, sizeTiers, i, 'MAX_SIZE', e.target.value)} />
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <button onClick={() => handleSaveSize(t)}>บันทึก</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2>2. จัดการระดับน้ำหนัก (Weight Tiers)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>ชื่อน้ำหนัก (Tier Name)</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>ต่ำสุด (กก.)</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>สูงสุด (กก.)</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {weightTiers.map((t, i) => (
              <tr key={t.WEIGHT_TIER_ID}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{t.WEIGHT_TIER_ID}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <input type="text" value={t.TIER_NAME || ''} onChange={e => updateField(setWeightTiers, weightTiers, i, 'TIER_NAME', e.target.value)} />
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <input type="number" value={t.MIN_WEIGHT || 0} onChange={e => updateField(setWeightTiers, weightTiers, i, 'MIN_WEIGHT', e.target.value)} />
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <input type="number" value={t.MAX_WEIGHT || 0} onChange={e => updateField(setWeightTiers, weightTiers, i, 'MAX_WEIGHT', e.target.value)} />
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <button onClick={() => handleSaveWeight(t)}>บันทึก</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2>3. จัดการค่าส่งตามเขต (Static Route Fee)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>รหัส (Type)</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>คำอธิบาย</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>บวกเงินเพิ่ม (บาท)</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {routeFees.map((t, i) => (
              <tr key={t.ROUTE_ID}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}><strong>{t.ROUTE_TYPE}</strong></td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <input type="text" style={{ width: '250px' }} value={t.DESCRIPTION || ''} onChange={e => updateField(setRouteFees, routeFees, i, 'DESCRIPTION', e.target.value)} />
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <input type="number" value={t.EXTRA_FEE || 0} onChange={e => updateField(setRouteFees, routeFees, i, 'EXTRA_FEE', e.target.value)} />
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <button onClick={() => handleSaveRoute(t)}>บันทึก</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </div>
  );
};

export default ShippingManager;

