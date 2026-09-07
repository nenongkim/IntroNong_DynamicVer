import { useEffect, useRef } from 'react';

/**
 * LivingWater — 정지 이미지를 "살아 있는 바닷속"처럼 렌더링하는 WebGL 배경.
 *
 *  · 물결 굴절(warp)    : 다층 sin + value noise 로 uv 를 미세하게 흔든다
 *  · 코스틱 반짝임      : 상단 수면 쪽에 노이즈 곱으로 빛 얼룩
 *  · 빛줄기             : 느리게 흔들리는 사선 광선
 *  · 다이브 인          : 로드 후 카메라가 천천히 밀고 들어가며(zoom) 가라앉는다(drift)
 *                         스크롤하면 더 깊이 들어간다
 *  · 장면 전환          : 두 텍스처를 노이즈 변위로 벌리며 디졸브 (1.6s)
 *  · 마우스 패럴랙스    : 아주 약하게
 */
interface Props {
  scenes: string[];
  active: number;
  reduced?: boolean;
  className?: string;
}

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uProgress;   // 0 = A, 1 = B
uniform float uTime;
uniform float uZoom;
uniform float uDrift;
uniform float uWarp;       // 0 = 정지, 1 = 기본
uniform float uDim;        // 0 = 원본, 1 = 섹션용 딥오션 톤 (어둡고 채도 낮게)
uniform vec2  uRes;
uniform vec2  uImgA;
uniform vec2  uImgB;
uniform vec2  uMouse;      // -0.5 ~ 0.5

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
vec2 cover(vec2 uv, vec2 res, vec2 img){
  float rs = res.x / res.y; float ri = img.x / img.y;
  vec2 s = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
  return (uv - 0.5) * s + 0.5;
}

void main(){
  float t = uTime;
  vec2 uv = vUv;                         // y: 0 아래, 1 위 (텍스처 flip 적용)

  // 다이브 인: 중심보다 살짝 위를 기준으로 확대, 아래로 가라앉음
  vec2 c = vec2(0.5, 0.56);
  uv = (uv - c) / uZoom + c;
  uv.y += uDrift;
  uv += uMouse * vec2(0.014, 0.010);

  // 물결 굴절
  vec2 w = vec2(
    sin(uv.y * 9.0 + t * 0.70) + sin(uv.y * 17.0 - t * 0.45),
    cos(uv.x * 8.0 + t * 0.60) + cos(uv.x * 15.0 + t * 0.40)
  ) * 0.0016;
  w += (vec2(noise(uv * 3.0 + t * 0.08), noise(uv * 3.0 - t * 0.07 + 7.0)) - 0.5) * 0.006;
  w *= uWarp;

  // 장면 전환 변위 (중간에 최대)
  float tr = sin(clamp(uProgress, 0.0, 1.0) * 3.14159265);
  vec2 d = (vec2(noise(uv * 4.0 + t * 0.2), noise(uv * 4.0 - t * 0.15 + 3.0)) - 0.5) * tr * 0.09;

  vec2 uvA = cover(uv + w + d, uRes, uImgA);
  vec2 uvB = cover(uv + w - d, uRes, uImgB);
  vec3 a = texture2D(uTexA, uvA).rgb;
  vec3 b = texture2D(uTexB, uvB).rgb;
  float m = smoothstep(0.0, 1.0, uProgress);
  vec3 col = mix(a, b, m);
  // 전환 중 살짝 밝아지며 물빛 플래시
  col += vec3(0.55, 0.8, 1.0) * tr * 0.06;

  // 코스틱 반짝임 (수면 가까울수록 강하게)
  float ca = noise(uv * vec2(6.0, 3.0) + vec2(t * 0.12, -t * 0.05));
  float cb = noise(uv * vec2(9.0, 5.0) - vec2(t * 0.10, t * 0.07));
  float caus = pow(ca * cb, 1.6);
  float light = 1.0 - 0.55 * uDim;   // 섹션에선 빛 효과를 줄여 글자를 보호
  col += vec3(0.85, 0.96, 1.0) * caus * 0.34 * smoothstep(0.25, 1.0, uv.y) * uWarp * light;

  // 빛줄기
  float ang = uv.x * 11.0 + uv.y * 2.5 + t * 0.12;
  float rays = pow(max(0.0, sin(ang)), 7.0) * 0.06 * smoothstep(0.2, 1.0, uv.y);
  rays += pow(max(0.0, sin(ang * 0.63 + 1.7 - t * 0.05)), 9.0) * 0.05 * smoothstep(0.3, 1.0, uv.y);
  col += rays * uWarp * light;

  // 섹션용 딥오션 톤: 어둡게 + 채도 낮게 + sky-800 틴트 (움직임은 그대로 보인다)
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 dimmed = mix(col, vec3(lum), 0.55) * 0.24 + vec3(0.047, 0.267, 0.486) * 0.22;
  col = mix(col, dimmed, uDim);

  // 비네트
  float vig = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(1.0, 1.15)));
  col *= mix(0.84, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function LivingWater({ scenes, active, reduced = false, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) return;
    // StrictMode 재마운트 등으로 컨텍스트를 잃은 상태면 복구 시도
    if (gl.isContextLost()) gl.getExtension('WEBGL_lose_context')?.restoreContext();

    /* ---------- program ---------- */
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[LivingWater] link failed:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = {
      texA: U('uTexA'), texB: U('uTexB'), progress: U('uProgress'), time: U('uTime'), zoom: U('uZoom'),
      drift: U('uDrift'), warp: U('uWarp'), dim: U('uDim'), res: U('uRes'), imgA: U('uImgA'), imgB: U('uImgB'), mouse: U('uMouse'),
    };

    /* ---------- textures ---------- */
    type Tex = { tex: WebGLTexture; w: number; h: number };
    const textures: (Tex | null)[] = scenes.map(() => null);
    const placeholder = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, placeholder);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([12, 68, 124]));

    const load = (i: number) =>
      new Promise<Tex>((resolve, reject) => {
        if (textures[i]) return resolve(textures[i]!);
        const img = new Image();
        img.onload = () => {
          const tex = gl.createTexture()!;
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          const t = { tex, w: img.naturalWidth, h: img.naturalHeight };
          textures[i] = t;
          resolve(t);
        };
        img.onerror = reject;
        img.src = scenes[i];
      });

    /* ---------- state ---------- */
    let W = 0, H = 0;
    let raf = 0;
    let running = true;
    const t0 = performance.now();
    let curA: Tex | null = null;
    let curB: Tex | null = null;
    let shownIndex = activeRef.current;
    let progress = 1;              // 1 = B 가 완전히 보임
    let transStart = 0;
    const TRANS = 1.6;
    let mx = 0, my = 0, tmx = 0, tmy = 0;
    let scrollDepth = 0;
    let dim = 0, dimTarget = 0;   // 히어로를 벗어나면 1 로

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.round(canvas.clientWidth * dpr);
      H = Math.round(canvas.clientHeight * dpr);
      canvas.width = W;
      canvas.height = H;
      gl.viewport(0, 0, W, H);
    };

    const onMove = (e: MouseEvent) => {
      tmx = e.clientX / window.innerWidth - 0.5;
      tmy = -(e.clientY / window.innerHeight - 0.5);
    };
    const onScroll = () => {
      scrollDepth = Math.min(1, window.scrollY / window.innerHeight);
      dimTarget = Math.min(1, Math.max(0, (window.scrollY - window.innerHeight * 0.15) / (window.innerHeight * 0.7)));
    };
    const onVis = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (!running) { running = true; raf = requestAnimationFrame(frame); }
    };

    const bind = (unit: number, t: Tex | null, loc: WebGLUniformLocation | null, img: WebGLUniformLocation | null) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t ? t.tex : placeholder);
      gl.uniform1i(loc, unit);
      gl.uniform2f(img, t ? t.w : 16, t ? t.h : 9);
    };

    const frame = (now: number) => {
      if (!running) return;
      const t = (now - t0) / 1000;

      // 장면 변경 감지 → 텍스처 준비되면 전환 시작
      const want = activeRef.current;
      if (want !== shownIndex && textures[want] && progress >= 1) {
        curA = curB;
        curB = textures[want];
        shownIndex = want;
        progress = 0;
        transStart = now;
      }
      if (progress < 1) progress = Math.min(1, (now - transStart) / 1000 / TRANS);

      // 다이브 인: 점근적 줌 + 침강 + 호흡, 스크롤로 더 깊이
      const k = 1 - Math.exp(-t / 16);
      const breathe = Math.sin(t * 0.18) * 0.006;
      const zoom = reduced ? 1.04 : 1.0 + 0.11 * k + breathe + scrollDepth * 0.14 + Math.sin(progress * Math.PI) * 0.03;
      const drift = reduced ? 0 : -0.035 * k - scrollDepth * 0.05;

      mx += (tmx - mx) * 0.04;
      my += (tmy - my) * 0.04;
      dim += (dimTarget - dim) * 0.08;

      gl.uniform1f(u.dim, dim);
      gl.uniform1f(u.time, reduced ? 0 : t);
      gl.uniform1f(u.zoom, zoom);
      gl.uniform1f(u.drift, drift);
      gl.uniform1f(u.warp, reduced ? 0 : 1);
      gl.uniform1f(u.progress, progress);
      gl.uniform2f(u.res, W, H);
      gl.uniform2f(u.mouse, reduced ? 0 : mx, reduced ? 0 : my);
      bind(0, curA, u.texA, u.imgA);
      bind(1, curB, u.texB, u.imgB);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVis);

    // 첫 장면 → 표시 후 나머지 프리로드
    load(activeRef.current)
      .then((tex) => {
        curA = tex;
        curB = tex;
        canvas.style.opacity = '1';
        raf = requestAnimationFrame(frame);
        scenes.forEach((_, i) => { if (i !== activeRef.current) load(i).catch(() => {}); });
      })
      .catch(() => {});

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVis);
      // 컨텍스트는 버리지 않는다 (같은 canvas 로 재마운트되는 StrictMode 에서 죽은 컨텍스트를 받게 됨).
      // GPU 리소스만 해제.
      textures.forEach((t) => t && gl.deleteTexture(t.tex));
      gl.deleteTexture(placeholder);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
    // scenes 는 마운트 시 고정
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block h-full w-full opacity-0 transition-opacity duration-[1400ms] ease-out ${className}`}
    />
  );
}
