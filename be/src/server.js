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
// API 1: ดึงรายการสินค้าทั้งหมดหน้า Home
// =====================================
app.get("/api/products", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    // JOIN ตาราง PRODUCT และ STORE ตาม ER Diagram ของคุณ
    const sql = `
      SELECT p.PRODUCT_ID, p.PRODUCT_NAME, p.PRODUCT_PRICE, p.TYPE, s.ST_NAME, s.LOCATION 
      FROM PRODUCT p
      JOIN STORE s ON p.ST_ID = s.ST_ID
    `;
    const result = await connection.execute(sql);
    res.json(result.rows);
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
      SELECT p.*, s.ST_NAME, s.LOCATION, s.RATING_POINT
      FROM PRODUCT p
      JOIN STORE s ON p.ST_ID = s.ST_ID
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
      SELECT AC_ID, USERNAME, EMAIL, TYPE, ST_ID, FNAME, LNAME, GENDER, PHONE,
             TO_CHAR(BIRTH_DATE, 'YYYY-MM-DD') AS BIRTH_DATE,
             TO_CHAR(REGISTED_DATE, 'YYYY-MM-DD HH24:MI:SS') AS REGISTED_DATE
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
      SELECT AC_ID, USERNAME, EMAIL, TYPE, ST_ID, FNAME, LNAME, GENDER, PHONE,
             TO_CHAR(BIRTH_DATE, 'YYYY-MM-DD') AS BIRTH_DATE,
             TO_CHAR(REGISTED_DATE, 'YYYY-MM-DD HH24:MI:SS') AS REGISTED_DATE
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
// API 5: Checkout สั่งซื้อสินค้า (หน้า Market)
// =====================================
app.post("/api/checkout", async (req, res) => {
  // จำลองการรับข้อมูลตะกร้าสินค้าจาก FE
  const { acId, stId, totalPrice, cartItems } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();
    // 1. สร้าง Order ใหม่ (ใช้ MAX+1 จำลอง ID ไปก่อน หรือถ้ามี Sequence ใช้ Sequence ได้)
    const orderResult = await connection.execute(
      `SELECT NVL(MAX(ORDER_ID), 0) + 1 AS NEW_ID FROM ORDERS`,
    );
    const newOrderId = orderResult.rows[0].NEW_ID;

    // 2. Insert ลงตาราง ORDERS
    await connection.execute(
      `INSERT INTO ORDERS (ORDER_ID, AC_ID, ST_ID, ORDER_DATE, STATUS, TOTAL_PRICE) 
       VALUES (:1, :2, :3, SYSDATE, 'Pending', :4)`,
      [newOrderId, acId, stId, totalPrice],
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
      SELECT o.ORDER_ID, s.ST_NAME, 
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
// API: กดยืนยันสั่งซื้อ Checkout
// =====================================
app.post('/api/cart/checkout', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const { orderIds } = req.body; // รับ ID ของบิลที่จะจ่ายเงิน

    for (let id of orderIds) {
      // อัปเดตสถานะจาก Cart เป็น Pending (รอส่ง) และลงเวลาปัจจุบัน
      await connection.execute(
        `UPDATE ORDERS SET STATUS = 'Pending', ORDER_DATE = SYSDATE WHERE ORDER_ID = :1`,
        [id]
      );
    }
    res.json({ message: 'สั่งซื้อสำเร็จ!' });
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
      `INSERT INTO ACCOUNT (AC_ID, USERNAME, PASSWORD, FNAME, LNAME, EMAIL, TYPE, BIRTH_DATE, GENDER, PHONE, REGISTED_DATE) 
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

    res.json({
      message: `สลับบทบาทเป็น ${nextType} สำเร็จ!`,
      newType: nextType
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { } }
  }
});

// =====================================
// API: สร้างร้านค้าใหม่สำหรับ Seller (Rating_point = 0, Selling_Rate = 2.5)
// =====================================
app.post('/api/stores', async (req, res) => {
  const { acId, stName, location } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();

    // 1. หาค่า ID ใหม่ของ STORE
    const idRes = await connection.execute(`SELECT NVL(MAX(ST_ID), 0) + 1 AS NEW_ID FROM STORE`);
    const newStId = idRes.rows[0].NEW_ID;

    // 2. บันทึกลงตาราง STORE โดยตั้ง Rating_point = 0 และ Selling_Rate = 2.5
    const insertSql = `
      INSERT INTO STORE (ST_ID, ST_NAME, LOCATION, RATING_POINT, SELLING_RATE)
      VALUES (:1, :2, :3, 0, 2.5)
    `;
    await connection.execute(insertSql, [newStId, stName, location]);

    // 3. ถ้าบัญชีนี้ยังไม่มี ST_ID หรือต้องการผูก ให้เชื่อม ST_ID ด้วย
    if (acId) {
      await connection.execute(`UPDATE ACCOUNT SET ST_ID = :1 WHERE AC_ID = :2`, [newStId, acId]);
    }

    res.json({
      message: `สร้างร้านค้า "${stName}" สำเร็จ!`,
      store: {
        ST_ID: newStId,
        ST_NAME: stName,
        LOCATION: location,
        RATING_POINT: 0,
        SELLING_RATE: 2.5
      }
    });
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
    const result = await connection.execute(`SELECT * FROM STORE ORDER BY ST_ID DESC`);
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