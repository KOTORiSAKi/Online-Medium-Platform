# 🛒 Online Medium Platform — MIXIAO STORE (CPE-303 Project)

<div align="center">

[![🇹🇭 ภาษาไทย](https://img.shields.io/badge/Language-%F0%9F%87%B9%F0%9F%87%AD_%E0%B8%A0%E0%B8%B2%E0%B8%A9%E0%B8%B2%E0%B9%84%E0%B8%97%E0%B8%A2_(Current)-2563eb?style=for-the-badge)](./README.md)
[![🇬🇧 English](https://img.shields.io/badge/Language-%F0%9F%87%AC%F0%9F%87%A7_English_Version-64748b?style=for-the-badge)](./README.en.md)

![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white)
![Oracle](https://img.shields.io/badge/Oracle_21c-F80000?style=flat-square&logo=oracle&logoColor=white)
![WebGL](https://img.shields.io/badge/WebGL_Shader-990000?style=flat-square&logo=webgl&logoColor=white)

**🌐 เปลี่ยนภาษา (Switch Language): 🇹🇭 ภาษาไทย (ปัจจุบัน) | [🇬🇧 Read in English (`README.en.md`)](./README.en.md)**

</div>

ระบบแพลตฟอร์มตลาดซื้อขายสินค้าออนไลน์แบบครบวงจร (**Full-Stack E-Commerce & Multi-Vendor Marketplace Platform**) ที่รองรับการทำงานแบบหลายบทบาท (**Multi-Role System**: ลูกค้า, ผู้ขาย, พนักงานจัดการระบบขนส่ง, และผู้ดูแลระบบ) พร้อมระบบคำนวณค่าขนส่งหลายมิติ ระบบตะกร้าสินค้าและการแยกคำสั่งซื้ออัตโนมัติ ระบบจำลองการจัดส่งแบบเรียลไทม์ และส่วนติดต่อผู้ใช้สถาปัตยกรรม **Two-Tier Apple Liquid Glass UI (WebGL Fragment Shader + SVG Displacement Refraction + GPU Ambient Light Mesh)**

---

## 📑 สารบัญ (Table of Contents)

1. [ภาพรวมระบบและฟีเจอร์หลัก (Project Overview)](#-1-ภาพรวมระบบและฟีเจอร์หลัก-project-overview)
2. [สถาปัตยกรรมและโครงสร้างโปรเจกต์ (Project Structure)](#-2-สถาปัตยกรรมและโครงสร้างโปรเจกต์-project-structure)
3. [ส่วนที่ 1: ระบบฐานข้อมูล (Database Layer - Oracle 21c)](#-3-ส่วนที่-1-ระบบฐานข้อมูล-database-layer---oracle-21c)
   - [แผนภาพความสัมพันธ์ของข้อมูล (ER Diagram)](#31-แผนภาพความสัมพันธ์ของข้อมูล-er-diagram)
   - [รายละเอียดตารางทั้งหมด 13 ตาราง (Database Schema)](#32-รายละเอียดตารางทั้งหมด-13-ตาราง-database-schema)
   - [เทคนิคและการออกแบบฝั่งฐานข้อมูล (Database Techniques)](#33-เทคนิคและการออกแบบฝั่งฐานข้อมูล-database-techniques)
4. [ส่วนที่ 2: ระบบฝั่งเซิร์ฟเวอร์ (Backend Layer - Node.js & Express)](#-4-ส่วนที่-2-ระบบฝั่งเซิร์ฟเวอร์-backend-layer---nodejs--express)
   - [โครงสร้างและเทคโนโลยีฝั่ง Backend](#41-โครงสร้างและเทคโนโลยีฝั่ง-backend)
   - [รายการ API Endpoints ทั้งหมด](#42-รายการ-api-endpoints-ทั้งหมด)
   - [เทคนิคและอัลกอริทึมฝั่ง Backend (Backend Techniques)](#43-เทคนิคและอัลกอริทึมฝั่ง-backend-backend-techniques)
5. [ส่วนที่ 3: ระบบฝั่งส่วนติดต่อผู้ใช้ (Frontend Layer - React 19)](#-5-ส่วนที่-3-ระบบฝั่งส่วนติดต่อผู้ใช้-frontend-layer---react-19)
   - [โครงสร้างหน้าเว็บและคอมโพเนนต์ (Pages & Components)](#51-โครงสร้างหน้าเว็บและคอมโพเนนต์-pages--components)
   - [เทคนิคขั้นสูงฝั่ง Frontend (Frontend Techniques)](#52-เทคนิคขั้นสูงฝั่ง-frontend-frontend-techniques)
6. [การติดตั้งและเริ่มต้นใช้งาน (Installation & Setup)](#-6-การติดตั้งและเริ่มต้นใช้งาน-installation--setup)

---

## 🌟 1. ภาพรวมระบบและฟีเจอร์หลัก (Project Overview)

**Online Medium Platform (MIXIAO STORE)** เป็นระบบตัวกลางสำหรับการซื้อขายสินค้าออนไลน์ที่เชื่อมโยงระหว่าง **ผู้ซื้อ (Customer)**, **ผู้ขาย/ร้านค้า (Seller)**, **พนักงานจัดการขนส่ง (Employee)** และ **ผู้ดูแลระบบ (Admin)** เข้าด้วยกัน โดยแบ่งสิทธิ์และฟีเจอร์ตามบทบาทของผู้ใช้งานดังนี้:

| บทบาท (Role) | ความสามารถหลักในระบบ |
| :--- | :--- |
| **👤 Customer (ลูกค้า)** | ค้นหาสินค้าและร้านค้าแบบเรียลไทม์จากทุกหน้า, ดูสินค้าแนะนำเฉพาะบุคคล (Personalized Feed), จัดเรียงและแบ่งหน้าสินค้า (Pagination), จัดการตะกร้าสินค้าแยกตามร้านค้า, เลือกชำระเงินเฉพาะบางรายการ (Partial Checkout), ติดตามสถานะการจัดส่งด้วยหลอดคลื่นน้ำ Liquid Glass แบบเรียลไทม์, ยืนยันรับสินค้าและให้คะแนนรีวิว (1–5 ดาว), จัดการสมุดที่อยู่จัดส่ง และสลับบทบาทเป็นผู้ขายได้ทันที |
| **🏪 Seller (ผู้ขาย)** | สิทธิ์ทั้งหมดของ Customer + สร้างและจัดการร้านค้าของตนเองได้หลายร้าน (1 Account มีได้หลายร้าน), เปิด/ปิดสถานะร้านค้าชั่วคราว, เพิ่ม/แก้ไข/ลบสินค้าและจัดการสต็อกพร้อมขนาด-น้ำหนักพัสดุ, ตั้งค่าที่อยู่ต้นทางของร้านค้า และเลือกเปิดใช้งานบริษัทขนส่งประจำร้าน (`Pickup` / `Dropoff`) |
| **🚚 Employee (พนักงาน)** | จัดการข้อมูลลูกค้าและผู้ขาย (ยกเว้น Admin/Employee อื่น), ค้นหาและตรวจสอบร้านค้าทั้งหมด, และปรับแต่งโครงสร้างราคาค่าจัดส่งอัตโนมัติ ได้แก่ ระดับขนาดกล่อง (`SIZE_TIER`), ระดับน้ำหนัก (`WEIGHT_TIER`), และค่าธรรมเนียมเส้นทางในจังหวัด/ข้ามจังหวัด (`STATIC_ROUTE_FEE`) |
| **🛡️ Admin (ผู้ดูแลระบบ)** | สิทธิ์สูงสุดในระบบ: จัดการบัญชีผู้ใช้ทุกบทบาท, เลื่อนขั้นหรือปลดพนักงาน (`ManageEmployees`), โอนย้ายเจ้าของร้านค้าหรือปลดเจ้าของร้าน (`Reassign / Orphan Store`), เข้าถึงหน้าจัดการสินค้าของทุกร้านค้า, จัดการตารางเรทราคาขนส่ง และตั้งค่าเวลาจำลองการจัดส่ง (`SHIPPING_DELAY_SEC`) |

---

## 📂 2. สถาปัตยกรรมและโครงสร้างโปรเจกต์ (Project Structure)

```text
CPE-303_Project/
├── be/                                 # ฝั่งเซิร์ฟเวอร์ (Backend - Node.js + Express 5 + OracleDB)
│   ├── package.json                    # Dependencies ฝั่ง Backend (express, oracledb, cors, dotenv)
│   └── src/
│       ├── server.js                   # ไฟล์หลักของเซิร์ฟเวอร์ รวม RESTful API ทั้งหมด (พอร์ต 5000)
│       ├── config/
│       │   └── db.ts                   # โมดูลตั้งค่าการเชื่อมต่อฐานข้อมูล (TypeScript Boilerplate)
│       ├── controllers/
│       │   └── article.controller.ts   # ตัวอย่าง Controller โครงสร้างเริ่มต้น
│       ├── middlewares/
│       │   └── auth.middleware.ts      # ตัวอย่าง Middleware ตรวจสอบสิทธิ์
│       └── routes/
│           └── article.route.ts        # ตัวอย่างการแยก Route
│
├── fe/                                 # ฝั่งส่วนติดต่อผู้ใช้ (Frontend - React 19)
│   ├── package.json                    # Dependencies ฝั่ง Frontend (react 19, react-router-dom v7)
│   ├── public/
│   │   └── index.html                  # HTML หลัก พร้อม Inline Script ป้องกันแสงกะพริบ (Zero-FOUC)
│   └── src/
│       ├── index.js                    # จุดเริ่มต้นของแอปพลิเคชัน React
│       ├── App.js                      # ตั้งค่า Routing, Providers, AmbientBackground และโครงสร้างหลัก
│       ├── index.css                   # ระบบ Two-Tier Glassmorphism, Ambient Orbs, Dark Mode & View Transitions
│       ├── App.css                     # สไตล์เสริมของแอปพลิเคชัน
│       ├── LiquidGlassCard.jsx         # คอมโพเนนต์กระจกเหลว WebGL Fragment Shader + SVG Displacement
│       ├── components/
│       │   ├── AmbientBackground.js    # พื้นหลังแสงออร่าเคลื่อนไหวบน GPU Compositor (5 Drifting Orbs)
│       │   └── Navbar.js               # แถบนำทาง Liquid Glass, ระบบค้นหาอัจฉริยะ, แจ้งเตือนตะกร้า และสลับธีม
│       ├── context/
│       │   ├── ThemeContext.js         # จัดการ Dark/Light Mode พร้อมแอนิเมชัน View Transitions API
│       │   └── PopupContext.js         # ระบบ Frosted Glass Toast Notification & Promise Confirmation Modal
│       └── Pages/
│           ├── Home.js                 # หน้าแรก แสดงสินค้าแนะนำ หมวดหมู่ การจัดเรียง และ Pagination
│           ├── Product.js              # หน้ารายละเอียดสินค้าเชิงลึก ปุ่มซื้อทันที และการหยิบใส่ตะกร้า
│           ├── Store.js                # หน้าร้านค้า แสดงข้อมูลร้าน คะแนน ยอดขาย ขนส่งที่รองรับ และสินค้าในร้าน
│           ├── Market.js               # หน้าตะกร้าสินค้า ชำระเงินบางส่วน และติดตามพัสดุแบบเรียลไทม์
│           ├── OrderHistory.js         # หน้าประวัติการสั่งซื้อที่สำเร็จแล้วและคะแนนรีวิว
│           ├── Profile.js              # หน้าจัดการข้อมูลส่วนตัว สมุดที่อยู่ ร้านค้าในครอบครอง และสลับบทบาท
│           ├── ProductManager.js       # หน้าจัดการร้านค้าและสินค้า (สำหรับ Seller และ Admin)
│           ├── ShippingManager.js      # หน้าจัดการระดับขนาดกล่อง น้ำหนัก และค่าส่งตามเขต (Employee/Admin)
│           ├── ManageUsers.js          # หน้าจัดการผู้ใช้และโอนย้าย/ปลดเจ้าของร้านค้า (Admin/Employee)
│           ├── ManageEmployees.js      # หน้าจัดการเลื่อนขั้นและปลดพนักงาน (สำหรับ Admin)
│           ├── Login.js                # หน้าเข้าสู่ระบบดีไซน์ Liquid Glass
│           ├── Register.js             # หน้าสมัครสมาชิกใหม่ดีไซน์ Liquid Glass
│           └── NotFound.js             # หน้า 404 Not Found ดีไซน์ Liquid Glass
├── Business Rule.docx                  # เอกสารข้อกำหนดทางธุรกิจ (Business Rules)
├── Database Detail.docx                # เอกสารรายละเอียดการออกแบบฐานข้อมูล
├── README.md                           # เอกสารอธิบายโปรเจกต์ฉบับภาษาไทย (Default GitHub README)
└── README.en.md                        # เอกสารอธิบายโปรเจกต์ฉบับภาษาอังกฤษ (English Version)
```

---

## 🗄️ 3. ส่วนที่ 1: ระบบฐานข้อมูล (Database Layer - Oracle 21c)

ระบบใช้ฐานข้อมูลเชิงสัมพันธ์ **Oracle Database 21c (Express Edition - XEPDB1)** ภายใต้ Schema `HR` โดยออกแบบให้รองรับทั้งระบบบัญชีผู้ใช้หลายบทบาท ระบบร้านค้าและสินค้า ระบบคำสั่งซื้อ และระบบคำนวณอัตราค่าขนส่งแบบหลายมิติ รวมทั้งหมด **13 ตาราง**

### 3.1 แผนภาพความสัมพันธ์ของข้อมูล (ER Diagram)

```mermaid
erDiagram
    ACCOUNT ||--o{ ADDRESS : "มีที่อยู่ (AC_ID)"
    ACCOUNT ||--o{ STORE : "เป็นเจ้าของ (AC_ID)"
    ACCOUNT ||--o{ ORDERS : "สั่งซื้อ (AC_ID)"

    ADDRESS ||--o{ STORE : "ที่ตั้งร้านค้า (ADDRESS_ID)"
    ADDRESS ||--o{ ORDERS : "ที่อยู่จัดส่งปลายทาง (DEST_ADDRESS_ID)"

    STORE ||--o{ PRODUCT : "วางจำหน่าย (ST_ID)"
    STORE ||--o{ ORDERS : "รับคำสั่งซื้อ (ST_ID)"
    STORE ||--o{ SHOP_DVSERVICE : "เปิดใช้ขนส่ง (ST_ID)"

    DVSERVICE ||--o{ SHOP_DVSERVICE : "ให้บริการในร้าน (DVSERVICE_ID)"
    DVSERVICE ||--o{ PRICE : "กำหนดเรทราคา (DVSERVICE_ID)"

    DVSERVICE_TYPE ||--o{ PRICE : "ประเภทบริการ (DVSERVICE_TYPE_ID)"
    WEIGHT_TIER ||--o{ PRICE : "เกณฑ์น้ำหนัก (WEIGHT_TIER_ID)"
    SIZE_TIER ||--o{ PRICE : "เกณฑ์ขนาด (SIZE_TIER_ID)"

    PRICE ||--o{ ORDERS : "อ้างอิงเรทค่าส่ง (PRICE_ID)"
    ORDERS ||--o{ ORDER_DETAIL : "ประกอบด้วยรายการ (ORDER_ID)"
    PRODUCT ||--o{ ORDER_DETAIL : "อยู่ในรายการสั่งซื้อ (PRODUCT_ID)"

    ACCOUNT {
        NUMBER AC_ID PK
        VARCHAR2 USERNAME
        VARCHAR2 PASSWORD
        VARCHAR2 FNAME
        VARCHAR2 LNAME
        DATE BIRTH_DATE
        VARCHAR2 GENDER
        VARCHAR2 EMAIL
        VARCHAR2 PHONE
        VARCHAR2 TYPE
        TIMESTAMP REGISTERED_DATE
        CHAR IS_ACTIVE
    }

    ADDRESS {
        NUMBER ADDRESS_ID PK
        NUMBER AC_ID FK
        VARCHAR2 ADDRESS_LINE
        VARCHAR2 SUB_DISTRICT
        VARCHAR2 DISTRICT
        VARCHAR2 PROVINCE
        VARCHAR2 ZIP_CODE
        CHAR IS_DEFAULT
        VARCHAR2 ADDRESS_TYPE
    }

    STORE {
        NUMBER ST_ID PK
        VARCHAR2 ST_NAME
        NUMBER RATING_POINT
        NUMBER SELLING_RATE
        CHAR IS_OPEN
        NUMBER AC_ID FK
        NUMBER ADDRESS_ID FK
        CHAR IS_ACTIVE
    }

    PRODUCT {
        NUMBER PRODUCT_ID PK
        VARCHAR2 PRODUCT_NAME
        VARCHAR2 TYPE
        NUMBER WEIGHT
        NUMBER PRODUCT_PRICE
        NUMBER ST_ID FK
        VARCHAR2 IMAGE_URL
        VARCHAR2 DESCRIPTION
        NUMBER STOCK
        NUMBER WIDTH
        NUMBER LENGTH
        NUMBER HEIGHT
        NUMBER RATING
        CHAR IS_ACTIVE
    }

    ORDERS {
        NUMBER ORDER_ID PK
        NUMBER AC_ID FK
        NUMBER ST_ID FK
        TIMESTAMP ORDER_DATE
        VARCHAR2 STATUS
        NUMBER RATING
        NUMBER PRICE_ID FK
        NUMBER SUM_WEIGHT
        NUMBER SUM_SIZE
        NUMBER DV_PRICE
        NUMBER ALL_PRODUCT_PRICE
        NUMBER TOTAL_PRICE
        VARCHAR2 TRACKING_NO
        VARCHAR2 PAYMENT_METHOD
        VARCHAR2 PAYMENT_STATUS
        NUMBER DEST_ADDRESS_ID FK
        DATE EST_DELIVERY_DATE
        NUMBER SHIPPING_PROVIDER_ID
    }

    ORDER_DETAIL {
        NUMBER ORDER_DETAIL_ID PK
        NUMBER ORDER_ID FK
        NUMBER PRODUCT_ID FK
        NUMBER QUANTITY
        NUMBER UNIT_PRICE
    }

    DVSERVICE {
        NUMBER DVSERVICE_ID PK
        VARCHAR2 DVSERVICE_NAME
        NUMBER DEFAULT_PRICE
    }

    SHOP_DVSERVICE {
        NUMBER ST_ID PK, FK
        NUMBER DVSERVICE_ID PK, FK
        CHAR IS_ACTIVE
        CHAR IS_PICKUP_ENABLED
        CHAR IS_DROPOFF_ENABLED
    }

    DVSERVICE_TYPE {
        NUMBER DVSERVICE_TYPE_ID PK
        VARCHAR2 TYPE_NAME
        NUMBER DEFAULT_TYPE_PRICE
    }

    WEIGHT_TIER {
        NUMBER WEIGHT_TIER_ID PK
        NUMBER MIN_WEIGHT
        NUMBER MAX_WEIGHT
        VARCHAR2 TIER_NAME
        NUMBER DEFAULT_WEIGHT_PRICE
    }

    SIZE_TIER {
        NUMBER SIZE_TIER_ID PK
        NUMBER MIN_SIZE
        NUMBER MAX_SIZE
        VARCHAR2 TIER_NAME
        NUMBER DEFAULT_SIZE_PRICE
    }

    PRICE {
        NUMBER PRICE_ID PK
        NUMBER DVSERVICE_ID FK
        NUMBER DVSERVICE_TYPE_ID FK
        NUMBER WEIGHT_TIER_ID FK
        NUMBER SIZE_TIER_ID FK
        NUMBER PRICE
        NUMBER COD_FEE_PERCENT
    }

    STATIC_ROUTE_FEE {
        NUMBER ROUTE_ID PK
        VARCHAR2 ROUTE_TYPE
        NUMBER EXTRA_FEE
        VARCHAR2 DESCRIPTION
    }

    SYSTEM_CONFIG {
        VARCHAR2 CONFIG_KEY PK
        VARCHAR2 CONFIG_VALUE
    }
```

---

### 3.2 รายละเอียดตารางทั้งหมด 13 ตาราง (Database Schema)

#### 1) กลุ่มผู้ใช้งานและที่อยู่ (User & Address Domain)
* **`HR.ACCOUNT`** — เก็บข้อมูลบัญชีผู้ใช้งานทั้งหมดในระบบ
  * **Primary Key**: `AC_ID` (`NUMBER`)
  * **Columns**: `USERNAME` (`VARCHAR2(50)`), `PASSWORD` (`VARCHAR2(255)`), `FNAME` (`VARCHAR2(100)`), `LNAME` (`VARCHAR2(100)`), `BIRTH_DATE` (`DATE`), `GENDER` (`VARCHAR2(10)`), `EMAIL` (`VARCHAR2(100)`), `PHONE` (`VARCHAR2(20)`), `TYPE` (`VARCHAR2(20)`: `'Customer'`, `'Seller'`, `'Employee'`, `'Admin'`), `REGISTERED_DATE` (`TIMESTAMP(6)`), `IS_ACTIVE` (`CHAR(1)` ค่าเริ่มต้น `'Y'`)
* **`HR.ADDRESS`** — เก็บข้อมูลสมุดที่อยู่ของลูกค้าและที่ตั้งของร้านค้า
  * **Primary Key**: `ADDRESS_ID` (`NUMBER`)
  * **Foreign Key**: `AC_ID` อ้างอิง `HR.ACCOUNT(AC_ID)`
  * **Columns**: `ADDRESS_LINE` (`VARCHAR2(500)`), `SUB_DISTRICT` (`VARCHAR2(100)`), `DISTRICT` (`VARCHAR2(100)`), `PROVINCE` (`VARCHAR2(100)`), `ZIP_CODE` (`VARCHAR2(10)`), `IS_DEFAULT` (`CHAR(1)`), `ADDRESS_TYPE` (`VARCHAR2(20)`: `'HOME'` สำหรับที่อยู่จัดส่งลูกค้า หรือ `'STORE'` สำหรับที่ตั้งร้านค้า)

#### 2) กลุ่มร้านค้าและสินค้า (Store & Product Domain)
* **`HR.STORE`** — เก็บข้อมูลร้านค้าของผู้ขาย
  * **Primary Key**: `ST_ID` (`NUMBER`)
  * **Foreign Keys**: `AC_ID` อ้างอิง `HR.ACCOUNT(AC_ID)` (อนุญาตให้เป็น `NULL` ได้กรณีร้านค้าถูกปลดเจ้าของ), `ADDRESS_ID` อ้างอิง `HR.ADDRESS(ADDRESS_ID)`
  * **Columns**: `ST_NAME` (`VARCHAR2(100)`), `RATING_POINT` (`NUMBER(3,2)` คะแนนรีวิวเฉลี่ย), `SELLING_RATE` (`NUMBER(10,2)` ยอดจำนวนสินค้าที่ขายได้สะสม), `IS_OPEN` (`CHAR(1)` สถานะเปิด/ปิดร้าน), `IS_ACTIVE` (`CHAR(1)`)
* **`HR.PRODUCT`** — เก็บข้อมูลสินค้า สต็อก และมิติขนาด/น้ำหนักสำหรับการคำนวณค่าขนส่ง
  * **Primary Key**: `PRODUCT_ID` (`NUMBER`)
  * **Foreign Key**: `ST_ID` อ้างอิง `HR.STORE(ST_ID)`
  * **Columns**: `PRODUCT_NAME` (`VARCHAR2(150)`), `TYPE` (`VARCHAR2(50)` หมวดหมู่สินค้า), `WEIGHT` (`NUMBER(8,2)` น้ำหนักเป็นกิโลกรัม), `PRODUCT_PRICE` (`NUMBER(10,2)`), `IMAGE_URL` (`VARCHAR2(500)`), `DESCRIPTION` (`VARCHAR2(2000)`), `STOCK` (`NUMBER(5,0)`), `WIDTH` (`NUMBER(6,2)`), `LENGTH` (`NUMBER(6,2)`), `HEIGHT` (`NUMBER(6,2)`), `RATING` (`NUMBER(3,2)`), `IS_ACTIVE` (`CHAR(1)`)

#### 3) กลุ่มคำสั่งซื้อและตะกร้าสินค้า (Order & Cart Domain)
* **`HR.ORDERS`** — เก็บข้อมูลใบสั่งซื้อและตะกร้าสินค้า (แยกใบสั่งซื้อตามร้านค้า)
  * **Primary Key**: `ORDER_ID` (`NUMBER`)
  * **Foreign Keys**: `AC_ID` -> `HR.ACCOUNT`, `ST_ID` -> `HR.STORE`, `PRICE_ID` -> `HR.PRICE`, `DEST_ADDRESS_ID` -> `HR.ADDRESS`
  * **Columns**: `ORDER_DATE` (`TIMESTAMP(6)`), `STATUS` (`VARCHAR2(50)`: `'Cart'`, `'Pending'`, `'Delivered'`, `'Reviewed'`), `RATING` (`NUMBER(3,2)`), `SUM_WEIGHT` (`NUMBER(8,2)`), `SUM_SIZE` (`NUMBER(8,2)`), `DV_PRICE` (`NUMBER(10,2)` ค่าจัดส่ง), `ALL_PRODUCT_PRICE` (`NUMBER(10,2)` ราคาสินค้ารวม), `TOTAL_PRICE` (`NUMBER(10,2)` ยอดรวมสุทธิ), `TRACKING_NO` (`VARCHAR2(100)`), `PAYMENT_METHOD` (`VARCHAR2(50)`), `PAYMENT_STATUS` (`VARCHAR2(50)`), `EST_DELIVERY_DATE` (`DATE` เวลาที่คาดว่าจะจัดส่งถึง), `SHIPPING_PROVIDER_ID` (`NUMBER`)
* **`HR.ORDER_DETAIL`** — เก็บรายการสินค้าย่อยภายในแต่ละใบสั่งซื้อ
  * **Primary Key**: `ORDER_DETAIL_ID` (`NUMBER`)
  * **Foreign Keys**: `ORDER_ID` -> `HR.ORDERS(ORDER_ID)`, `PRODUCT_ID` -> `HR.PRODUCT(PRODUCT_ID)`
  * **Columns**: `QUANTITY` (`NUMBER(5,0)`), `UNIT_PRICE` (`NUMBER(10,2)` ราคาต่อหน่วย ณ เวลาที่สั่งซื้อ)

#### 4) กลุ่มระบบโลจิสติกส์และโครงสร้างราคาค่าขนส่ง (Logistics & Pricing Engine Domain)
* **`HR.DVSERVICE`** — บริษัทผู้ให้บริการขนส่ง (เช่น Kerry, Flash, ไปรษณีย์ไทย)
  * **Primary Key**: `DVSERVICE_ID` (`NUMBER`) | **Columns**: `DVSERVICE_NAME` (`VARCHAR2(100)`), `DEFAULT_PRICE` (`NUMBER(10,2)`)
* **`HR.SHOP_DVSERVICE`** — ตารางเชื่อมโยงแบบกลุ่มต่อกลุ่ม (Many-to-Many Junction Table) ระหว่างร้านค้าและบริษัทขนส่งที่ร้านเลือกใช้
  * **Composite Primary Key / Foreign Keys**: `(ST_ID, DVSERVICE_ID)`
  * **Columns**: `IS_ACTIVE` (`CHAR(1)`), `IS_PICKUP_ENABLED` (`CHAR(1)`), `IS_DROPOFF_ENABLED` (`CHAR(1)`)
* **`HR.DVSERVICE_TYPE`** — ประเภทความเร็วในการจัดส่ง (เช่น Standard, Express, Same-Day)
  * **Primary Key**: `DVSERVICE_TYPE_ID` (`NUMBER`) | **Columns**: `TYPE_NAME` (`VARCHAR2(50)`), `DEFAULT_TYPE_PRICE` (`NUMBER(10,2)`)
* **`HR.WEIGHT_TIER`** — ช่วงเกณฑ์น้ำหนักพัสดุ
  * **Primary Key**: `WEIGHT_TIER_ID` (`NUMBER`) | **Columns**: `MIN_WEIGHT` (`NUMBER(8,2)`), `MAX_WEIGHT` (`NUMBER(8,2)`), `TIER_NAME` (`VARCHAR2(50)`), `DEFAULT_WEIGHT_PRICE` (`NUMBER(10,2)`)
* **`HR.SIZE_TIER`** — ช่วงเกณฑ์ขนาดพัสดุรวม (กว้าง + ยาว + สูง)
  * **Primary Key**: `SIZE_TIER_ID` (`NUMBER`) | **Columns**: `MIN_SIZE` (`NUMBER(8,2)`), `MAX_SIZE` (`NUMBER(8,2)`), `TIER_NAME` (`VARCHAR2(50)`), `DEFAULT_SIZE_PRICE` (`NUMBER(10,2)`)
* **`HR.PRICE`** — ตารางศูนย์กลางจับคู่อัตราค่าบริการขนส่งจาก 4 มิติ
  * **Primary Key**: `PRICE_ID` (`NUMBER`)
  * **Foreign Keys**: `DVSERVICE_ID`, `DVSERVICE_TYPE_ID`, `WEIGHT_TIER_ID`, `SIZE_TIER_ID`
  * **Columns**: `PRICE` (`NUMBER(10,2)`), `COD_FEE_PERCENT` (`NUMBER(4,2)`)
* **`HR.STATIC_ROUTE_FEE`** & **`HR.SYSTEM_CONFIG`** — ตารางกำหนดค่าธรรมเนียมเส้นทางและตัวแปรระบบ
  * `STATIC_ROUTE_FEE`: เก็บค่าธรรมเนียมตามเส้นทาง (`ROUTE_TYPE`: `'SAME_PROVINCE'` จังหวัดเดียวกัน หรือ `'CROSS_PROVINCE'` ข้ามจังหวัด) และ `EXTRA_FEE` (`NUMBER(10,2)`)
  * `SYSTEM_CONFIG`: เก็บการตั้งค่าระบบแบบ Key-Value (`CONFIG_KEY`, `CONFIG_VALUE`) เช่น `SHIPPING_DELAY_SEC` สำหรับกำหนดระยะเวลาจำลองการจัดส่งพัสดุ

---

### 3.3 เทคนิคและการออกแบบฝั่งฐานข้อมูล (Database Techniques)

1. **Soft Delete Pattern เพื่อรักษา Referential Integrity (`IS_ACTIVE = 'Y'/'N'`)**
   - ตารางหลักที่มีการอ้างอิงจากประวัติคำสั่งซื้อ ได้แก่ `ACCOUNT`, `STORE`, `PRODUCT`, และ `SHOP_DVSERVICE` ใช้คอลัมน์ `IS_ACTIVE` แทนการลบแถวข้อมูลจริงด้วย `DELETE`
   - ช่วยให้ใบเสร็จและประวัติการสั่งซื้อ (`ORDERS` / `ORDER_DETAIL`) ในอดีตยังคงแสดงชื่อสินค้า ชื่อร้านค้า และข้อมูลผู้ซื้อได้อย่างถูกต้องแม้สินค้าหรือร้านค้านั้นจะถูกลบออกจากหน้าร้านไปแล้ว
2. **Draft Order Pattern (การใช้ตาราง `ORDERS` เป็น Persistent Multi-Store Cart)**
   - แทนที่จะเก็บตะกร้าสินค้าไว้ใน `localStorage` ของเบราว์เซอร์ ระบบออกแบบให้รายการในตะกร้าถูกบันทึกเป็นแถวในตาราง `ORDERS` ที่มี `STATUS = 'Cart'` โดยแยกใบสั่งซื้อตามร้านค้า (`ST_ID`) อัตโนมัติ
   - ทำให้ข้อมูลตะกร้าสินค้าซิงค์ตรงกันทุกอุปกรณ์ และสามารถเปลี่ยนสถานะเป็นใบสั่งซื้อจริง (`Pending`) ได้ทันทีเมื่อชำระเงิน
3. **Multi-Dimensional Tier-Based Rate Lookup (การออกแบบตารางคำนวณค่าขนส่ง 4 มิติ)**
   - แยกองค์ประกอบของราคาขนส่งออกเป็นตารางอิสระ (`DVSERVICE`, `DVSERVICE_TYPE`, `WEIGHT_TIER`, `SIZE_TIER`) แล้วเชื่อมเข้าสู่ตาราง `PRICE` ร่วมกับ `STATIC_ROUTE_FEE`
   - ใช้การคิวรีแบบช่วงค่า (`BETWEEN MIN_WEIGHT AND MAX_WEIGHT` และ `BETWEEN MIN_SIZE AND MAX_SIZE`) ทำให้พนักงานสามารถปรับเปลี่ยนช่วงน้ำหนักหรือขนาดพัสดุได้โดยไม่ต้องแก้ไขโค้ดโปรแกรม
4. **Historical Price Snapshot (`ORDER_DETAIL.UNIT_PRICE`)**
   - เมื่อมีการเพิ่มสินค้าลงตะกร้าและสั่งซื้อ ระบบจะคัดลอก `PRODUCT.PRODUCT_PRICE` มาเก็บไว้ใน `ORDER_DETAIL.UNIT_PRICE` เพื่อตรึงราคาซื้อขายจริง ณ เวลาที่ทำรายการ ป้องกันปัญหาข้อมูลยอดเงินในใบเสร็จเพี้ยนเมื่อร้านค้าปรับราคาสินค้าในภายหลัง
5. **Dynamic ID Generation & Oracle Date Arithmetic**
   - ใช้ `SELECT NVL(MAX(ID), 0) + 1` สำหรับสร้าง Primary Key อัตโนมัติ และใช้การคำนวณเวลาของ Oracle (`CURRENT_DATE + (:delaySec / 86400)`) เพื่อคำนวณเวลาจัดส่งถึงปลายทาง (`EST_DELIVERY_DATE`) ในระดับวินาที

---

## ⚙️ 4. ส่วนที่ 2: ระบบฝั่งเซิร์ฟเวอร์ (Backend Layer - Node.js & Express)

### 4.1 โครงสร้างและเทคโนโลยีฝั่ง Backend
* **Runtime & Framework**: Node.js ร่วมกับ **Express v5.2.1** (รันที่พอร์ตเริ่มต้น `5000`)
* **Database Driver**: **node-oracledb v7.1.0** เชื่อมต่อตรงเข้าสู่ Oracle Database ผ่าน Connection Pool (`poolMin: 2`, `poolMax: 10`, `poolIncrement: 2`)
* **Configuration**: ตั้งค่า `oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT` เพื่อแปลงผลลัพธ์ SQL เป็น JavaScript Object โดยอัตโนมัติ และเปิด `oracledb.autoCommit = true` สำหรับคำสั่งเขียนข้อมูลทั่วไป

---

### 4.2 รายการ API Endpoints ทั้งหมด

#### 🔐 1) ระบบสมาชิกและบัญชีผู้ใช้ (Auth & Account)
| Method | Endpoint | คำอธิบาย |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | สมัครสมาชิกใหม่ (ดักจับ `ORA-00001` กรณี Username หรือ Email ซ้ำ) |
| `POST` | `/api/login` | เข้าสู่ระบบและตรวจสอบสถานะ `IS_ACTIVE = 'Y'` |
| `GET` | `/api/account/:id` | ดึงข้อมูลโปรไฟล์ล่าสุดของผู้ใช้ตาม `AC_ID` |
| `PUT` | `/api/auth/update` | แก้ไขข้อมูลส่วนตัว (ตรวจสอบรหัสผ่านปัจจุบัน และส่ง flag `requireRelogin: true` หากเปลี่ยน Email หรือ Password) |
| `DELETE` | `/api/auth/delete/:id` | ปิดการใช้งานบัญชีตนเอง (Soft Delete `IS_ACTIVE = 'N'`) |
| `POST` | `/api/account/switch-role` | สลับบทบาทระหว่าง `Customer` และ `Seller` (หากสลับกลับเป็น `Customer` จะสั่งปิดร้านค้าทั้งหมดอัตโนมัติ `IS_OPEN = 'N'`) |

#### 📍 2) ระบบสมุดที่อยู่ (Address Management)
| Method | Endpoint | คำอธิบาย |
| :--- | :--- | :--- |
| `GET` | `/api/address/:acId` | ดึงรายการที่อยู่ของผู้ใช้ (รองรับ `?type=HOME` หรือ `STORE`) โดยเรียง `IS_DEFAULT = 'Y'` ขึ้นก่อน |
| `POST` | `/api/address` | เพิ่มที่อยู่ใหม่ (หากตั้งเป็น `IS_DEFAULT = 'Y'` จะรีเซ็ตที่อยู่หลักเดิมเป็น `'N'` อัตโนมัติ) |
| `PUT` | `/api/address/:id` | แก้ไขข้อมูลที่อยู่และอัปเดตสถานะที่อยู่หลัก (`IS_DEFAULT`) |

#### 🛍️ 3) ระบบสินค้าและร้านค้า (Products & Stores)
| Method | Endpoint | คำอธิบาย |
| :--- | :--- | :--- |
| `GET` | `/api/products` | ดึงสินค้าทั้งหมดพร้อมอัลกอริทึมจัดอันดับความน่าสนใจเฉพาะบุคคล (`acId`) หรือสุ่มลำดับ (`shuffle=true`) |
| `GET` | `/api/products/:id` | ดึงรายละเอียดสินค้าเชิงลึกพร้อมข้อมูลร้านค้าและจังหวัดที่ตั้งร้าน |
| `POST` | `/api/products` | เพิ่มสินค้าใหม่เข้าสู่ร้านค้า (ตรวจสอบสิทธิ์เจ้าของร้านหรือ Admin) |
| `PUT` | `/api/products/:id` | แก้ไขรายละเอียดสินค้า ขนาด น้ำหนัก และสต็อก |
| `DELETE` | `/api/products/:id` | ลบสินค้าแบบ Soft Delete (`IS_ACTIVE = 'N'`) |
| `GET` | `/api/stores` | ดึงรายการร้านค้าทั้งหมดพร้อมข้อมูลที่ตั้ง |
| `GET` | `/api/stores/:stId` | ดึงข้อมูลหน้าร้านค้า 1 ร้าน พร้อมรายการขนส่งที่ร้านเปิดใช้งาน |
| `GET` | `/api/stores/:stId/products` | ดึงรายการสินค้าทั้งหมดที่วางจำหน่ายในร้านค้านั้นๆ |
| `POST` | `/api/stores` | เปิดร้านค้าใหม่ให้กับผู้ขาย (พร้อมอัปเกรดบทบาทเป็น `Seller` อัตโนมัติ) |
| `PUT` | `/api/stores/:stId` | แก้ไขชื่อร้านค้าและที่ตั้งร้าน (`ADDRESS_ID`) |
| `PUT` | `/api/stores/:stId/status` | เปิด/ปิดสถานะร้านค้า (`IS_OPEN = 'Y'/'N'`) |
| `DELETE` | `/api/stores/:id` | ปิดร้านค้าแบบ Soft Delete (`IS_ACTIVE = 'N'` และ `IS_OPEN = 'N'`) |
| `GET` | `/api/stores/:stId/services` | ดึงรายการบริษัทขนส่งที่ร้านค้าเปิดให้บริการ (`IS_ACTIVE = 'Y'`) |
| `GET` | `/api/stores/:stId/services/all` | ดึงรายการบริษัทขนส่งทั้งหมดในระบบพร้อมสถานะการเปิดใช้ของร้านค้า |
| `PUT` | `/api/stores/:stId/services` | บันทึกการตั้งค่าบริษัทขนส่งของร้าน (`IS_ACTIVE`, `IS_PICKUP_ENABLED`, `IS_DROPOFF_ENABLED`) |

#### 🛒 4) ระบบตะกร้าสินค้า คำนวณค่าส่ง และคำสั่งซื้อ (Cart, Shipping & Orders)
| Method | Endpoint | คำอธิบาย |
| :--- | :--- | :--- |
| `GET` | `/api/cart/:acId` | ดึงรายการสินค้าในตะกร้า (`STATUS = 'Cart'`) พร้อมสถานะร้านค้าและสต็อกคงเหลือ |
| `POST` | `/api/cart/add` | เพิ่มสินค้าลงตะกร้า (ตรวจสอบสต็อกคงเหลือและบวกทบจำนวนเดิมในบิล `'Cart'`) |
| `PUT` | `/api/cart/update` | ปรับเพิ่ม/ลดจำนวนสินค้าในตะกร้า (ตรวจสอบสต็อกสูงสุด หรือลบรายการเมื่อ `newQty <= 0`) |
| `POST` | `/api/cart/calculate-shipping`| คำนวณค่าจัดส่งล่วงหน้าตามสินค้าที่ติ๊กเลือก ขนส่ง ประเภทบริการ และจังหวัดต้นทาง-ปลายทาง |
| `POST` | `/api/cart/checkout` | ยืนยันการสั่งซื้อ รองรับการเลือกชำระบางรายการ (Partial Checkout) แยกบิลอัตโนมัติ และตัดสต็อกจริง |
| `GET` | `/api/orders` | ดึงรายการคำสั่งซื้อทั้งหมด พร้อมอัปเดตสถานะ `Pending -> Delivered` อัตโนมัติเมื่อถึงกำหนดส่ง |
| `POST` | `/api/orders/:orderId/receive`| ยืนยันการรับสินค้า บันทึกคะแนนรีวิว และคำนวณคะแนนเฉลี่ยสินค้า/ร้านค้า + ยอดขายสะสมใหม่ |

#### 🚚 5) ระบบจัดการขนส่งและผู้ดูแลระบบ (Logistics & Admin Management)
| Method | Endpoint | คำอธิบาย |
| :--- | :--- | :--- |
| `GET` | `/api/shipping/config-prices` | ดึงข้อมูลโครงสร้างราคาขนส่งทั้งหมด (บริการ, ประเภท, เกณฑ์น้ำหนัก/ขนาด, ค่าธรรมเนียมเส้นทาง) |
| `GET/PUT` | `/api/admin/size-tiers` | ดึงและแก้ไขระดับขนาดกล่อง (`SIZE_TIER`) |
| `GET/PUT` | `/api/admin/weight-tiers` | ดึงและแก้ไขระดับน้ำหนักพัสดุ (`WEIGHT_TIER`) |
| `GET/PUT` | `/api/admin/route-fees` | ดึงและแก้ไขค่าธรรมเนียมเส้นทาง (`SAME_PROVINCE` / `CROSS_PROVINCE`) |
| `GET/PUT` | `/api/admin/prices` | ดึงและแก้ไขตารางจับคู่ราคาค่าขนส่ง (`PRICE`) |
| `GET/PUT` | `/api/config/shipping-delay` | ดึงและตั้งค่าระยะเวลาจำลองการจัดส่ง (`SHIPPING_DELAY_SEC`) |
| `GET` | `/api/admin/users-and-stores` | ดึงข้อมูลผู้ใช้และร้านค้าที่เปิดใช้งานทั้งหมดสำหรับหน้าจัดการของ Admin/Employee |
| `PUT` | `/api/admin/users/:acId` | แก้ไขข้อมูลผู้ใช้และเปลี่ยนบทบาท (หากเปลี่ยนเป็น `Customer`/`Employee` จะปิดร้านค้าให้อัตโนมัติ) |
| `PUT` | `/api/admin/stores/:stId/reassign` | โอนย้ายเจ้าของร้านค้าให้ผู้ใช้คนอื่น หรือปลดเจ้าของร้านออก (`AC_ID = NULL`, `IS_OPEN = 'N'`) |

---

### 4.3 เทคนิคและอัลกอริทึมฝั่ง Backend (Backend Techniques)

#### 1) Personalized Recommendation & Deterministic Cold-Start Scoring (`GET /api/products`)
เมื่อผู้ใช้เปิดหน้าแรก ระบบจะวิเคราะห์ประวัติการสั่งซื้อ (`ORDERS` + `ORDER_DETAIL`) ของผู้ใช้คนนั้น เพื่อนับความถี่ของหมวดหมู่สินค้า (`typeCnt`) และร้านค้าที่เคยซื้อ (`storeCnt`) จากนั้นคำนวณคะแนนความน่าสนใจ (`_score`) ให้สินค้าแต่ละชิ้นด้วยสมการ:

$$\text{Score} = \text{OpenBonus} + (\text{typeCnt} \times 2000) + (\text{storeCnt} \times 1000) + (\text{Rating} \times 50) + \text{ColdStartHash}$$

* **Open Store Priority (`OpenBonus`)**: สินค้าจากร้านที่เปิดอยู่ (`IS_OPEN = 'Y'`) จะได้รับคะแนนพิเศษ `+100,000` เพื่อดันให้อยู่เหนือร้านที่ปิดชั่วคราวเสมอ
* **Cold-Start Deterministic Pseudo-Random Hash**: สำหรับผู้ใช้ใหม่ที่ยังไม่มีประวัติการซื้อ ระบบใช้ฟังก์ชันตรีโกณมิติผูกกับรหัสผู้ใช้และรหัสสินค้า:
  ```javascript
  const pseudoRandom = Math.abs(Math.sin(Number(acId) * 137 + Number(p.PRODUCT_ID) * 79)) * 500;
  ```
  ช่วยให้ผู้ใช้แต่ละคนเห็นลำดับการแนะนำสินค้าที่หลากหลายแตกต่างกัน แต่ยังคงลำดับเดิมอย่างคงที่เมื่อรีเฟรชหน้า (จนกว่าจะกดปุ่มสุ่มสินค้า ซึ่งใช้ **Fisher-Yates Shuffle Algorithm**)

#### 2) Partial Cart Checkout & Dynamic Order Splitting (`POST /api/cart/checkout`)
ลูกค้าสามารถติ๊กเลือกชำระเงินเฉพาะสินค้าบางชิ้นในตะกร้าได้ แม้สินค้านั้นจะอยู่ในร้านเดียวกันก็ตาม โดยระบบทำงานดังนี้:
1. **Pre-Flight Validation**: ตรวจสอบสถานะร้านค้า (`IS_OPEN === 'Y'`) และเช็คจำนวนสต็อกคงเหลือ (`STOCK >= QUANTITY`) ของทุกรายการที่เลือกก่อนเริ่มทำรายการ
2. **Order Splitting Logic**:
   - **กรณีเลือกสินค้าครบทุกชิ้นในร้านนั้น**: อัปเดตแถว `ORDERS` เดิมจาก `STATUS = 'Cart'` เป็น `'Pending'` ทันที
   - **กรณีเลือกเฉพาะบางชิ้นในร้านนั้น (Partial Selection)**: ระบบจะสร้างแถว `ORDERS` ใบใหม่ (`finalOrderId`) สำหรับรายการที่กำลังจะชำระเงิน แล้วสั่งย้าย `ORDER_DETAIL` เฉพาะชิ้นที่เลือกไปยัง `finalOrderId` ส่วนแถว `ORDERS` ใบเดิมจะถูกคำนวณราคาสินค้ารวม (`TOTAL_PRICE`) ของชิ้นที่ยังค้างอยู่ในตะกร้าใหม่โดยอัตโนมัติ พร้อมตัดสต็อก `PRODUCT.STOCK` ตามจำนวนที่สั่งซื้อจริง

#### 3) Multi-Factor Shipping Fee Calculation Engine (`POST /api/cart/calculate-shipping`)
ระบบคำนวณค่าจัดส่งตามจริงจาก 5 ปัจจัยหลักของพัสดุในแต่ละร้านค้า:
1. **น้ำหนักรวม (`sumWeight`)**: $\sum (\text{QUANTITY} \times \text{WEIGHT})$
2. **ขนาดพัสดุรวม (`sumSize`)**: $\sum (\text{QUANTITY} \times (\text{WIDTH} + \text{LENGTH} + \text{HEIGHT}))$
3. **ค้นหาเกณฑ์ (`WEIGHT_TIER` & `SIZE_TIER`)**: ค้นหา Tier ที่ตรงกับ `sumWeight` และ `sumSize` ด้วยเงื่อนไข `BETWEEN` (พร้อม Fallback ไปยัง Tier สูงสุดหากน้ำหนัก/ขนาดเกินตาราง)
4. **เปรียบเทียบจังหวัดต้นทาง-ปลายทาง (`STATIC_ROUTE_FEE`)**: นำ `PROVINCE` ของที่ตั้งร้านค้า (`STORE.ADDRESS_ID`) มาเทียบกับ `PROVINCE` ของที่อยู่จัดส่งลูกค้า (`DEST_ADDRESS_ID`) หากอยู่จังหวัดเดียวกันคิดเรท `SAME_PROVINCE` หากคนละจังหวัดคิดเรท `CROSS_PROVINCE`
5. **รวมยอดค่าขนส่งสุทธิ (`dvPrice`)**:
   $$\text{dvPrice} = \text{BasePrice} + \text{DefaultServicePrice} + \text{DefaultTypePrice} + \text{DefaultWeightPrice} + \text{DefaultSizePrice} + \text{RouteExtraFee}$$

#### 4) Real-Time Delivery Simulation & Auto-Status Transition (`GET /api/orders`)
* เมื่อลูกค้าสั่งซื้อสำเร็จ ระบบจะดึงค่า `SHIPPING_DELAY_SEC` จากตาราง `SYSTEM_CONFIG` เพื่อตั้งค่า `EST_DELIVERY_DATE = CURRENT_DATE + (:delaySec / 86400)`
* ทุกครั้งที่ Frontend ดึงข้อมูลคำสั่งซื้อ (`GET /api/orders`) Backend จะรันคำสั่ง SQL อัปเดตสถานะอัตโนมัติสำหรับใบสั่งซื้อที่ถึงเวลาจัดส่งแล้ว:
  ```sql
  UPDATE ORDERS
  SET STATUS = 'Delivered',
      EST_DELIVERY_DATE = NVL(EST_DELIVERY_DATE, CURRENT_DATE)
  WHERE AC_ID = :1 AND STATUS = 'Pending'
    AND (EST_DELIVERY_DATE IS NULL OR CURRENT_DATE >= EST_DELIVERY_DATE)
  ```

#### 5) Cascading Review, Rating & Selling Rate Aggregation (`POST /api/orders/:orderId/receive`)
เมื่อลูกค้ากดรับสินค้าและให้คะแนนดาว (1–5 ดาว):
1. อัปเดตใบสั่งซื้อเป็น `STATUS = 'Reviewed'` และ `PAYMENT_STATUS = 'Approved'`
2. คำนวณคะแนนเฉลี่ยใหม่ (`AVG(o.RATING)`) ให้กับสินค้าทุกชิ้นในใบสั่งซื้อนั้น แล้วบันทึกลง `PRODUCT.RATING`
3. คำนวณคะแนนเฉลี่ยของร้านค้า (`STORE.RATING_POINT`) ใหม่จากค่าเฉลี่ยคะแนนของสินค้าทั้งหมดในร้าน (พร้อมกลไก **Schema Fallback Resilience** ที่สลับไปคำนวณจาก `AVG(ORDERS.RATING)` ทันทีหากตาราง `PRODUCT` ยังไม่มีคอลัมน์ `RATING`)
4. คำนวณยอดขายสะสมของร้านค้า (`STORE.SELLING_RATE`) ใหม่จากผลรวม `SUM(ORDER_DETAIL.QUANTITY)` ของคำสั่งซื้อในร้าน

---

## 🎨 5. ส่วนที่ 3: ระบบฝั่งส่วนติดต่อผู้ใช้ (Frontend Layer - React 19)

### 5.1 โครงสร้างหน้าเว็บและคอมโพเนนต์ (Pages & Components)

| ไฟล์ / คอมโพเนนต์ | หน้าที่และฟีเจอร์เด่น |
| :--- | :--- |
| **`LiquidGlassCard.jsx`** | คอมโพเนนต์การ์ดกระจกเหลวแบบ Reusable ที่จำลองการหักเหของแสงผ่าน WebGL 1.0 Fragment Shader และ SVG `<feDisplacementMap>` |
| **`components/AmbientBackground.js`** | เลเยอร์แสงออร่าพื้นหลังเคลื่อนไหวแบบเรียลไทม์ (5 Drifting Orbs + Radial Wash) ที่ทำงานบน GPU Compositor Thread 100% |
| **`components/Navbar.js`** | แถบเมนู Liquid Glass ด้านบน รองรับการค้นหาแบบ Instant Autocomplete (แยกหมวดหมู่ ร้านค้า และสินค้า), ตัวนับตะกร้าพร้อมแอนิเมชัน `badgePop` และปุ่มสลับธีม |
| **`Pages/Home.js`** | หน้าแรกของแพลตฟอร์ม แสดงแถบจัดเรียง (`แนะนำสำหรับคุณ`, `สุ่มสินค้าใหม่`, `เรตติ้ง`, `ราคา`), แถบกรองหมวดหมู่ด่วน (Category Pills), Skeleton Loading และระบบแบ่งหน้า (Pagination 10/20/40 ชิ้นต่อหน้า) |
| **`Pages/Product.js`** | หน้ารายละเอียดสินค้า แสดงข้อมูลขนาดพัสดุ น้ำหนัก สต็อก คะแนนรีวิว ลิงก์ร้านค้า ตัวเลือกจำนวน และปุ่ม **เพิ่มลงตะกร้า** / **ซื้อเลยทันที** |
| **`Pages/Store.js`** | หน้าโปรไฟล์ร้านค้า แสดงคะแนนร้านค้า ยอดขายสะสม ที่ตั้งร้าน ช่องทางขนส่งที่รองรับ (`Pickup`/`Dropoff`) พร้อมระบบค้นหา จัดเรียง และแบ่งหน้าสินค้าภายในร้าน |
| **`Pages/Market.js`** | ศูนย์รวมตะกร้าสินค้าและการติดตามพัสดุ: รองรับการเลือกชำระบางรายการ (Partial Selection), สรุปยอดแบบ Sticky Card, หลอดสถานะจัดส่ง `LiquidGlassCard` เคลื่อนไหวตามเวลาจริง และ Modal ให้คะแนนร้านค้า |
| **`Pages/OrderHistory.js`** | แสดงประวัติคำสั่งซื้อที่ได้รับสินค้าและรีวิวเสร็จสมบูรณ์แล้วทั้งหมด พร้อมรายละเอียดรายการสินค้าและคะแนนดาวที่ให้ |
| **`Pages/Profile.js`** | จัดการข้อมูลบัญชีผู้ใช้, สมุดที่อยู่จัดส่ง, การสร้างและตั้งค่าร้านค้าหลายร้าน (แก้ไขชื่อ/ที่ตั้ง/เลือกขนส่งประจำร้าน), ปุ่มสลับบทบาท `Customer <-> Seller`, และตั้งค่าเวลาจัดส่งสำหรับ Admin |
| **`Pages/ProductManager.js`** | ระบบหลังบ้านของผู้ขายและ Admin สำหรับเพิ่ม/แก้ไข/ลบสินค้าในร้าน ตั้งค่าขนาด-น้ำหนักพัสดุ และแก้ไขข้อมูลร้านค้า |
| **`Pages/ShippingManager.js`** | ระบบหลังบ้านสำหรับ Employee และ Admin เพื่อปรับแต่งเรทขนาดกล่อง (`Size Tiers`), น้ำหนัก (`Weight Tiers`), และค่าส่งตามเขต (`Static Route Fee`) |
| **`Pages/ManageUsers.js` & `ManageEmployees.js`** | ระบบหลังบ้านสำหรับจัดการข้อมูลลูกค้า/ผู้ขาย โอนย้ายร้านค้าหรือปลดเจ้าของร้าน (`Orphaned Stores`) และเลื่อนขั้น/ปลดพนักงาน พร้อมระบบ Pagination |

---

### 5.2 เทคนิคขั้นสูงฝั่ง Frontend (Frontend Techniques)

#### 1) Two-Tier Glassmorphism Architecture & WebGL Context Budgeting
เพื่อให้หน้าเว็บมีความสวยงามระดับ **Apple Liquid Glass** โดยไม่เกิดคอขวดด้านประสิทธิภาพหรือเกินขีดจำกัด WebGL Context ของเบราว์เซอร์ ระบบจึงออกแบบสถาปัตยกรรมกระจกเป็น **2 ระดับ (Two-Tier System)**:
* **Tier 1 — Focal Interactive Liquid Glass (`LiquidGlassCard.jsx` + `.liquid-glass-surface`)**:
  - **SVG Displacement Refraction (`backdrop-filter`)**: วาดแผนที่เวกเตอร์การหักเหแสงลงบน Offscreen HTML5 Canvas โดยเข้ารหัสทิศทางแกน X ลงในช่องสีแดง (`R`) และแกน Y ลงในช่องสีเขียว (`G`) ตามสมการขอบโค้ง $p = (1 - t)^3$ แล้วส่งเข้า `<feImage>` $\rightarrow$ `<feGaussianBlur>` $\rightarrow$ `<feDisplacementMap>` เพื่อหักเหพิกเซลพื้นหลังจริง
  - **Custom WebGL 1.0 Fragment Shader (GLSL)**: คำนวณระยะขอบมนด้วย **Signed Distance Function (`sdRoundedBox`)**, สร้างมิติขอบแก้ว 3D Bevel Normal, รอยบุ๋มเลนส์ตามเมาส์ (**Mouse Lens Dent**), แสงสะท้อนขอบแก้ว (**Specular Rim Highlight**), และจำลองคลื่นน้ำกระฉอก (**Physics-Based Liquid Wave Simulation**) สำหรับหลอดสถานะจัดส่ง
  - **WebGL Context Cap**: ในหน้า `Market.js` ระบบจำกัดการใช้ `<LiquidGlassCard>` สำหรับหลอดสถานะจัดส่งไว้ไม่เกิน 4 รายการแรก (`orderIdx < 4`) และสลับไปใช้ CSS Gradient Progress Bar อัตโนมัติสำหรับรายการที่ 5 ขึ้นไป เพื่อป้องกันปัญหา WebGL Context Lost
* **Tier 2 — Zero-WebGL CSS Frosted & Layered Glass (`.glass-panel`, `.glass-sheer`, `.glass-subtle`, `.glass-pill`)**:
  - `.glass-panel`: กระจกฝ้าความอิ่มสีสูง (`backdrop-filter: blur(16px) saturate(165%)`) สำหรับการ์ดสินค้า ตาราง และกล่องเนื้อหาทั่วไป (ใช้ WebGL Context = 0)
  - `.glass-sheer`: พื้นผิวกระจกโปร่งแสงที่ **ไม่ใช้ `backdrop-filter`** สำหรับครอบคอนเทนเนอร์แม่ที่มี `<LiquidGlassCard>` อยู่ด้านใน เพื่อป้องกันบั๊ก **Nested Backdrop-Filter Clipping** บนเบราว์เซอร์ตระกูล Chromium
  - `.glass-subtle` & `.glass-pill`: พื้นผิวย่อยด้านในการ์ดและปุ่มตัวกรองหมวดหมู่

#### 2) GPU-Accelerated Dynamic Ambient Light Mesh (`AmbientBackground.js` & `index.css`)
* สร้างเลเยอร์แสงออร่าพื้นหลังเคลื่อนไหว (`ambient-orb-1` ถึง `ambient-orb-5` และ `ambient-bg-wash`) ที่ทำงานบน **GPU Compositor Thread 100%** ด้วย `transform: translate3d(...) scale(...)`
* ใช้ `radial-gradient(circle var(--in-oklch), ...)` หลายระดับความโปร่งใสแทนการใช้ `filter: blur()` ทำให้ภาระการคำนวณ Paint บน Main Thread เป็นศูนย์ (`0ms Paint Cost`) พร้อม `contain: strict` และ `isolation: isolate`
* เปลี่ยนโทนสีและโหมดการผสมแสง (`--ambient-blend: normal` ในโหมดสว่าง และ `screen` ในโหมดมืด) อัตโนมัติทันทีตั้งแต่เฟรมแรกของการสลับธีม

#### 3) Circular View Transitions API Theme Toggle & Zero-FOUC (`ThemeContext.js` & `index.css`)
* **Zero-FOUC (Flash of Unstyled Content Prevention)**: สคริปต์ใน `<head>` ของ `public/index.html` ตรวจสอบธีมจาก `localStorage` และ `prefers-color-scheme` เพื่อตั้งค่า `data-theme` ก่อนที่เบราว์เซอร์จะวาดเฟรมแรก
* **Circular Clip-Path Reveal Animation**: เมื่อกดปุ่มสลับธีม ระบบจะดึงพิกัด `(x, y)` ของปุ่ม คำนวณรัศมีไปยังมุมจอที่ไกลที่สุดด้วย `Math.hypot()` แล้วเรียกใช้ `document.startViewTransition()` ร่วมกับ `flushSync()` เพื่อขยายวงกลมธีมใหม่ (`clipPath: circle(...)`) ออกจากปุ่มที่คลิก พร้อมหมุนปุ่มด้วย Web Animations API (`btn.animate(...)`)
* **Snapshot Transition Freeze**: ใส่คลาส `:root.theme-transitioning` เพื่อปิด `transition-duration: 0s !important` ของทุก Element ชั่วคราวระหว่างแคปเจอร์สแนปช็อต ป้องกันการ Repaint ซ้ำซ้อน
* **Comprehensive Dark Mode Engine**: ผสมผสาน `light-dark()`, ปริภูมิสี `in oklab` / `in oklch`, `@property` สำหรับ `<progress class="loading-spinner">`, และระบบ **Attribute Selector Override (`[style*=...]`)** ใน `index.css` ที่แปลงสีพื้นหลัง ข้อความ และเส้นขอบของ Inline Styles ทั้งหมดให้เป็นโทนกระจกมืดอย่างสมบูรณ์

#### 4) Semantic NLP Toast Notification & Promise-Based Confirmation Modal (`PopupContext.js`)
* แทนที่ `window.alert` และ `window.confirm` ทั้งระบบด้วย Context Hook (`usePopup`) ดีไซน์ Frosted Glass (`backdropFilter: blur(18px-22px) saturate(175%-180%)`)
* **Semantic Keyword Auto-Inference (`inferToastType`)**: วิเคราะห์ข้อความแจ้งเตือนอัตโนมัติเพื่อเลือกธีมสีและไอคอน (`success`, `error`, `warning`, `info`) พร้อมหลอดเวลานับถอยหลัง 3.2 วินาที
* **Promise-Based Modal Queue (`await showConfirm()`)**: รองรับการเขียนโค้ดแบบ Asynchronous (`if (!(await showConfirm("..."))) return;`) พร้อมตรวจจับคำสำคัญที่มีความเสี่ยงสูง (`"ลบ"`, `"ปลด"`, `"ปิดร้าน"`, `"🚨"`) เพื่อเปลี่ยนปุ่มยืนยันเป็นสีแดง (`Danger Mode`) อัตโนมัติ และรองรับการกดปุ่ม `Escape`

#### 5) Event-Driven Cross-Component Synchronization & Dual-Loop Delivery Tracker
* **Custom DOM Events (`cart-updated`)**: ซิงค์จำนวนสินค้าในตะกร้าบน `Navbar.js` ทันทีผ่าน `window.dispatchEvent(new CustomEvent("cart-updated"))` พร้อมแอนิเมชันเด้งขยาย (`badgePop`)
* **Real-Time Dual-Loop Delivery Tracker (`Market.js`)**: อัปเดตเวลาทุก **1 วินาที** เพื่อให้หลอดคลื่นน้ำ `LiquidGlassCard` เคลื่อนที่อย่างลื่นไหล และซิงค์สถานะกับ Backend ทุก **3 วินาที** เพื่อเปลี่ยนสถานะเป็น `"🎉 พัสดุถึงแล้ว"` ทันทีที่ถึงกำหนดส่ง
* **React Portal (`createPortal`)**: เรนเดอร์ Modal ให้คะแนนร้านค้าใน `Market.js` ออกไปยัง `document.body` โดยตรงเพื่อให้ครอบคลุมเต็มหน้าจอเสมอ

---

## 🚀 6. การติดตั้งและเริ่มต้นใช้งาน (Installation & Setup)

### สิ่งที่ต้องเตรียมล่วงหน้า (Prerequisites)
1. **Node.js** (แนะนำเวอร์ชัน 18 ขึ้นไป) และ **npm**
2. **Oracle Database 21c (Express Edition)** ที่เปิดใช้งาน Service `XEPDB1` และมีตารางภายใต้ Schema `HR`

---

### ขั้นตอนที่ 1: ตั้งค่าและรันฝั่ง Backend (`be/`)

1. เปิดเทอร์มินัลและเข้าไปยังโฟลเดอร์ `be`:
   ```bash
   cd be
   npm install
   ```
2. สร้างหรือตรวจสอบไฟล์ `.env` ในโฟลเดอร์ `be/`:
   ```env
   DB_USER=hr
   DB_PASSWORD=รหัสผ่านฐานข้อมูลของคุณ
   DB_CONNECTION_STRING=localhost:1521/XEPDB1
   PORT=5000
   ```
3. เริ่มต้นรันเซิร์ฟเวอร์ Backend:
   ```bash
   # โหมดพัฒนา (รีสตาร์ทอัตโนมัติด้วย nodemon)
   npm run dev

   # หรือรันด้วยโหมดปกติ
   npm start
   ```
   > เซิร์ฟเวอร์ Backend จะทำงานที่ `http://localhost:5000`

---

### ขั้นตอนที่ 2: ตั้งค่าและรันฝั่ง Frontend (`fe/`)

1. เปิดเทอร์มินัลใหม่และเข้าไปยังโฟลเดอร์ `fe`:
   ```bash
   cd fe
   npm install
   ```
2. เริ่มต้นรันแอปพลิเคชัน React:
   ```bash
   npm start
   ```
   > เว็บแอปพลิเคชันจะเปิดขึ้นที่ `http://localhost:3000` พร้อมเชื่อมต่อกับ Backend API ที่พอร์ต `5000` โดยอัตโนมัติ
