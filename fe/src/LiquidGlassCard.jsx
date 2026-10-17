import React, { useEffect, useRef, useState, useId } from "react";
import { useTheme } from "./context/ThemeContext";

// แปลงสี Hex (#3b82f6) หรือ Array [r, g, b] ให้เป็น Normalized RGB [0..1]
function parseNormalizedColor(input, fallback = [0.1, 0.5, 1.0]) {
  if (Array.isArray(input) && input.length === 3) {
    return input.map((v) => (v > 1 ? v / 255 : v));
  }
  if (typeof input === "string") {
    const hex = input.trim().replace("#", "");
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16) / 255;
      const g = parseInt(hex[1] + hex[1], 16) / 255;
      const b = parseInt(hex[2] + hex[2], 16) / 255;
      if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
        return [r, g, b];
      }
    } else if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
        return [r, g, b];
      }
    }
  }
  return fallback;
}

/**
 * สร้างแผนที่การหักเหแสง (Displacement Map) ด้วยสมการเดียวกับ Fragment Shader เดิม:
 * - Red Channel (R)   = การหักเหแกน X (128 = ไม่หักเห)
 * - Green Channel (G) = การหักเหแกน Y (128 = ไม่หักเห)
 */
function buildDisplacementDataUrl({
  dispCanvas,
  width,
  height,
  borderRadius,
  bevelRatio,
  mouseX,
  mouseY,
  mousePresence,
}) {
  if (!width || !height) return "";

  const scale = Math.min(0.4, 220 / Math.max(width, height, 1));
  const cw = Math.max(32, Math.round(width * scale));
  const ch = Math.max(20, Math.round(height * scale));

  if (dispCanvas.width !== cw || dispCanvas.height !== ch) {
    dispCanvas.width = cw;
    dispCanvas.height = ch;
  }

  const ctx = dispCanvas.getContext("2d");
  const imgData = ctx.createImageData(cw, ch);
  const data = imgData.data;

  const cx = width * 0.5;
  const cy = height * 0.5;
  const r = Math.min(borderRadius, cx, cy);
  const bevelWidth = Math.max(1, Math.min(cx, cy) * bevelRatio);

  const mx = mouseX * width;
  const my = (1.0 - mouseY) * height;
  const dentRadius = 150.0;

  let idx = 0;
  for (let y = 0; y < ch; y++) {
    const py = ((y + 0.5) / ch) * height;
    const dy = py - cy;
    const qy = Math.abs(dy) - (cy - r);

    for (let x = 0; x < cw; x++) {
      const px = ((x + 0.5) / cw) * width;
      const dx = px - cx;
      const qx = Math.abs(dx) - (cx - r);

      // 1. Signed Distance Function (sdRoundedBox)
      const maxQx = Math.max(qx, 0);
      const maxQy = Math.max(qy, 0);
      const dist =
        Math.hypot(maxQx, maxQy) + Math.min(Math.max(qx, qy), 0) - r;

      // 2. ขอบโค้ง Bevel (curve = pow(edgeFactor, 2.5))
      const edgeFactor = Math.max(0, Math.min(1, 1 + dist / bevelWidth));
      const curve = Math.pow(edgeFactor, 2.5);

      const centerLen = Math.hypot(dx, dy) || 0.0001;
      const edgeNormalX = (dx / centerLen) * curve;
      const edgeNormalY = (dy / centerLen) * curve;

      // 3. เลนส์บุ๋มตามตำแหน่งเมาส์ (Mouse Dent)
      let mouseNormalX = 0;
      let mouseNormalY = 0;
      if (mousePresence > 0.001) {
        const toMouseX = px - mx;
        const toMouseY = py - my;
        const mouseDist = Math.hypot(toMouseX, toMouseY);
        if (mouseDist < dentRadius) {
          const t = (dentRadius - mouseDist) / dentRadius;
          const dentStrength = t * t * (3 - 2 * t);
          const mLen = mouseDist || 0.0001;
          const amp =
            Math.sin(dentStrength * Math.PI) *
            0.6 *
            mousePresence *
            (1.0 - curve * 0.5);
          mouseNormalX = (toMouseX / mLen) * amp;
          mouseNormalY = (toMouseY / mLen) * amp;
        }
      }

      const finalNormalX = edgeNormalX + mouseNormalX;
      const finalNormalY = edgeNormalY + mouseNormalY;

      const rChan = Math.max(
        0,
        Math.min(255, Math.round(128 - finalNormalX * 127.5)),
      );
      const gChan = Math.max(
        0,
        Math.min(255, Math.round(128 - finalNormalY * 127.5)),
      );

      data[idx] = rChan;
      data[idx + 1] = gChan;
      data[idx + 2] = 128;
      data[idx + 3] = 255;
      idx += 4;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const pngUrl = dispCanvas.toDataURL();
  const svgWrapper = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${cw} ${ch}" preserveAspectRatio="none"><image width="${cw}" height="${ch}" preserveAspectRatio="none" href="${pngUrl}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgWrapper)}`;
}

const LiquidGlassCard = ({
  children,
  borderRadius = 24,
  progress = 0.0,
  fillAxis = "y",
  liquidColor = [0.1, 0.5, 1.0],
  refraction = 45.0,
  bevelRatio = 0.35,
  specularIntensity = 1.0,
  blurAmount = 1.8,
  interactive = true,
  className = "",
  style = {},
}) => {
  const { isDark } = useTheme();
  const rawId = useId();
  const filterId = `liquid-glass-filter-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const dispCanvasRef = useRef(null);

  const [boxSize, setBoxSize] = useState({ width: 300, height: 80 });
  const [dispMapUrl, setDispMapUrl] = useState("");

  const stateRef = useRef({
    mouse: { x: 0.5, y: 0.5 },
    targetMouse: { x: 0.5, y: 0.5 },
    mousePresence: 0.0,
    targetMousePresence: 0.0,
    borderRadius,
    progress,
    currentProgress: progress,
    fillAxis: fillAxis === "x" ? 1.0 : 0.0,
    liquidColor: parseNormalizedColor(liquidColor),
    refraction,
    bevelRatio,
    specularIntensity,
    blurAmount,
    interactive,
    isDark,
    pos: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    lastDispUpdate: 0,
    dispNeedsStaticRebuild: true,
  });

  // Rebuild Displacement Map เฉพาะเมื่อรูปทรงของการ์ดเปลี่ยน (ไม่ Rebuild ตอนสลับธีม)
  useEffect(() => {
    stateRef.current.borderRadius = borderRadius;
    stateRef.current.bevelRatio = bevelRatio;
    stateRef.current.dispNeedsStaticRebuild = true;
  }, [borderRadius, bevelRatio]);

  useEffect(() => {
    stateRef.current.progress = progress;
    stateRef.current.fillAxis = fillAxis === "x" ? 1.0 : 0.0;
    stateRef.current.liquidColor = parseNormalizedColor(liquidColor);
    stateRef.current.refraction = refraction;
    stateRef.current.specularIntensity = specularIntensity;
    stateRef.current.blurAmount = blurAmount;
    stateRef.current.interactive = interactive;
    stateRef.current.isDark = isDark;
  }, [
    progress,
    fillAxis,
    liquidColor,
    refraction,
    specularIntensity,
    blurAmount,
    interactive,
    isDark,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    if (!dispCanvasRef.current) {
      dispCanvasRef.current = document.createElement("canvas");
    }

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // WebGL Shader ต้นฉบับที่ให้แสงสะท้อนขอบกระจก (Specular Rim), เลนส์เมาส์ (Mouse Dent) และความใสแบบดั้งเดิม
    const fsSource = `
      precision highp float;
      varying vec2 v_uv;

      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_mousePresence;
      uniform float u_borderRadius;
      uniform float u_time;
      uniform float u_progress;
      uniform float u_fillAxis;
      uniform float u_velX;
      uniform float u_velY;
      uniform vec3 u_liquidColor;
      uniform float u_bevelRatio;
      uniform float u_specularIntensity;
      uniform float u_isDark;

      float sdRoundedBox(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
      }

      void main() {
        vec2 center = u_resolution * 0.5;
        vec2 p = v_uv * u_resolution - center;
        float r = min(u_borderRadius, min(center.x, center.y));
        float dist = sdRoundedBox(p, center, r);

        // 1. ขอบโค้งของแผ่นกระจก (Bevel)
        float bevelWidth = min(center.x, center.y) * u_bevelRatio;
        float edgeFactor = clamp(1.0 + dist / bevelWidth, 0.0, 1.0);
        float curve = pow(edgeFactor, 2.5);
        vec2 grad = normalize(p + vec2(0.0001));
        vec2 edgeNormal = grad * curve;

        // 2. รอยบุ๋มเลนส์ตามเมาส์ (Mouse Dent)
        vec2 mousePos = u_mouse * u_resolution;
        vec2 toMouse = v_uv * u_resolution - mousePos;
        float mouseDist = length(toMouse);
        float dentRadius = 150.0;
        float dentStrength = smoothstep(dentRadius, 0.0, mouseDist) * u_mousePresence;
        vec2 mouseNormal = normalize(toMouse + vec2(0.0001)) * sin(dentStrength * 3.14159) * 0.6;

        vec2 finalNormal = edgeNormal + (mouseNormal * (1.0 - curve * 0.5));

        // 3. คำนวณระดับน้ำและคลื่น (Liquid Wave Simulation)
        float isFilled = 0.0;
        float waveHighlight = 0.0;
        if (u_progress > 0.0) {
          float fillCoord = (u_fillAxis > 0.5) ? v_uv.y : v_uv.x;
          float currentPos = (u_fillAxis > 0.5) ? v_uv.x : v_uv.y;
          float vel = (u_fillAxis > 0.5) ? u_velY : u_velX;

          float wave = sin(fillCoord * 12.0 - u_time * 5.0) * 0.008
                     + cos(fillCoord * 25.0 + u_time * 3.0) * 0.004;
          float tilt = (fillCoord - 0.5) * clamp(vel, -0.25, 0.25);
          float edgeDampen = sin(u_progress * 3.14159);
          float waveOffset = (wave + tilt) * edgeDampen;

          float liquidLevel = u_progress + waveOffset;
          isFilled = smoothstep(liquidLevel + 0.015, liquidLevel - 0.015, currentPos);
          waveHighlight = smoothstep(0.02, 0.0, abs(currentPos - liquidLevel)) * edgeDampen;
        }

        // 4. สีฝ้ากระจกบางๆ และสีน้ำ (เหมือนต้นฉบับ 100%)
        float glassFrostAlpha = 0.08 + curve * 0.12;
        vec3 surfaceColor = vec3(1.0);
        float surfaceAlpha = glassFrostAlpha;

        if (u_progress > 0.0) {
          vec3 liqRGB = mix(u_liquidColor, vec3(1.0), waveHighlight * 0.55);
          float liqAlpha = clamp(0.60 + waveHighlight * 0.3, 0.0, 1.0);
          surfaceColor = mix(surfaceColor, liqRGB, isFilled);
          surfaceAlpha = mix(surfaceAlpha, liqAlpha, isFilled);
        }

        // 5. แสงสะท้อนขอบกระจกและเลนส์เมาส์ (Specular Rim & Dent Highlight) เหมือนต้นฉบับ 100%
        vec2 lightDir1 = normalize(vec2(-1.0, 1.0));
        vec2 lightDir2 = normalize(vec2(1.0, -1.0));
        float spec1 = pow(max(dot(finalNormal, lightDir1), 0.0), 8.0) * 0.8;
        float spec2 = pow(max(dot(finalNormal, lightDir2), 0.0), 4.0) * 0.3;
        float specular = (spec1 + spec2) * (curve + dentStrength * 0.4) * u_specularIntensity;

        float alpha = 1.0 - smoothstep(-1.0, 1.0, dist);

        vec3 premulRGB = (surfaceColor * surfaceAlpha + vec3(specular)) * alpha;
        float outAlpha = clamp(surfaceAlpha + specular, 0.0, 1.0) * alpha;

        gl_FragColor = vec4(premulRGB, outAlpha);
      }
    `;

    const compileShader = (type, source) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
      }
      return s;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uMousePresence = gl.getUniformLocation(program, "u_mousePresence");
    const uRadius = gl.getUniformLocation(program, "u_borderRadius");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uProgress = gl.getUniformLocation(program, "u_progress");
    const uFillAxis = gl.getUniformLocation(program, "u_fillAxis");
    const uVelX = gl.getUniformLocation(program, "u_velX");
    const uVelY = gl.getUniformLocation(program, "u_velY");
    const uLiquidColor = gl.getUniformLocation(program, "u_liquidColor");
    const uBevelRatio = gl.getUniformLocation(program, "u_bevelRatio");
    const uSpecularIntensity = gl.getUniformLocation(
      program,
      "u_specularIntensity",
    );
    const uIsDark = gl.getUniformLocation(program, "u_isDark");

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(1, Math.round(entry.contentRect.width));
        const h = Math.max(1, Math.round(entry.contentRect.height));
        setBoxSize((prev) =>
          prev.width === w && prev.height === h ? prev : { width: w, height: h },
        );
        stateRef.current.dispNeedsStaticRebuild = true;
      }
    });
    resizeObserver.observe(container);

    let animationFrameId;
    let startTime = performance.now();

    const render = (now) => {
      const s = stateRef.current;
      const elapsedTime = (now - startTime) * 0.001;

      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        s.dispNeedsStaticRebuild = true;
      }

      // 1. คำนวณฟิสิกส์การกระฉอกของน้ำเมื่อการ์ดเคลื่อนที่หรือเลื่อนหน้าจอ
      const dx = rect.left - s.pos.x;
      const dy = rect.top - s.pos.y;
      s.pos.x = rect.left;
      s.pos.y = rect.top;

      if (Math.abs(dx) < 300 && Math.abs(dy) < 300) {
        s.vel.x += dx * 0.003;
        s.vel.y += dy * 0.003;
      }

      s.vel.x *= 0.92;
      s.vel.y *= 0.92;
      s.vel.x = Math.max(-0.5, Math.min(0.5, s.vel.x));
      s.vel.y = Math.max(-0.5, Math.min(0.5, s.vel.y));

      // 2. สมูทตำแหน่งเมาส์และระดับน้ำ
      const prevMouseX = s.mouse.x;
      const prevMouseY = s.mouse.y;
      const prevPresence = s.mousePresence;

      s.mouse.x += (s.targetMouse.x - s.mouse.x) * 0.14;
      s.mouse.y += (s.targetMouse.y - s.mouse.y) * 0.14;
      s.mousePresence += (s.targetMousePresence - s.mousePresence) * 0.12;
      s.currentProgress += (s.progress - s.currentProgress) * 0.08;

      const mouseDelta =
        Math.hypot(s.mouse.x - prevMouseX, s.mouse.y - prevMouseY) +
        Math.abs(s.mousePresence - prevPresence);

      // 3. อัปเดตแผนที่หักเหแสง (Displacement Map) เฉพาะเมื่อขนาดการ์ดเปลี่ยน หรือเมาส์กำลังเคลื่อนที่บนการ์ด
      if (
        s.dispNeedsStaticRebuild ||
        (mouseDelta > 0.0015 && now - s.lastDispUpdate > 28)
      ) {
        const url = buildDisplacementDataUrl({
          dispCanvas: dispCanvasRef.current,
          width: w,
          height: h,
          borderRadius: s.borderRadius,
          bevelRatio: s.bevelRatio,
          mouseX: s.mouse.x,
          mouseY: s.mouse.y,
          mousePresence: s.interactive ? s.mousePresence : 0.0,
        });
        if (url) {
          setDispMapUrl(url);
        }
        s.lastDispUpdate = now;
        s.dispNeedsStaticRebuild = false;
      }

      // 4. วาดชั้นผิวกระจก แสงสะท้อนขอบ 3 มิติ และคลื่นน้ำด้วย WebGL
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, s.mouse.x, s.mouse.y);
      gl.uniform1f(uMousePresence, s.interactive ? s.mousePresence : 0.0);
      gl.uniform1f(uRadius, s.borderRadius);
      gl.uniform1f(uTime, elapsedTime);
      gl.uniform1f(uProgress, s.currentProgress);
      gl.uniform1f(uFillAxis, s.fillAxis);
      gl.uniform1f(uVelX, s.vel.x);
      gl.uniform1f(uVelY, s.vel.y);
      gl.uniform3fv(uLiquidColor, s.liquidColor);
      gl.uniform1f(uBevelRatio, s.bevelRatio);
      gl.uniform1f(uSpecularIntensity, s.specularIntensity);
      gl.uniform1f(uIsDark, s.isDark ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  const handleMouseMove = (e) => {
    if (!stateRef.current.interactive || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    stateRef.current.targetMouse.x = (e.clientX - rect.left) / rect.width;
    stateRef.current.targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
    stateRef.current.targetMousePresence = 1.0;
  };

  const handleMouseLeave = () => {
    stateRef.current.targetMousePresence = 0.0;
    stateRef.current.dispNeedsStaticRebuild = true;
  };

  const activeBackdropFilter = dispMapUrl
    ? `url(#${filterId})`
    : `blur(${blurAmount * 3}px) saturate(140%)`;

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        display: "inline-block",
        borderRadius: `${borderRadius}px`,
        overflow: "hidden",
        backdropFilter: activeBackdropFilter,
        WebkitBackdropFilter: activeBackdropFilter,
        boxShadow:
          "0 10px 30px -10px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.2)",
        ...style,
      }}
    >
      {/* SVG Filter สำหรับสั่งให้ Browser Compositor หักเหพิกเซลพื้นหลังจริงแบบ Real-time */}
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      >
        <defs>
          <filter
            id={filterId}
            x="-12%"
            y="-12%"
            width="124%"
            height="124%"
            filterUnits="objectBoundingBox"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            {dispMapUrl && (
              <feImage
                href={dispMapUrl}
                x="0"
                y="0"
                width={boxSize.width}
                height={boxSize.height}
                preserveAspectRatio="none"
                result="dispMap"
              />
            )}
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={blurAmount}
              edgeMode="duplicate"
              result="blurredBg"
            />
            {dispMapUrl ? (
              <feDisplacementMap
                in="blurredBg"
                in2="dispMap"
                scale={refraction * 2}
                xChannelSelector="R"
                yChannelSelector="G"
                result="refractedBg"
              />
            ) : null}
          </filter>
        </defs>
      </svg>

      {/* เลเยอร์ WebGL สำหรับวาดความใสของผิวกระจก แสงสะท้อนขอบโค้ง (Specular) และคลื่นของเหลว */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
          display: "block",
        }}
      />

      {/* เนื้อหาภายในของการ์ด */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default LiquidGlassCard;
