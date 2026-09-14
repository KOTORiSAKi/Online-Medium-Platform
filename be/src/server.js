// ไฟล์: be/src/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const oracledb = require("oracledb");

const app = express();
app.use(cors());
app.use(express.json());

// แปลงให้ข้อมูลที่ได้จาก Oracle เป็น JSON Object
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

// ฟังก์ชันสำหรับต่อฐานข้อมูล Oracle 21c
async function initializeDB() {
  try {
    const connectionStr =
      process.env.DB_CONNECTION_STRING ||
      `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

    await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: connectionStr,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 2,
    });
    console.log("✅ เชื่อมต่อ Oracle 21c Database สำเร็จ!");
  } catch (err) {
    console.error("❌ เชื่อมต่อ Oracle Database ล้มเหลว:", err);
    process.exit(1);
  }
}

// =====================================
// API 1: ดึงรายการสินค้าทั้งหมดหน้า Home (รองรับ Personalized ตามผู้ใช้แต่ละคน หรือ สุ่ม)
// =====================================
app.get("/api/products", async (req, res) => {
  const { acId, shuffle } = req.query;
  let connection;
  try {
    connection = await oracledb.getConnection();
    // JOIN ตาราง PRODUCT และ STORE
    const sql = `
      SELECT p.PRODUCT_ID, p.PRODUCT_NAME, p.PRODUCT_PRICE, p.TYPE, p.IMAGE_URL, p.STOCK,
             s.ST_ID, s.ST_NAME, a.PROVINCE AS LOCATION, s.IS_OPEN, s.RATING_POINT, s.SELLING_RATE 
      FROM PRODUCT p
      JOIN STORE s ON p.ST_ID = s.ST_ID
      LEFT JOIN ADDRESS a ON s.ADDRESS_ID = a.ADDRESS_ID
    `;
    const result = await connection.execute(sql);
    let items = [...result.rows];

    // กรณีเลือกสุ่มลำดับสินค้า (Shuffle)
    if (shuffle === 'true') {
      const openItems = items.filter((it) => it.IS_OPEN === 'Y');
      const closedItems = items.filter((it) => it.IS_OPEN !== 'Y');

      const shuffleArray = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };

      return res.json([...shuffleArray(openItems), ...shuffleArray(closedItems)]);
    }

    // กรณีมี acId (Personalized ตามความชอบและพฤติกรรมของผู้ใช้แต่ละคน)
    if (acId) {
      // 1. ดึงสถิติประเภทสินค้าที่ผู้ใช้คนนี้เคยซื้อหรือหยิบใส่ตะกร้า
      const typeRes = await connection.execute(
        `SELECT p.TYPE, COUNT(*) AS CNT
         FROM ORDER_DETAIL od
         JOIN ORDERS o ON od.ORDER_ID = o.ORDER_ID
         JOIN PRODUCT p ON od.PRODUCT_ID = p.PRODUCT_ID
         WHERE o.AC_ID = :1
         GROUP BY p.TYPE`,
        [acId]
      );
      const typePref = {};
      for (const r of typeRes.rows) {
        typePref[r.TYPE] = Number(r.CNT);
      }

      // 2. ดึงสถิติร้านค้าที่ผู้ใช้คนนี้เคยสั่งซื้อ
      const storeRes = await connection.execute(
        `SELECT o.ST_ID, COUNT(*) AS STORE_CNT
         FROM ORDERS o
         WHERE o.AC_ID = :1
         GROUP BY o.ST_ID`,
        [acId]
      );
      const storePref = {};
      for (const r of storeRes.rows) {
        storePref[r.ST_ID] = Number(r.STORE_CNT);
      }

      // 3. ให้คะแนนสินค้าแต่ละชิ้น (Scoring Algorithm)
      const scored = items.map((p) => {
        let score = 0;

        // ร้านที่เปิดให้บริการ ได้คะแนนนำเสมอ
        if (p.IS_OPEN === 'Y') score += 100000;

        // ความชอบตามประเภทสินค้าที่เคยซื้อบ่อย
        const typeCnt = typePref[p.TYPE] || 0;
        score += typeCnt * 2000;

        // ความชอบตามร้านค้าที่เคยสั่งบ่อย
        const storeCnt = storePref[p.ST_ID] || 0;
        score += storeCnt * 1000;

        // คะแนนเรตติ้งของร้านค้า
        score += (Number(p.RATING_POINT) || 0) * 50;

        // Personalized Hash: สร้างความหลากหลายเฉพาะตัวสำหรับผู้ใช้แต่ละคน (อิงตาม acId และ product_id)
        // เพื่อให้ผู้ใช้แต่ละคนเห็นลำดับไม่ซ้ำกันแม้จะยังไม่มีประวัติการซื้อ (Cold-start Personalization)
        const pseudoRandom = Math.abs(Math.sin(Number(acId) * 137 + Number(p.PRODUCT_ID) * 79)) * 500;
        score += pseudoRandom;

        return { ...p, _score: score };
      });

      scored.sort((a, b) => b._score - a._score);
      return res.json(scored);
    }

    // กรณีไม่ได้ Login: เรียงร้านเปิดก่อน ตามด้วย Rating
    items.sort((a, b) => {
      if (a.IS_OPEN === 'Y' && b.IS_OPEN !== 'Y') return -1;
      if (a.IS_OPEN !== 'Y' && b.IS_OPEN === 'Y') return 1;
      return (Number(b.RATING_POINT) || 0) - (Number(a.RATING_POINT) || 0);
    });

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) { }
    }
  }
});

// =====================================
// API 2: ดึงรายละเอียดสินค้า 1 ชิ้นตาม ID
// =====================================
app.get("/api/products/:id", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const sql = `
      SELECT p.*, s.ST_NAME, a.PROVINCE AS LOCATION, s.RATING_POINT, s.IS_OPEN
      FROM PRODUCT p
      JOIN STORE s ON p.ST_ID = s.ST_ID
      LEFT JOIN ADDRESS a ON s.ADDRESS_ID = a.ADDRESS_ID
      WHERE p.PRODUCT_ID = :id
    `;
    const result = await connection.execute(sql, [req.params.id]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "ไม่พบสินค้านี้" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) { }
    }
  }
});

// เริ่มต้น Database ก่อน แล้วค่อยรัน Express Server
initializeDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Backend Server วิ่งอยู่ที่พอร์ต ${PORT}`);
  });
});

// =====================================
// API 3: ระบบ Login (เช็คจากตาราง ACCOUNT)
// =====================================
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();
    const sql = `
      SELECT AC_ID, USERNAME, EMAIL, TYPE, FNAME, LNAME, GENDER, PHONE,
             TO_CHAR(BIRTH_DATE, 'YYYY-MM-DD') AS BIRTH_DATE,
             TO_CHAR(REGISTERED_DATE, 'YYYY-MM-DD HH24:MI:SS') AS REGISTERED_DATE,
             TO_CHAR(REGISTERED_DATE, 'YYYY-MM-DD HH24:MI:SS') AS REGISTED_DATE
      FROM ACCOUNT 
      WHERE EMAIL = :email AND PASSWORD = :password
    `;
    const result = await connection.execute(sql, { email, password });

    if (result.rows.length > 0) {
      res.json(result.rows[0]); // ส่งข้อมูล User ครบถ้วนตามตาราง ACCOUNT
    } else {
      res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) { }
    }
  }
});

// =====================================
// API 3.1: ดึงข้อมูลบัญชีตาม ID (Account Detail)
// =====================================
app.get("/api/account/:id", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const sql = `
      SELECT AC_ID, USERNAME, EMAIL, TYPE, FNAME, LNAME, GENDER, PHONE,
             TO_CHAR(BIRTH_DATE, 'YYYY-MM-DD') AS BIRTH_DATE,
             TO_CHAR(REGISTERED_DATE, 'YYYY-MM-DD HH24:MI:SS') AS REGISTERED_DATE,
             TO_CHAR(REGISTERED_DATE, 'YYYY-MM-DD HH24:MI:SS') AS REGISTED_DATE
      FROM ACCOUNT 
      WHERE AC_ID = :id
    `;
    const result = await connection.execute(sql, [req.params.id]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "ไม่พบข้อมูลบัญชีผู้ใช้" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) { }
    }
  }
});

// =====================================
// API 4: ดึงประวัติการสั่งซื้อ (หน้า Profile)
// =====================================
app.get("/api/orders/buyer/:acId", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const sql = `
      SELECT o.ORDER_ID, o.ORDER_DATE, o.STATUS, o.TOTAL_PRICE, s.ST_NAME 
      FROM ORDERS o
      JOIN STORE s ON o.ST_ID = s.ST_ID
      WHERE o.AC_ID = :acId
      ORDER BY o.ORDER_DATE DESC
    `;
    const result = await connection.execute(sql, [req.params.acId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) { }
    }
  }
});

// =====================================
app.post("/api/checkout", async (req, res) => {
  const { acId, stId, totalPrice, cartItems, destAddressId, paymentMethod } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();
    const storeRes = await connection.execute(`SELECT ADDRESS_ID FROM STORE WHERE ST_ID = :1`, [stId]);
    const originAddressId = storeRes.rows.length > 0 ? storeRes.rows[0].ADDRESS_ID : null;
    const orderResult = await connection.execute(`SELECT NVL(MAX(ORDER_ID), 0) + 1 AS NEW_ID FROM ORDERS`);
    const newOrderId = orderResult.rows[0].NEW_ID;
    await connection.execute(
      `INSERT INTO ORDERS (ORDER_ID, AC_ID, ST_ID, ORDER_DATE, STATUS, TOTAL_PRICE, ORIGIN_ADDRESS_ID, DEST_ADDRESS_ID, PAYMENT_METHOD, PAYMENT_STATUS) 
       VALUES (:1, :2, :3, SYSDATE, 'Pending', :4, :5, :6, :7, 'Pending')`,
      [newOrderId, acId, stId, totalPrice, originAddressId, destAddressId, paymentMethod || 'Cash']
    );

    // 3. Insert ลงตาราง ORDER_DETAIL
    for (let item of cartItems) {
      const detailResult = await connection.execute(
        `SELECT NVL(MAX(ORDER_DETAIL_ID), 0) + 1 AS NEW_DT_ID FROM ORDER_DETAIL`,
      );
      await connection.execute(
        `INSERT INTO ORDER_DETAIL (ORDER_DETAIL_ID, ORDER_ID, PRODUCT_ID, QUANTITY, UNIT_PRICE) 
         VALUES (:1, :2, :3, :4, :5)`,
        [
          detailResult.rows[0].NEW_DT_ID,
          newOrderId,
          item.PRODUCT_ID,
          item.qty,
          item.PRODUCT_PRICE,
        ],
      );
    }
    res.json({ message: "สั่งซื้อสำเร็จ!", orderId: newOrderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) { }
    }
  }
});

// =====================================
// API: กดเพิ่มสินค้าลงตะกร้า (Draft Order)
// =====================================
app.post("/api/cart/add", async (req, res) => {
  const { acId, stId, productId, price, qty = 1 } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();

    // 1. หาว่ามีบิลของร้านนี้ (stId) ที่ตั้งสถานะเป็น 'Cart' ไว้ให้คนนี้ (acId) หรือยัง?
    let orderResult = await connection.execute(
      `SELECT ORDER_ID FROM ORDERS WHERE AC_ID = :1 AND ST_ID = :2 AND STATUS = 'Cart'`,
      [acId, stId],
    );

    let orderId;
    if (orderResult.rows.length === 0) {
      // 2. ถ้ายังไม่มี: ให้สร้างออเดอร์ใหม่สถานะ 'Cart'
      const newIdRes = await connection.execute(
        `SELECT NVL(MAX(ORDER_ID), 0) + 1 AS NEW_ID FROM ORDERS`,
      );
      orderId = newIdRes.rows[0].NEW_ID;
      await connection.execute(
        `INSERT INTO ORDERS (ORDER_ID, AC_ID, ST_ID, ORDER_DATE, STATUS, TOTAL_PRICE) 
         VALUES (:1, :2, :3, SYSDATE, 'Cart', 0)`,
        [orderId, acId, stId],
      );
    } else {
      orderId = orderResult.rows[0].ORDER_ID; // ใช้บิลเดิมที่ค้างอยู่
    }

    // 3. เช็คว่าเคยหยิบสินค้านี้ลงบิลหรือยัง?
    const detailRes = await connection.execute(
      `SELECT ORDER_DETAIL_ID, QUANTITY FROM ORDER_DETAIL WHERE ORDER_ID = :1 AND PRODUCT_ID = :2`,
      [orderId, productId],
    );

    if (detailRes.rows.length > 0) {
      // ถ้ามีแล้ว: ให้อัปเดตบวกจำนวนเพิ่ม
      await connection.execute(
        `UPDATE ORDER_DETAIL SET QUANTITY = QUANTITY + :1 WHERE ORDER_DETAIL_ID = :2`,
        [qty, detailRes.rows[0].ORDER_DETAIL_ID],
      );
    } else {
      // ถ้ายังไม่มี: ให้สร้างไอเทมใหม่ในบิล
      const newDtIdRes = await connection.execute(
        `SELECT NVL(MAX(ORDER_DETAIL_ID), 0) + 1 AS NEW_DT_ID FROM ORDER_DETAIL`,
      );
      await connection.execute(
        `INSERT INTO ORDER_DETAIL (ORDER_DETAIL_ID, ORDER_ID, PRODUCT_ID, QUANTITY, UNIT_PRICE) 
         VALUES (:1, :2, :3, :4, :5)`,
        [newDtIdRes.rows[0].NEW_DT_ID, orderId, productId, qty, price],
      );
    }

    // 4. อัปเดตยอดรวม (TOTAL_PRICE) ให้บิลใบนั้น
    await connection.execute(
      `
      UPDATE ORDERS o 
      SET TOTAL_PRICE = (SELECT SUM(QUANTITY * UNIT_PRICE) FROM ORDER_DETAIL WHERE ORDER_ID = o.ORDER_ID)
      WHERE ORDER_ID = :1`,
      [orderId],
    );

    res.json({ message: "เพิ่มลงตะกร้าสำเร็จ!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) { }
    }
  }
});

// =====================================
// API: ดึงตะกร้าสินค้า (หน้า Market)
// =====================================
app.get('/api/cart/:acId', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    // 💡 ดึง ORDER ที่เป็น 'Cart' พร้อม JOIN รายละเอียดสินค้าและชื่อร้าน
    const sql = `
      SELECT o.ORDER_ID, o.ST_ID, s.ST_NAME, s.IS_OPEN, 
             od.ORDER_DETAIL_ID, od.PRODUCT_ID, p.PRODUCT_NAME, p.IMAGE_URL,
             od.QUANTITY, od.UNIT_PRICE
      FROM ORDERS o
      JOIN STORE s ON o.ST_ID = s.ST_ID
      JOIN ORDER_DETAIL od ON o.ORDER_ID = od.ORDER_ID
      JOIN PRODUCT p ON od.PRODUCT_ID = p.PRODUCT_ID
      WHERE o.AC_ID = :acId AND o.STATUS = 'Cart'
    `;
    const result = await connection.execute(sql, [req.params.acId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: กดยืนยันสั่งซื้อ Checkout (ตรวจว่าร้านต้องเปิดอยู่ และรองรับการเลือกเฉพาะบางรายการ)
// =====================================
app.post('/api/cart/checkout', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const { orderIds, selectedDetailIds, destAddressId, paymentMethod } = req.body;

    if (selectedDetailIds && Array.isArray(selectedDetailIds) && selectedDetailIds.length > 0) {
      const placeholders = selectedDetailIds.map((_, idx) => `:${idx + 1}`).join(', ');
      const detailsRes = await connection.execute(
        `SELECT od.ORDER_DETAIL_ID, od.ORDER_ID, od.QUANTITY, od.UNIT_PRICE,
                o.AC_ID, o.ST_ID, s.ST_NAME, s.IS_OPEN, s.ADDRESS_ID AS ORIGIN_ADDRESS_ID
         FROM ORDER_DETAIL od
         JOIN ORDERS o ON od.ORDER_ID = o.ORDER_ID
         JOIN STORE s ON o.ST_ID = s.ST_ID
         WHERE od.ORDER_DETAIL_ID IN (${placeholders})`,
        selectedDetailIds
      );

      if (detailsRes.rows.length === 0) return res.status(400).json({ error: "ไม่พบสินค้าที่เลือกในระบบ" });

      const closedStoreItem = detailsRes.rows.find(item => item.IS_OPEN === 'N');
      if (closedStoreItem) {
        return res.status(400).json({ error: `ไม่สามารถสั่งซื้อได้: ร้าน "${closedStoreItem.ST_NAME}" ปิดให้บริการชั่วคราว` });
      }

      const selectedByOrder = {};
      for (const item of detailsRes.rows) {
        if (!selectedByOrder[item.ORDER_ID]) {
          selectedByOrder[item.ORDER_ID] = { acId: item.AC_ID, stId: item.ST_ID, originAddressId: item.ORIGIN_ADDRESS_ID, items: [] };
        }
        selectedByOrder[item.ORDER_ID].items.push(item);
      }

      for (const oldOrderIdStr of Object.keys(selectedByOrder)) {
        const oldOrderId = Number(oldOrderIdStr);
        const orderInfo = selectedByOrder[oldOrderId];
        const selItems = orderInfo.items;
        const selDetailIds = selItems.map(it => it.ORDER_DETAIL_ID);

        const allItemsRes = await connection.execute(`SELECT ORDER_DETAIL_ID FROM ORDER_DETAIL WHERE ORDER_ID = :1`, [oldOrderId]);
        const allDetailIds = allItemsRes.rows.map(r => r.ORDER_DETAIL_ID);

        if (selDetailIds.length === allDetailIds.length) {
          await connection.execute(
            `UPDATE ORDERS 
             SET STATUS = 'Pending', 
                 ORDER_DATE = SYSDATE,
                 TOTAL_PRICE = (SELECT NVL(SUM(QUANTITY * UNIT_PRICE), 0) FROM ORDER_DETAIL WHERE ORDER_ID = :1),
                 ORIGIN_ADDRESS_ID = :2,
                 DEST_ADDRESS_ID = :3,
                 PAYMENT_METHOD = :4,
                 PAYMENT_STATUS = 'Pending'
             WHERE ORDER_ID = :1`,
            [oldOrderId, orderInfo.originAddressId, destAddressId, paymentMethod || 'Cash']
          );
        } else {
          const selTotalPrice = selItems.reduce((sum, it) => sum + (it.QUANTITY * it.UNIT_PRICE), 0);
          const newOrderRes = await connection.execute(`SELECT NVL(MAX(ORDER_ID), 0) + 1 AS NEW_ID FROM ORDERS`);
          const newOrderId = newOrderRes.rows[0].NEW_ID;

          await connection.execute(
            `INSERT INTO ORDERS (ORDER_ID, AC_ID, ST_ID, ORDER_DATE, STATUS, TOTAL_PRICE, ORIGIN_ADDRESS_ID, DEST_ADDRESS_ID, PAYMENT_METHOD, PAYMENT_STATUS)
             VALUES (:1, :2, :3, SYSDATE, 'Pending', :4, :5, :6, :7, 'Pending')`,
            [newOrderId, orderInfo.acId, orderInfo.stId, selTotalPrice, orderInfo.originAddressId, destAddressId, paymentMethod || 'Cash']
          );

          for (const dtId of selDetailIds) {
            await connection.execute(`UPDATE ORDER_DETAIL SET ORDER_ID = :1 WHERE ORDER_DETAIL_ID = :2`, [newOrderId, dtId]);
          }

          await connection.execute(
            `UPDATE ORDERS SET TOTAL_PRICE = (SELECT NVL(SUM(QUANTITY * UNIT_PRICE), 0) FROM ORDER_DETAIL WHERE ORDER_ID = :1) WHERE ORDER_ID = :1`,
            [oldOrderId]
          );
        }
      }
      return res.json({ message: 'สั่งซื้อสินค้าที่เลือกสำเร็จ!' });
    }

    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      for (let id of orderIds) {
        const checkStore = await connection.execute(
          `SELECT s.ST_NAME, s.IS_OPEN, s.ADDRESS_ID FROM ORDERS o JOIN STORE s ON o.ST_ID = s.ST_ID WHERE o.ORDER_ID = :1`,
          [id]
        );
        if (checkStore.rows.length > 0 && checkStore.rows[0].IS_OPEN === 'N') {
          return res.status(400).json({ error: `ไม่สามารถสั่งซื้อได้: ร้าน "${checkStore.rows[0].ST_NAME}" ปิดให้บริการชั่วคราว` });
        }
        await connection.execute(
          `UPDATE ORDERS SET STATUS = 'Pending', ORDER_DATE = SYSDATE, ORIGIN_ADDRESS_ID = :1, DEST_ADDRESS_ID = :2, PAYMENT_METHOD = :3, PAYMENT_STATUS = 'Pending' WHERE ORDER_ID = :4`,
          [checkStore.rows[0].ADDRESS_ID, destAddressId, paymentMethod || 'Cash', id]
        );
      }
      return res.json({ message: 'สั่งซื้อสำเร็จ!' });
    }

    return res.status(400).json({ error: "กรุณาเลือกสินค้าที่ต้องการสั่งซื้อ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: ปรับเปลี่ยนจำนวนสินค้าในตะกร้า / ลบทิ้ง
// =====================================
app.put('/api/cart/update', async (req, res) => {
  const { orderDetailId, newQty } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();
    if (newQty <= 0) {
      // ถ้าจำนวนเหลือ 0 หรือสั่งลบ ให้ลบออกจาก ORDER_DETAIL เลย
      await connection.execute(`DELETE FROM ORDER_DETAIL WHERE ORDER_DETAIL_ID = :1`, [orderDetailId]);
    } else {
      // อัปเดตจำนวนสินค้าใหม่
      await connection.execute(`UPDATE ORDER_DETAIL SET QUANTITY = :1 WHERE ORDER_DETAIL_ID = :2`, [newQty, orderDetailId]);
    }
    res.json({ message: 'อัปเดตตะกร้าสำเร็จ!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: สมัครสมาชิก (Register)
// =====================================
app.post('/api/auth/register', async (req, res) => {
  const { username, password, fname, lname, email, type, birth_date, gender, phone } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();
    // หาเลข ID ใหม่
    const idRes = await connection.execute(`SELECT NVL(MAX(AC_ID), 0) + 1 AS NEW_ID FROM ACCOUNT`);
    const newId = idRes.rows[0].NEW_ID;

    // แปลง birth_date ให้เป็น Date ถ้ามี
    await connection.execute(
      `INSERT INTO ACCOUNT (AC_ID, USERNAME, PASSWORD, FNAME, LNAME, EMAIL, TYPE, BIRTH_DATE, GENDER, PHONE, REGISTERED_DATE) 
       VALUES (:1, :2, :3, :4, :5, :6, :7, TO_DATE(:8, 'YYYY-MM-DD'), :9, :10, SYSTIMESTAMP)`,
      [newId, username, password, fname, lname, email, type, birth_date || null, gender || null, phone || null]
    );
    res.json({ message: 'สมัครสมาชิกสำเร็จ!' });

  } catch (err) {
    // 💡 ดักจับ ORA-00001 โดยเฉพาะ
    if (err.message.includes('ORA-00001')) {
      res.status(400).json({ error: 'Username หรือ Email นี้มีผู้ใช้งานแล้ว กรุณาเปลี่ยนใหม่ครับ' });
    } else {
      res.status(500).json({ error: err.message });
    }
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: แก้ไขข้อมูลบัญชี (ตรวจรหัสผ่านเดิม + ถ้าเปลี่ยน Email หรือ Password ต้องแจ้งเตือน relogin)
// =====================================
app.put('/api/auth/update', async (req, res) => {
  const { acId, currentPassword, newUsername, newPassword, newEmail, newGender, newFname, newLname, newPhone } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();

    // 1. ตรวจสอบรหัสผ่านเก่า
    const checkSql = `SELECT PASSWORD, EMAIL, USERNAME, FNAME, LNAME, GENDER, PHONE FROM ACCOUNT WHERE AC_ID = :1`;
    const checkRes = await connection.execute(checkSql, [acId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้นี้ในระบบ" });
    }
    const currentAccount = checkRes.rows[0];
    if (currentAccount.PASSWORD !== currentPassword) {
      return res.status(400).json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" });
    }

    // 2. ตรวจจับการเปลี่ยน Email หรือ Password
    const isPasswordChanged = Boolean(newPassword && newPassword.trim() !== "" && newPassword !== currentAccount.PASSWORD);
    const isEmailChanged = Boolean(newEmail && newEmail.trim() !== "" && newEmail !== currentAccount.EMAIL);

    const finalPassword = isPasswordChanged ? newPassword : currentAccount.PASSWORD;
    const finalEmail = newEmail !== undefined && newEmail !== "" ? newEmail : currentAccount.EMAIL;
    const finalUsername = newUsername !== undefined && newUsername !== "" ? newUsername : currentAccount.USERNAME;
    const finalGender = newGender !== undefined ? newGender : currentAccount.GENDER;
    const finalFname = newFname !== undefined && newFname !== "" ? newFname : currentAccount.FNAME;
    const finalLname = newLname !== undefined && newLname !== "" ? newLname : currentAccount.LNAME;
    const finalPhone = newPhone !== undefined ? newPhone : currentAccount.PHONE;

    // 3. ทำการ UPDATE
    const updateSql = `
      UPDATE ACCOUNT 
      SET USERNAME = :1, 
          PASSWORD = :2, 
          EMAIL = :3, 
          GENDER = :4, 
          FNAME = :5, 
          LNAME = :6, 
          PHONE = :7 
      WHERE AC_ID = :8
    `;
    await connection.execute(updateSql, [
      finalUsername,
      finalPassword,
      finalEmail,
      finalGender,
      finalFname,
      finalLname,
      finalPhone,
      acId
    ]);

    res.json({
      message: 'อัปเดตข้อมูลสำเร็จ!',
      requireRelogin: (isPasswordChanged || isEmailChanged)
    });
  } catch (err) {
    if (err.message && err.message.includes('ORA-00001')) {
      res.status(400).json({ error: 'Username หรือ Email นี้มีผู้ใช้งานแล้ว กรุณาใช้ค่าอื่น' });
    } else {
      res.status(500).json({ error: err.message });
    }
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: สลับบทบาท (Customer <-> Seller) โดยต้องยืนยันรหัสผ่าน
// =====================================
app.post('/api/account/switch-role', async (req, res) => {
  const { acId, password } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();

    // ตรวจสอบรหัสผ่านและ Role ปัจจุบัน
    const checkSql = `SELECT PASSWORD, TYPE FROM ACCOUNT WHERE AC_ID = :1`;
    const checkRes = await connection.execute(checkSql, [acId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้นี้ในระบบ" });
    }
    const currentAccount = checkRes.rows[0];
    if (currentAccount.PASSWORD !== password) {
      return res.status(400).json({ error: "รหัสผ่านไม่ถูกต้อง ไม่สามารถสลับบทบาทได้" });
    }

    if (currentAccount.TYPE !== 'Customer' && currentAccount.TYPE !== 'Seller') {
      return res.status(400).json({ error: "เฉพาะบทบาท Customer หรือ Seller เท่านั้นที่สามารถสลับบทบาทได้" });
    }

    const nextType = currentAccount.TYPE === 'Customer' ? 'Seller' : 'Customer';
    await connection.execute(`UPDATE ACCOUNT SET TYPE = :1 WHERE AC_ID = :2`, [nextType, acId]);

    // 💡 หากกดสลับบทบาทไป Customer ทุกร้านที่ตัวเองดูแล จะกลายเป็น IS_OPEN = 'N' ทันที
    if (currentAccount.TYPE === 'Seller' && nextType === 'Customer') {
      await connection.execute(`UPDATE STORE SET IS_OPEN = 'N' WHERE AC_ID = :1`, [acId]);
    }

    res.json({
      message: `สลับบทบาทเป็น ${nextType} สำเร็จ!` + (nextType === 'Customer' ? ' (ร้านค้าทั้งหมดของคุณถูกปิดให้บริการโดยอัตโนมัติ)' : ''),
      newType: nextType
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: สร้างร้านค้าใหม่สำหรับ Seller (Rating_point = 0, Selling_Rate = 2.5, IS_OPEN = 'Y', AC_ID = :acId)
// =====================================
app.post('/api/stores', async (req, res) => {
  const { acId, stName, addressId, addressLine, subDistrict, district, province, zipCode, location } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();

    let finalAddressId = addressId ? Number(addressId) : null;
    const effectiveLine = addressLine || location || '';
    const effectiveProvince = province || location || '';

    // 1. ถ้าไม่ได้ส่ง addressId มาโดยตรง แต่ส่งรายละเอียดที่อยู่มา ให้สร้างที่อยู่ใหม่ใน ADDRESS (ADDRESS_TYPE = 'STORE')
    if (!finalAddressId && (effectiveLine || effectiveProvince)) {
      const addrIdRes = await connection.execute(`SELECT NVL(MAX(ADDRESS_ID), 0) + 1 AS NEW_ID FROM ADDRESS`);
      finalAddressId = addrIdRes.rows[0].NEW_ID;

      const insertAddrSql = `
        INSERT INTO ADDRESS (ADDRESS_ID, AC_ID, ADDRESS_LINE, SUB_DISTRICT, DISTRICT, PROVINCE, ZIP_CODE, IS_DEFAULT, ADDRESS_TYPE)
        VALUES (:1, :2, :3, :4, :5, :6, :7, 'N', 'STORE')
      `;
      await connection.execute(insertAddrSql, [
        finalAddressId, acId, effectiveLine, subDistrict || '', district || '', effectiveProvince, zipCode || ''
      ], { autoCommit: true });
    }

    if (!finalAddressId) {
      return res.status(400).json({ error: "กรุณาระบุหรือเลือกที่อยู่ของร้านค้า" });
    }

    // 2. หา ST_ID ใหม่สำหรับร้าน
    const idRes = await connection.execute(`SELECT NVL(MAX(ST_ID), 0) + 1 AS NEW_ID FROM STORE`);
    const newStId = idRes.rows[0].NEW_ID;

    // 3. บันทึก STORE พร้อมลิงก์ไปยัง ADDRESS_ID
    const insertSql = `
      INSERT INTO STORE (ST_ID, ST_NAME, ADDRESS_ID, RATING_POINT, SELLING_RATE, IS_OPEN, AC_ID)
      VALUES (:1, :2, :3, 0, 2.5, 'Y', :4)
    `;
    await connection.execute(insertSql, [newStId, stName, finalAddressId, acId], { autoCommit: true });

    // 4. อัปเดตสถานะผู้ใช้เป็น 'Seller' หากยังเป็น 'Customer'
    await connection.execute(
      `UPDATE ACCOUNT SET TYPE = 'Seller' WHERE AC_ID = :1 AND TYPE = 'Customer'`,
      [acId],
      { autoCommit: true }
    );

    res.json({
      message: `เปิดร้านค้า "${stName}" สำเร็จ! (สถานะร้านพร้อมขาย)`,
      store: {
        ST_ID: newStId,
        ST_NAME: stName,
        ADDRESS_ID: finalAddressId,
        RATING_POINT: 0,
        SELLING_RATE: 2.5,
        IS_OPEN: 'Y',
        AC_ID: acId
      }
    });
  } catch (err) {
    console.error("Create store error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: สลับสถานะเปิด-ปิดร้านค้า (IS_OPEN = 'Y' หรือ 'N')
// =====================================
app.put('/api/stores/:stId/status', async (req, res) => {
  const { isOpen } = req.body; // 'Y' or 'N'
  let connection;
  try {
    connection = await oracledb.getConnection();
    await connection.execute(
      `UPDATE STORE SET IS_OPEN = :1 WHERE ST_ID = :2`,
      [isOpen, req.params.stId],
      { autoCommit: true }
    );
    res.json({
      message: `ร้านค้าถูกตั้งค่าเป็น ${isOpen === 'Y' ? 'เปิดให้บริการ' : 'ปิดให้บริการ'} เรียบร้อยแล้ว`,
      isOpen
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: แก้ไขชื่อร้านค้าและที่ตั้ง (เฉพาะเจ้าของร้าน หรือ Admin)
// =====================================
app.put('/api/stores/:stId', async (req, res) => {
  const { stName, addressId, addressLine, subDistrict, district, province, zipCode, location, acId } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();

    // 1. ตรวจสอบเจ้าของร้าน
    const storeRes = await connection.execute(`SELECT AC_ID, ADDRESS_ID FROM STORE WHERE ST_ID = :1`, [req.params.stId]);
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบร้านค้านี้" });
    }
    const storeOwner = storeRes.rows[0].AC_ID;
    const currentAddressId = storeRes.rows[0].ADDRESS_ID;

    // 2. สิทธิการแก้ไข
    const userRes = await connection.execute(`SELECT TYPE FROM ACCOUNT WHERE AC_ID = :1`, [acId]);
    const userType = userRes.rows.length > 0 ? userRes.rows[0].TYPE : null;

    if (storeOwner !== Number(acId) && userType !== 'Admin') {
      return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไขร้านค้านี้ (คุณไม่ใช่เจ้าของ หรือ Admin)" });
    }

    // 3. จัดการที่อยู่ร้านค้า (ADDRESS_ID)
    let targetAddressId = addressId ? Number(addressId) : currentAddressId;
    const effectiveLine = addressLine || location || '';
    const effectiveProvince = province || location || '';

    if (addressId) {
      targetAddressId = Number(addressId);
    } else if (effectiveLine || effectiveProvince) {
      if (currentAddressId) {
        const updateAddrSql = `
          UPDATE ADDRESS
          SET ADDRESS_LINE = :1, SUB_DISTRICT = :2, DISTRICT = :3, PROVINCE = :4, ZIP_CODE = :5
          WHERE ADDRESS_ID = :6
        `;
        await connection.execute(updateAddrSql, [
          effectiveLine, subDistrict || '', district || '', effectiveProvince, zipCode || '', currentAddressId
        ], { autoCommit: true });
        targetAddressId = currentAddressId;
      } else {
        const addrIdRes = await connection.execute(`SELECT NVL(MAX(ADDRESS_ID), 0) + 1 AS NEW_ID FROM ADDRESS`);
        targetAddressId = addrIdRes.rows[0].NEW_ID;
        const insertAddrSql = `
          INSERT INTO ADDRESS (ADDRESS_ID, AC_ID, ADDRESS_LINE, SUB_DISTRICT, DISTRICT, PROVINCE, ZIP_CODE, IS_DEFAULT, ADDRESS_TYPE)
          VALUES (:1, :2, :3, :4, :5, :6, :7, 'N', 'STORE')
        `;
        await connection.execute(insertAddrSql, [
          targetAddressId, acId, effectiveLine, subDistrict || '', district || '', effectiveProvince, zipCode || ''
        ], { autoCommit: true });
      }
    }

    // 4. อัปเดตข้อมูล STORE
    await connection.execute(
      `UPDATE STORE SET ST_NAME = :1, ADDRESS_ID = :2 WHERE ST_ID = :3`,
      [stName, targetAddressId, req.params.stId],
      { autoCommit: true }
    );

    res.json({ message: "อัปเดตข้อมูลร้านค้าเรียบร้อยแล้ว!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: ดึงร้านค้าทั้งหมด
// =====================================
app.get('/api/stores', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(`
      SELECT s.ST_ID, s.ST_NAME, s.RATING_POINT, s.SELLING_RATE, s.IS_OPEN, s.AC_ID, s.ADDRESS_ID,
             a.ADDRESS_LINE, a.SUB_DISTRICT, a.DISTRICT, a.PROVINCE, a.ZIP_CODE,
             NVL(a.PROVINCE, 'ไม่ระบุที่อยู่') AS LOCATION
      FROM STORE s
      LEFT JOIN ADDRESS a ON s.ADDRESS_ID = a.ADDRESS_ID
      ORDER BY s.ST_ID DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: ลบบัญชี (Delete Account)
// =====================================
app.delete('/api/auth/delete/:id', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    await connection.execute(`DELETE FROM ACCOUNT WHERE AC_ID = :1`, [req.params.id]);
    res.json({ message: 'ลบบัญชีของคุณเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ error: 'ไม่สามารถลบได้ อาจมีข้อมูลผูกอยู่ (เช่น บิลคำสั่งซื้อ)' });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: ดึงข้อมูลร้านค้ารายละเอียด 1 ร้าน
// =====================================
app.get('/api/stores/:stId', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(`
      SELECT s.ST_ID, s.ST_NAME, s.RATING_POINT, s.SELLING_RATE, s.IS_OPEN, s.AC_ID, s.ADDRESS_ID,
             a.ADDRESS_LINE, a.SUB_DISTRICT, a.DISTRICT, a.PROVINCE, a.ZIP_CODE,
             NVL(a.PROVINCE, 'ไม่ระบุที่อยู่') AS LOCATION
      FROM STORE s
      LEFT JOIN ADDRESS a ON s.ADDRESS_ID = a.ADDRESS_ID
      WHERE s.ST_ID = :1
    `, [req.params.stId]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "ไม่พบข้อมูลร้านค้านี้" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: ดึงสินค้าทั้งหมดของร้านค้าหนึ่งๆ (Product Manager)
// =====================================
app.get('/api/stores/:stId/products', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT p.PRODUCT_ID, p.PRODUCT_NAME, p.TYPE, p.PRODUCT_PRICE, p.STOCK, 
              p.IMAGE_URL, p.DESCRIPTION, p.WEIGHT, p.WIDTH, p.LENGTH, p.HEIGHT, p.ST_ID
       FROM PRODUCT p 
       WHERE p.ST_ID = :1 
       ORDER BY p.PRODUCT_ID DESC`,
      [req.params.stId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: เพิ่มสินค้าใหม่ลงในร้านค้า (เฉพาะเจ้าของร้านหรือ Admin)
// =====================================
app.post('/api/products', async (req, res) => {
  const { stId, productName, type, price, stock, imageUrl, description, weight, width, length, height, acId } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();

    // 1. ตรวจสอบสิทธิ์ (เจ้าของร้านหรือ Admin)
    const checkStore = await connection.execute(`SELECT AC_ID FROM STORE WHERE ST_ID = :1`, [stId]);
    if (checkStore.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบร้านค้านี้ในระบบ" });
    }
    const storeOwner = checkStore.rows[0].AC_ID;

    const checkUser = await connection.execute(`SELECT TYPE FROM ACCOUNT WHERE AC_ID = :1`, [acId]);
    const userType = checkUser.rows.length > 0 ? checkUser.rows[0].TYPE : null;

    if (storeOwner !== Number(acId) && userType !== 'Admin') {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์จัดการสินค้าในร้านนี้ (เฉพาะเจ้าของร้านหรือ Admin เท่านั้น)" });
    }

    // 2. หาค่า PRODUCT_ID ใหม่
    const idRes = await connection.execute(`SELECT NVL(MAX(PRODUCT_ID), 0) + 1 AS NEW_ID FROM PRODUCT`);
    const newProdId = idRes.rows[0].NEW_ID;

    // 3. บันทึกลงตาราง PRODUCT
    const insertSql = `
      INSERT INTO PRODUCT (
        PRODUCT_ID, PRODUCT_NAME, TYPE, PRODUCT_PRICE, STOCK, 
        IMAGE_URL, DESCRIPTION, WEIGHT, WIDTH, LENGTH, HEIGHT, ST_ID
      ) VALUES (
        :1, :2, :3, :4, :5, 
        :6, :7, :8, :9, :10, :11, :12
      )
    `;
    await connection.execute(insertSql, [
      newProdId,
      productName,
      type || "ทั่วไป",
      price || 0,
      stock || 0,
      imageUrl || null,
      description || null,
      weight || 0,
      width || 0,
      length || 0,
      height || 0,
      stId
    ]);

    res.json({ message: `เพิ่มสินค้า "${productName}" สำเร็จ!`, productId: newProdId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: แก้ไขข้อมูลสินค้า (เฉพาะเจ้าของร้านหรือ Admin)
// =====================================
app.put('/api/products/:id', async (req, res) => {
  const { productName, type, price, stock, imageUrl, description, weight, width, length, height, acId } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();

    // 1. ดึงร้านค้าของสินค้านี้
    const prodRes = await connection.execute(`SELECT ST_ID FROM PRODUCT WHERE PRODUCT_ID = :1`, [req.params.id]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบสินค้านี้" });
    }
    const stId = prodRes.rows[0].ST_ID;

    // 2. ตรวจสอบสิทธิ์
    const checkStore = await connection.execute(`SELECT AC_ID FROM STORE WHERE ST_ID = :1`, [stId]);
    const storeOwner = checkStore.rows.length > 0 ? checkStore.rows[0].AC_ID : null;

    const checkUser = await connection.execute(`SELECT TYPE FROM ACCOUNT WHERE AC_ID = :1`, [acId]);
    const userType = checkUser.rows.length > 0 ? checkUser.rows[0].TYPE : null;

    if (storeOwner !== Number(acId) && userType !== 'Admin') {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์แก้ไขสินค้านี้ (เฉพาะเจ้าของร้านหรือ Admin เท่านั้น)" });
    }

    // 3. อัปเดตข้อมูลสินค้า
    const updateSql = `
      UPDATE PRODUCT 
      SET PRODUCT_NAME = :1, 
          TYPE = :2, 
          PRODUCT_PRICE = :3, 
          STOCK = :4, 
          IMAGE_URL = :5, 
          DESCRIPTION = :6, 
          WEIGHT = :7, 
          WIDTH = :8,
          LENGTH = :9,
          HEIGHT = :10
      WHERE PRODUCT_ID = :11
    `;
    await connection.execute(updateSql, [
      productName,
      type || "ทั่วไป",
      price || 0,
      stock || 0,
      imageUrl || null,
      description || null,
      weight || 0,
      width || 0,
      length || 0,
      height || 0,
      req.params.id
    ]);

    res.json({ message: "อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: ลบสินค้า (เฉพาะเจ้าของร้านหรือ Admin)
// =====================================
app.delete('/api/products/:id', async (req, res) => {
  const { acId } = req.body || {};
  let connection;
  try {
    connection = await oracledb.getConnection();

    // 1. ดึงร้านค้าของสินค้านี้
    const prodRes = await connection.execute(`SELECT ST_ID FROM PRODUCT WHERE PRODUCT_ID = :1`, [req.params.id]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบสินค้านี้" });
    }
    const stId = prodRes.rows[0].ST_ID;

    // 2. ตรวจสอบสิทธิ์
    const checkStore = await connection.execute(`SELECT AC_ID FROM STORE WHERE ST_ID = :1`, [stId]);
    const storeOwner = checkStore.rows.length > 0 ? checkStore.rows[0].AC_ID : null;

    const checkUser = await connection.execute(`SELECT TYPE FROM ACCOUNT WHERE AC_ID = :1`, [acId]);
    const userType = checkUser.rows.length > 0 ? checkUser.rows[0].TYPE : null;

    if (storeOwner !== Number(acId) && userType !== 'Admin') {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ลบสินค้านี้" });
    }

    // 3. ลบสินค้า
    await connection.execute(`DELETE FROM PRODUCT WHERE PRODUCT_ID = :1`, [req.params.id]);
    res.json({ message: "ลบสินค้าสำเร็จเรียบร้อยแล้ว!" });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถลบสินค้านี้ได้ เนื่องจากอาจมีประวัติอยู่ในใบสั่งซื้อ (Order Detail)" });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});


// =====================================
// API: ดึงที่อยู่ของผู้ใช้ (รองรับการกรองด้วย ?type=)
// =====================================
app.get('/api/address/:acId', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const { type } = req.query;
    let sql = `SELECT * FROM ADDRESS WHERE AC_ID = :acId`;
    let binds = { acId: req.params.acId };

    if (type) {
      sql += ` AND ADDRESS_TYPE = :type`;
      binds.type = type;
    }
    sql += ` ORDER BY IS_DEFAULT DESC, ADDRESS_ID ASC`;

    const result = await connection.execute(sql, binds);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: เพิ่มที่อยู่ใหม่
// =====================================
app.post('/api/address', async (req, res) => {
  const { acId, addressLine, subDistrict, district, province, zipCode, isDefault, addressType } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();

    // 1. หา ADDRESS_ID ใหม่
    const idRes = await connection.execute(`SELECT NVL(MAX(ADDRESS_ID), 0) + 1 AS NEW_ID FROM ADDRESS`);
    const newAddrId = idRes.rows[0].NEW_ID;

    // 2. ถ้าตั้งเป็นค่าเริ่มต้น และเป็น HOME ให้ล้างค่าเริ่มต้นของ HOME อื่นๆ
    const type = addressType || 'HOME';
    if (isDefault === 'Y' && type === 'HOME') {
      await connection.execute(`UPDATE ADDRESS SET IS_DEFAULT = 'N' WHERE AC_ID = :1 AND ADDRESS_TYPE = 'HOME'`, [acId]);
    }

    // 3. บันทึกลงตาราง ADDRESS
    const insertSql = `
      INSERT INTO ADDRESS (ADDRESS_ID, AC_ID, ADDRESS_LINE, SUB_DISTRICT, DISTRICT, PROVINCE, ZIP_CODE, IS_DEFAULT, ADDRESS_TYPE)
      VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9)
    `;
    await connection.execute(insertSql, [
      newAddrId, acId, addressLine, subDistrict, district, province, zipCode, isDefault || 'N', type
    ]);

    res.json({ message: 'เพิ่มที่อยู่สำเร็จ!', addressId: newAddrId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: แก้ไขที่อยู่
// =====================================
app.put('/api/address/:id', async (req, res) => {
  const { acId, addressLine, subDistrict, district, province, zipCode, isDefault, addressType } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();

    const type = addressType || 'HOME';
    if (isDefault === 'Y' && type === 'HOME') {
      await connection.execute(`UPDATE ADDRESS SET IS_DEFAULT = 'N' WHERE AC_ID = :1 AND ADDRESS_TYPE = 'HOME'`, [acId]);
    }

    const updateSql = `
      UPDATE ADDRESS 
      SET ADDRESS_LINE = :1, SUB_DISTRICT = :2, DISTRICT = :3, PROVINCE = :4, ZIP_CODE = :5, IS_DEFAULT = :6, ADDRESS_TYPE = :7
      WHERE ADDRESS_ID = :8 AND AC_ID = :9
    `;
    await connection.execute(updateSql, [
      addressLine, subDistrict, district, province, zipCode, isDefault || 'N', type, req.params.id, acId
    ]);

    res.json({ message: 'อัปเดตที่อยู่สำเร็จ!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});
