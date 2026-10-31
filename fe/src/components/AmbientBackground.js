import React from "react";

/**
 * AmbientBackground
 * เลเยอร์แสงพื้นหลังเคลื่อนไหวแบบ Real-time (Dynamic Ambient Light Mesh)
 * - ทำงานบน GPU Compositor Thread 100% ด้วย transform: translate3d() และ scale()
 * - ใช้ radial-gradient หลายระดับแทน filter: blur() เพื่อลดภาระการคำนวณ Paint เป็นศูนย์
 * - เปลี่ยนโทนสีอัตโนมัติตาม Light / Dark Mode ผ่าน CSS Variables ทันทีตั้งแต่เฟรมแรกของ View Transition
 */
function AmbientBackground() {
  return (
    <div
      className="ambient-bg-root"
      aria-hidden="true"
      data-html2canvas-ignore="true"
    >
      <div className="ambient-bg-wash" />
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />
      <div className="ambient-orb ambient-orb-4" />
      <div className="ambient-orb ambient-orb-5" />
    </div>
  );
}

export default AmbientBackground;

