import React, { useEffect, useRef } from "react";

const fsSource = `
  precision mediump float;
  
  uniform vec3 iResolution;
  uniform vec4 iMouse;
  uniform vec2 iMouseVelocity;
  uniform sampler2D iChannel0;
  
  uniform vec2 u_screen; 
  uniform vec2 u_offset; 
  uniform vec2 u_imageRes; 
  uniform vec2 u_cardSize;
  uniform float u_borderRadius;
  uniform float u_progress;
  uniform float u_time;
  uniform float u_fillAxis;

  void mainImage(out vec4 fragColor, in vec2 fragCoord)
  {
    vec2 screenUV = (fragCoord + u_offset) / u_screen;
    float screenRatio = u_screen.x / u_screen.y;
    float imageRatio = u_imageRes.x / u_imageRes.y;
    
    vec2 bgUV = screenUV;
    if (screenRatio > imageRatio) {
      float scale = screenRatio / imageRatio;
      bgUV.y = (bgUV.y - 0.5) / scale + 0.5;
    } else {
      float scale = imageRatio / screenRatio;
      bgUV.x = (bgUV.x - 0.5) / scale + 0.5;
    }

    vec2 localUV = fragCoord / u_cardSize;
    vec2 mouseUV = iMouse.xy / u_cardSize;

    float maxRadius = min(u_cardSize.x, u_cardSize.y) * 0.5;
    float safeRadius = min(u_borderRadius, maxRadius);

    vec2 halfSize = u_cardSize * 0.5;
    vec2 p = fragCoord - halfSize;
    vec2 d = abs(p) - halfSize + vec2(safeRadius);  
    
    float dist = (length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - safeRadius);
    float innerDist = -dist;

    float speed = length(iMouseVelocity);
    vec2 dir = speed > 0.0001 ? normalize(iMouseVelocity) : vec2(0.0);
    vec2 toMouse = localUV - mouseUV;
    toMouse.x *= u_cardSize.x / u_cardSize.y; 
    
    vec2 stretch = 1.0 + abs(dir) * (speed / length(u_screen)) * 15.0;
    float warpedDist = length(toMouse / stretch);
    float bulge = exp(-warpedDist * 8.0); 
    vec2 mouseDistortion = toMouse * bulge * 0.05; 

    float bevelDepth = min(u_cardSize.x, u_cardSize.y) * 0.15; 
    float edgePull = (1.0 - smoothstep(0.0, bevelDepth, innerDist)) * 0.04;
    vec2 centerDir = normalize(p);
    vec2 edgeDistortion = centerDir * edgePull;
    float distToEdge = smoothstep(0.0, 0.05, -dist);
    vec2 finalDistortion = (mouseDistortion + edgeDistortion) * distToEdge;

    vec2 sampleUV = bgUV - finalDistortion;

    const float SAMPLE_RANGE = 2.0;
    const float SAMPLE_OFFSET = 1.5;
    vec4 blurredColor = vec4(0.0);
    float total = 0.0;
    vec2 pixelSize = 1.0 / u_screen;
    
    for (float x = -SAMPLE_RANGE; x <= SAMPLE_RANGE; x++) {
      for (float y = -SAMPLE_RANGE; y <= SAMPLE_RANGE; y++) {
        vec2 offset = vec2(x, y) * SAMPLE_OFFSET * pixelSize;
        vec2 samplePos = sampleUV + offset;
        
        if(samplePos.x > 0.0 && samplePos.x < 1.0 && samplePos.y > 0.0 && samplePos.y < 1.0) {
            blurredColor += texture2D(iChannel0, samplePos);
            total += 1.0;
        }
      }
    }
    if (total > 0.0) {
        blurredColor /= total;
    } else {
        blurredColor = texture2D(iChannel0, clamp(sampleUV, 0.0, 1.0));
    }

    vec3 progColor = vec3(255.0/255.0, 222.0/255.0, 89.0/255.0); 

    if (u_progress > 0.0) {
        vec2 calcUV = mix(localUV, vec2(localUV.y, localUV.x), u_fillAxis);

        float wave1 = sin(calcUV.y * 12.0 + u_time * 5.0) * 0.015;
        float wave2 = cos(calcUV.y * 20.0 - u_time * 7.0) * 0.010;

        float waveDamp = smoothstep(0.0, 0.1, u_progress) * smoothstep(1.0, 0.9, u_progress);
        float liquidEdge = u_progress + (wave1 + wave2) * waveDamp;

        float isLiquid = smoothstep(liquidEdge + 0.005, liquidEdge - 0.005, calcUV.x);
        float foamDist = clamp(liquidEdge - calcUV.x, 0.0, 1.0);
        float isFoam = smoothstep(0.03, 0.0, foamDist) * isLiquid;

        vec3 surfaceColor = progColor + vec3(0.4); 
        vec3 finalProgColor = mix(progColor, surfaceColor, isFoam);

        blurredColor.rgb = mix(blurredColor.rgb, finalProgColor, isLiquid * 0.85);
    }

    vec2 lightDir = normalize(vec2(-1.0, 1.0)); 
    float edgeLight = dot(-centerDir, lightDir);
    
    float edgeGlow = 1.0 - smoothstep(0.0, bevelDepth, innerDist);
    float highlight = edgeGlow * max(0.0, edgeLight) * 0.15; 
    float shadow = edgeGlow * max(0.0, -edgeLight) * 0.15; 
    float specular = exp(-warpedDist * 12.0) * 0.15;

    vec3 finalColor = blurredColor.rgb + vec3(specular) + vec3(highlight) - vec3(shadow);
    float alpha = 1.0 - smoothstep(-0.5, 0.5, dist);

    fragColor = vec4(finalColor * alpha, alpha);
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
`;

const vsSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// ฟังก์ชันแปลงค่าสี CSS (เช่น rgb, rgba, hex) ให้เป็น Array [r, g, b, 255]
function parseColorToRgba(colorStr) {
  if (!colorStr) return null;
  const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1], 10),
      parseInt(rgbMatch[2], 10),
      parseInt(rgbMatch[3], 10),
      255,
    ];
  }
  if (colorStr.startsWith("#")) {
    let hex = colorStr.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (hex.length === 6) {
      return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16),
        255,
      ];
    }
  }
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    if (ctx) {
      ctx.fillStyle = colorStr;
      ctx.fillRect(0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      if (data && data.length >= 4) {
        return [data[0], data[1], data[2], 255];
      }
    }
  } catch (e) {}
  return null;
}

// ฟังก์ชันดึงสีพื้นหลังปัจจุบันของหน้าเว็บ (App/Body/Document)
function getWebBgRgba() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return [244, 246, 248, 255];
  }
  try {
    const candidates = [
      document.querySelector(".App"),
      document.body,
      document.documentElement,
    ];
    for (const el of candidates) {
      if (!el) continue;
      const bg = window.getComputedStyle(el).backgroundColor;
      if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
        const parsed = parseColorToRgba(bg);
        if (parsed) return parsed;
      }
    }
  } catch (e) {}
  return [244, 246, 248, 255];
}

export default function LiquidGlassCard({
  children,
  imageUrl,
  dynamicBgSource,
  fallbackBgColor,
  borderRadius = 24,
  progress = 0,
  fillAxis = "x",
  className = "",
  style = {},
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  const state = useRef({
    currentMouse: [-1000, -1000],
    smoothedMouse: [-1000, -1000],
    mouseVelocity: [0, 0],
    pixelRatio: 1.0,
    isVisible: false,
    imageRes: [1920, 1080],
    progress: 0,
    fillAxis: 0,
    dynamicBg: null,
    isUsingDynamic: false,
  });

  useEffect(() => {
    state.current.progress = progress;
  }, [progress]);

  useEffect(() => {
    state.current.fillAxis = fillAxis === "y" ? 1.0 : 0.0;
  }, [fillAxis]);

  useEffect(() => {
    state.current.dynamicBg = dynamicBgSource;
  }, [dynamicBgSource]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      depth: false,
      antialias: false,
    });
    if (!gl) return;

    let isActive = true;

    const LIQUID_FOLLOW_DAMPING = 0.12;
    const VELOCITY_DECAY = 0.92;
    const VELOCITY_SENSITIVITY = 1.5;

    const updateSize = () => {
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      state.current.pixelRatio = dpr;

      const rect = container.getBoundingClientRect();
      const newWidth = Math.floor(rect.width * dpr);
      const newHeight = Math.floor(rect.height * dpr);

      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
      }
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    updateSize();

    const intersectionObserver = new IntersectionObserver((entries) => {
      state.current.isVisible = entries[0].isIntersecting;
    });
    intersectionObserver.observe(container);

    const createShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      resolution: gl.getUniformLocation(program, "iResolution"),
      mouse: gl.getUniformLocation(program, "iMouse"),
      texture: gl.getUniformLocation(program, "iChannel0"),
      mouseVelocity: gl.getUniformLocation(program, "iMouseVelocity"),
      screen: gl.getUniformLocation(program, "u_screen"),
      offset: gl.getUniformLocation(program, "u_offset"),
      imageRes: gl.getUniformLocation(program, "u_imageRes"),
      cardSize: gl.getUniformLocation(program, "u_cardSize"),
      borderRadius: gl.getUniformLocation(program, "u_borderRadius"),
      progress: gl.getUniformLocation(program, "u_progress"),
      time: gl.getUniformLocation(program, "u_time"),
      fillAxis: gl.getUniformLocation(program, "u_fillAxis"),
    };

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const pr = state.current.pixelRatio;

      const localX = (e.clientX - rect.left) * pr;
      const localY = canvas.height - (e.clientY - rect.top) * pr;

      if (state.current.currentMouse[0] === -1000) {
        state.current.smoothedMouse = [localX, localY];
      }
      state.current.currentMouse = [localX, localY];
    };

    container.addEventListener("mousemove", handleMouseMove);

    // ✅ แก้ไขตรงนี้: เซ็ตค่า Texture ตั้งแต่แรก ด้วยสีพื้นหลังเว็บ (ไม่ให้เป็นกล่องดำ)
    const initialRgba =
      (fallbackBgColor ? parseColorToRgba(fallbackBgColor) : null) ||
      getWebBgRgba();

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // ใส่สีพื้นหลังตั้งต้น เพื่อให้เวลารอ Render ได้สีเดียวกับ Background ของเว็บ
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(initialRgba),
    );

    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      img.onload = () => {
        if (!isActive) return;
        state.current.imageRes = [img.naturalWidth, img.naturalHeight];
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img,
        );
      };
    }

    const startTime = performance.now();

    const render = () => {
      if (state.current.isVisible) {
        const s = state.current;

        if (!s.isVisible) {
          s.currentMouse = [-1000, -1000];
        }

        s.smoothedMouse[0] +=
          (s.currentMouse[0] - s.smoothedMouse[0]) * LIQUID_FOLLOW_DAMPING;
        s.smoothedMouse[1] +=
          (s.currentMouse[1] - s.smoothedMouse[1]) * LIQUID_FOLLOW_DAMPING;
        const MAX_VELOCITY = 50.0;
        let velX =
          (s.currentMouse[0] - s.smoothedMouse[0]) * VELOCITY_SENSITIVITY;

        velX = Math.max(Math.min(velX, MAX_VELOCITY), -MAX_VELOCITY);

        s.mouseVelocity[0] = velX + s.mouseVelocity[0] * VELOCITY_DECAY;
        s.mouseVelocity[1] =
          (s.currentMouse[1] - s.smoothedMouse[1]) * VELOCITY_SENSITIVITY +
          s.mouseVelocity[1] * VELOCITY_DECAY;

        const currentTime = (performance.now() - startTime) / 1000.0;

        // ดึงภาพจาก HTML2Canvas มาใส่ใน WebGL
        if (s.dynamicBg && s.dynamicBg.width > 0 && s.dynamicBg.height > 0) {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            s.dynamicBg,
          );
          s.imageRes = [s.dynamicBg.width, s.dynamicBg.height];
          s.isUsingDynamic = true;
        }

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const rect = canvas.getBoundingClientRect();
        const pr = s.pixelRatio;
        const screenW = window.innerWidth * pr;
        const screenH = window.innerHeight * pr;
        const offsetX = rect.left * pr;
        const offsetY = (window.innerHeight - rect.bottom) * pr;

        gl.uniform3f(uniforms.resolution, canvas.width, canvas.height, 1.0);
        gl.uniform4f(
          uniforms.mouse,
          s.smoothedMouse[0],
          s.smoothedMouse[1],
          0,
          0,
        );
        gl.uniform2f(
          uniforms.mouseVelocity,
          s.mouseVelocity[0],
          s.mouseVelocity[1],
        );
        gl.uniform2f(uniforms.screen, screenW, screenH);
        gl.uniform2f(uniforms.offset, offsetX, offsetY);
        gl.uniform2f(uniforms.imageRes, s.imageRes[0], s.imageRes[1]);
        gl.uniform2f(uniforms.cardSize, canvas.width, canvas.height);
        gl.uniform1f(uniforms.borderRadius, borderRadius * pr);
        gl.uniform1f(uniforms.progress, s.progress);
        gl.uniform1f(uniforms.time, currentTime);
        gl.uniform1f(uniforms.fillAxis, s.fillAxis);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniforms.texture, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      requestRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isActive = false;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(requestRef.current);
      gl.deleteProgram(program);

      gl.deleteBuffer(buffer);
      gl.deleteTexture(texture);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);

      if (canvas && !document.body.contains(canvas)) {
        const ext = gl.getExtension("WEBGL_lose_context");
        if (ext) {
          ext.loseContext();
        }
      }
    };
  }, [imageUrl, borderRadius, dynamicBgSource, fallbackBgColor]);
  // ↑ อัปเดต Dependencies เพื่อดักจับตอนส่งภาพแคปหน้าจอมาใหม่ หรือเมื่อสีพื้นหลังเปลี่ยน

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", ...style }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, height: "100%" }}>
        {children}
      </div>
    </div>
  );
}
