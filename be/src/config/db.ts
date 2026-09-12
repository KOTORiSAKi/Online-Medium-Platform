import oracledb from "oracledb";
import dotenv from "dotenv";

dotenv.config();

// ตั้งค่าให้ผลลัพธ์คืนค่าออกมาเป็น Object เพื่อให้อ่านง่ายเหมือน JSON
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

export const executeQuery = async (sql: string, binds: any = []) => {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
    });

    const result = await connection.execute(sql, binds, { autoCommit: true });
    return result.rows;
  } catch (err) {
    console.error("Database Error:", err);
    throw err;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};
