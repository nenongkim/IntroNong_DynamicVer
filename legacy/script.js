/* =========================================================
   script.js — 스크롤 엔진 · 커서 반응 · Canvas FX · 섬 패널
   원칙: JS는 :root의 CSS 변수만 갱신한다. (transform/opacity는 CSS가 그림)
   예외: 상태 클래스 토글(is-active, is-visited, lit)과 콘텐츠 렌더링, 슬라이더 트랙.
   외부 라이브러리 없음 (v0.1). 이산 트윈도 메인 rAF 루프에서 처리.
   ========================================================= */
(() => {
  "use strict";

  const C = window.CONTENT;
  const root = document.documentElement;
  const body = document.body;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MOBILE_MQ = window.matchMedia("(max-width: 720px)");
  const S = parseFloat(getComputedStyle(root).getPropertyValue("--S")) || 4000;

  /* ---------- utils ---------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const vars = {};
  const setVar = (k, v) => {
    const s = typeof v === "number" ? (Math.round(v * 1000) / 1000).toString() : v;
    if (vars[k] === s) return;
    vars[k] = s;
    root.style.setProperty(k, s);
  };
  const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (c1, c2, t) => c1.map((v, i) => Math.round(lerp(v, c2[i], t)));
  const rgbStr = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  const luminance = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

  const SKY50 = hex2rgb("#E6F1FB");
  const SKY100 = hex2rgb("#B5D4F4");
  const SKY200 = hex2rgb("#85B7EB");

  /* =========================================================
     1. 콘텐츠 렌더링 (data/content.js → DOM)
     ========================================================= */
  function renderContent() {
    // 단순 텍스트 바인딩
    $$("[data-content]").forEach((el) => {
      const v = getPath(C, el.dataset.content);
      if (typeof v === "string") el.textContent = v;
    });

    // 연락처
    $("#emailLink").href = `mailto:${C.profile.email}`;
    $("#emailLink").textContent = C.profile.email;
    $("#phoneLink").href = C.profile.phone_href;
    $("#phoneLink").textContent = C.profile.phone;
    $("#cvLink").href = C.profile.cv_pdf;

    // 연구 경험
    $("#researchList").innerHTML = C.researchExperience
      .map(
        (r) => `
        <li>
          <p class="research__period">${r.period}</p>
          <p class="research__role">${r.role}</p>
          <p class="research__org">${r.org}</p>
          <p class="research__unit">${r.unit} · ${r.location}</p>
        </li>`
      )
      .join("");

    // 연구 관심사 pills
    $("#interestPills").innerHTML = C.researchInterests.map((t) => `<li>${t}</li>`).join("");

    // 비전
    $("#visionLines").innerHTML = C.vision.lines
      .map((t, i) => `<li class="reveal" style="--i:${i + 1}">${t}</li>`)
      .join("");

    // 섬
    $("#islands").innerHTML = C.islands
      .map(
        (isl, i) => `
        <button type="button" class="island" data-index="${i}" aria-haspopup="dialog"
                aria-label="${isl.label} (${isl.count})">
          <img class="island__img" src="assets/island-${i + 1}.svg" alt="" draggable="false" />
          <span class="island__label">${isl.label}<span class="island__label-ko">${isl.label_ko}</span></span>
          <span class="island__count">${isl.count} ITEMS</span>
          <span class="island__dot" aria-hidden="true"></span>
        </button>`
      )
      .join("");
  }

  /* =========================================================
     2. 상태
     ========================================================= */
  const st = {
    cinemaTop: 0,
    targetScroll: 0,
    smoothScroll: 0,
    // 커서 (-0.5 ~ 0.5)
    tmx: 0, tmy: 0, mx: 0, my: 0,
    rawX: -9999, rawY: -9999,       // 창문 점등용 원시 좌표(px)
    // 돌고래 커서 추종 (vw/vh)
    dcx: 0, dcy: 0, dtilt: 0,
    // 씬 활성도
    active: [1, 0, 0, 0, 0],
    currentScene: 1,
    panelOpen: false,
    visited: new Set(),
    celebrated: false,
    frame: 0,
    running: true,
    pinned: null,
  };

  const cinema = $("#cinema");
  const stage = $("#stage");
  const scenes = [1, 2, 3, 4, 5].map((n) => $(`#scene${n}`));
  const navButtons = $$("[data-scroll-to]");
  const dolphinEl = $("#dolphin");

  /* 네비 → 스크롤 구간 시작점 */
  const NAV_S = { scene1: 0, scene2: 740, scene3: 1580, scene4: 2960, scene5: 3720 };

  /* =========================================================
     3. 돌고래 타임라인 (스크롤 s → 위치/각도/크기)
     flip: 1 = 왼쪽을 향함, -1 = 오른쪽을 향함
     ========================================================= */
  const KF_DESKTOP = [
    { s: 0,    x: 50, y: 60, rot: 0,   sc: 1,    op: 1,    back: 0, flip: 1 },
    { s: 300,  x: 50, y: 60, rot: 0,   sc: 1,    op: 1,    back: 0, flip: 1 },
    { s: 700,  x: 42, y: 92, rot: 30,  sc: 0.95, op: 1,    back: 0, flip: 1 },   // 아래로 헤엄쳐 내려감
    { s: 1000, x: 48, y: 78, rot: -4,  sc: 0.9,  op: 1,    back: 0, flip: 1 },   // 건물 입구(우측) 근처
    { s: 1300, x: 47, y: 78, rot: 0,   sc: 0.9,  op: 1,    back: 0, flip: 1 },
    { s: 1520, x: 50, y: 46, rot: 0,   sc: 0.9,  op: 1,    back: 0, flip: -1 },  // 섬 중앙 대기
    { s: 2750, x: 50, y: 46, rot: 0,   sc: 0.9,  op: 1,    back: 0, flip: -1 },
    { s: 3000, x: 74, y: 42, rot: -16, sc: 0.85, op: 1,    back: 0, flip: -1 },  // 우측으로 비켜 상승 시작
    { s: 3300, x: 82, y: 28, rot: -26, sc: 0.85, op: 1,    back: 0, flip: -1 },  // 수면으로 대각선 상승
    { s: 3600, x: 86, y: 20, rot: -8,  sc: 0.8,  op: 1,    back: 0, flip: -1 },
    { s: 3800, x: 86, y: 18, rot: 0,   sc: 0.7,  op: 0.85, back: 1, flip: -1 },  // 뒷모습으로 전환
    { s: 4000, x: 86, y: 16, rot: 0,   sc: 0.55, op: 0,    back: 1, flip: -1 },  // 원경으로 소실
  ];
  // 모바일: 카드/섬이 화면 중앙~하단을 쓰므로 돌고래는 상단에서 움직인다
  const KF_MOBILE = [
    { s: 0,    x: 50, y: 62, rot: 0,   sc: 1,    op: 1,    back: 0, flip: 1 },
    { s: 300,  x: 50, y: 62, rot: 0,   sc: 1,    op: 1,    back: 0, flip: 1 },
    { s: 700,  x: 40, y: 94, rot: 30,  sc: 0.95, op: 1,    back: 0, flip: 1 },
    { s: 1000, x: 70, y: 22, rot: -4,  sc: 0.9,  op: 1,    back: 0, flip: 1 },
    { s: 1300, x: 68, y: 22, rot: 0,   sc: 0.9,  op: 1,    back: 0, flip: 1 },
    { s: 1520, x: 50, y: 21, rot: 0,   sc: 0.85, op: 1,    back: 0, flip: -1 },
    { s: 2750, x: 50, y: 21, rot: 0,   sc: 0.85, op: 1,    back: 0, flip: -1 },
    { s: 3000, x: 62, y: 18, rot: -14, sc: 0.8,  op: 1,    back: 0, flip: -1 },
    { s: 3300, x: 72, y: 14, rot: -22, sc: 0.8,  op: 1,    back: 0, flip: -1 },
    { s: 3600, x: 78, y: 12, rot: -6,  sc: 0.75, op: 1,    back: 0, flip: -1 },
    { s: 3800, x: 78, y: 11, rot: 0,   sc: 0.65, op: 0.85, back: 1, flip: -1 },
    { s: 4000, x: 78, y: 10, rot: 0,   sc: 0.5,  op: 0,    back: 1, flip: -1 },
  ];
  let KF = MOBILE_MQ.matches ? KF_MOBILE : KF_DESKTOP;
  MOBILE_MQ.addEventListener("change", (e) => { KF = e.matches ? KF_MOBILE : KF_DESKTOP; });

  function sampleKF(s) {
    if (s <= KF[0].s) return { ...KF[0] };
    for (let i = 0; i < KF.length - 1; i++) {
      const a = KF[i], b = KF[i + 1];
      if (s >= a.s && s <= b.s) {
        const t = smoothstep(a.s, b.s, s);
        return {
          x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), rot: lerp(a.rot, b.rot, t),
          sc: lerp(a.sc, b.sc, t), op: lerp(a.op, b.op, t), back: lerp(a.back, b.back, t),
          flip: t < 0.5 ? a.flip : b.flip,
        };
      }
    }
    return { ...KF[KF.length - 1] };
  }

  /* =========================================================
     4. 스크롤 / 포인터 입력
     ========================================================= */
  function measure() {
    st.cinemaTop = cinema.getBoundingClientRect().top + window.scrollY;
    readScroll();
  }
  function readScroll() {
    if (st.pinned != null) { st.targetScroll = st.pinned; return; }
    st.targetScroll = clamp(window.scrollY - st.cinemaTop, 0, S);
  }
  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", () => { measure(); fx.resize(); }, { passive: true });

  if (!REDUCED) {
    window.addEventListener("pointermove", (e) => {
      st.tmx = e.clientX / window.innerWidth - 0.5;
      st.tmy = e.clientY / window.innerHeight - 0.5;
      st.rawX = e.clientX; st.rawY = e.clientY;
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => { st.tmx = 0; st.tmy = 0; st.rawX = st.rawY = -9999; });
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const key = btn.dataset.scrollTo;
      const s = NAV_S[key] ?? 0;
      window.scrollTo({ top: st.cinemaTop + s, behavior: REDUCED ? "auto" : "smooth" });
    });
  });

  /* =========================================================
     5. Canvas FX — 기포 · 빛줄기
     ========================================================= */
  const fx = (() => {
    const canvas = $("#fx");
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, dpr = 1;
    let bubbles = [];
    let burst = [];
    const t0 = performance.now();

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = stage.clientWidth; H = stage.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = clamp(Math.round((W * H) / 26000), 24, 90);
      bubbles = Array.from({ length: n }, () => spawn(true));
    }
    function spawn(anywhere) {
      const r = 1.2 + Math.random() * 3.4;
      return {
        x: Math.random() * W,
        y: anywhere ? Math.random() * H : H + r + Math.random() * 40,
        r,
        vy: 14 + Math.random() * 26 + r * 4,     // px/s
        ph: Math.random() * Math.PI * 2,
        amp: 6 + Math.random() * 10,
        a: 0.25 + Math.random() * 0.45,
      };
    }
    function celebrate() {
      for (let i = 0; i < 46; i++) {
        const r = 1.5 + Math.random() * 3;
        burst.push({
          x: W * (0.3 + Math.random() * 0.4), y: H * (0.55 + Math.random() * 0.2),
          r, vy: 60 + Math.random() * 90, vx: (Math.random() - 0.5) * 50,
          life: 1, decay: 0.35 + Math.random() * 0.3,
        });
      }
    }

    function draw(dt, time, a, mx, my) {
      ctx.clearRect(0, 0, W, H);
      const [s1, , , s4, s5] = a;

      // ---- 빛줄기 (수면 근처 씬에서만) ----
      const rayA = clamp(s1 * 0.9 + s4 * 0.8 + s5 * 0.6, 0, 1);
      if (rayA > 0.01) {
        const tilt = (REDUCED ? 0 : my) * 0.22;          // 커서 y → 각도
        const sway = Math.sin(time * 0.00035) * 0.03;
        ctx.save();
        ctx.globalAlpha = 0.11 * rayA;
        ctx.fillStyle = "#ffffff";
        const rays = 5;
        for (let i = 0; i < rays; i++) {
          const bx = W * (0.18 + i * 0.16) + (REDUCED ? 0 : -mx * 40);
          const ang = -0.26 + i * 0.12 + tilt + sway;
          const w0 = 18 + i * 6, w1 = 110 + i * 30;
          const len = H * 1.15;
          const dx = Math.sin(ang) * len, dy = Math.cos(ang) * len;
          ctx.beginPath();
          ctx.moveTo(bx - w0, -20);
          ctx.lineTo(bx + w0, -20);
          ctx.lineTo(bx + dx + w1, dy);
          ctx.lineTo(bx + dx - w1, dy);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // ---- 기포 ----
      const drift = REDUCED ? 0 : -mx * 22;   // 커서 반대 방향으로 미세 흐름 (px/s)
      ctx.lineWidth = 1;
      for (const b of bubbles) {
        b.y -= b.vy * dt;
        b.x += (Math.sin(time * 0.001 + b.ph) * b.amp * 0.6 + drift) * dt;
        if (b.y < -b.r * 2) Object.assign(b, spawn(false));
        if (b.x < -10) b.x = W + 10; else if (b.x > W + 10) b.x = -10;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${b.a})`;
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${b.a * 0.18})`;
        ctx.fill();
      }

      // ---- 축하 기포 ----
      if (burst.length) {
        for (const p of burst) {
          p.y -= p.vy * dt; p.x += p.vx * dt; p.life -= p.decay * dt;
          if (p.life <= 0) continue;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (0.6 + p.life * 0.6), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,255,255,${0.75 * p.life})`;
          ctx.stroke();
        }
        burst = burst.filter((p) => p.life > 0);
      }
    }
    return { resize, draw, celebrate, get t0() { return t0; } };
  })();

  /* =========================================================
     6. 섬 → 돌고래 이동 → 패널 → 카드 슬라이더
     ========================================================= */
  const panel = $("#panel");
  const panelTitle = $("#panelTitle");
  const panelKicker = $("#panelKicker");
  const track = $("#sliderTrack");
  const viewport = $("#sliderViewport");
  const prevBtn = $("#sliderPrev");
  const nextBtn = $("#sliderNext");
  const countEl = $("#sliderCount");
  let slideIndex = 0, slideCount = 1, lastFocus = null, activeIsland = null;

  function islandButtons() { return $$(".island"); }

  function dolphinDeltaTo(btn) {
    // 섬 이미지 위쪽 약간 위로 헤엄쳐 가도록 목표 지점 계산
    const img = $(".island__img", btn) || btn;
    const ir = img.getBoundingClientRect();
    const dr = dolphinEl.getBoundingClientRect();
    const tx = ir.left + ir.width / 2;
    const ty = ir.top - Math.min(60, ir.height * 0.35);
    const cx = dr.left + dr.width / 2 - parseFloat(vars["--dolphin-ox"] || 0);
    const cy = dr.top + dr.height / 2 - parseFloat(vars["--dolphin-oy"] || 0);
    return { dx: tx - cx, dy: ty - cy };
  }

  // 돌고래 오프셋 트윈 (0.8s, easeInOut). 메인 루프에서 진행한다.
  const dtw = { active: false, x0: 0, y0: 0, x1: 0, y1: 0, t0: 0, dur: 0.8, onDone: null, guard: 0 };
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  function tweenDolphin(dx, dy, onDone) {
    if (REDUCED) {
      setVar("--dolphin-ox", dx); setVar("--dolphin-oy", dy);
      onDone && onDone();
      return;
    }
    dtw.x0 = parseFloat(vars["--dolphin-ox"] || 0);
    dtw.y0 = parseFloat(vars["--dolphin-oy"] || 0);
    dtw.x1 = dx; dtw.y1 = dy;
    dtw.t0 = performance.now();
    dtw.onDone = onDone || null;
    dtw.active = true;
    clearTimeout(dtw.guard);
    dtw.guard = setTimeout(() => { if (dtw.active) stepDolphinTween(dtw.t0 + dtw.dur * 1000 + 1); }, dtw.dur * 1000 + 250);
  }
  function stepDolphinTween(now) {
    if (!dtw.active) return;
    const t = clamp((now - dtw.t0) / 1000 / dtw.dur, 0, 1);
    const e = easeInOut(t);
    setVar("--dolphin-ox", lerp(dtw.x0, dtw.x1, e));
    setVar("--dolphin-oy", lerp(dtw.y0, dtw.y1, e));
    if (t >= 1) {
      dtw.active = false;
      const cb = dtw.onDone; dtw.onDone = null;
      cb && cb();
    }
  }

  function openIsland(btn) {
    if (st.panelOpen) return;
    const idx = Number(btn.dataset.index);
    lastFocus = btn;
    activeIsland = btn;
    islandButtons().forEach((b) => b.classList.remove("is-target"));
    btn.classList.add("is-target");
    const { dx, dy } = dolphinDeltaTo(btn);
    // 섬 방향으로 시선 전환
    setVar("--dolphin-flip", dx < 0 ? 1 : -1);
    tweenDolphin(dx, dy, () => openPanel(idx));
  }

  function renderCards(items) {
    track.innerHTML = items
      .map(
        (it, i) => `
        <li class="xcard" aria-roledescription="slide" aria-label="${i + 1} of ${items.length}">
          <article class="xcard__inner">
            <p class="xcard__meta">${it.meta}</p>
            <h3 class="xcard__title">${it.title}</h3>
            <div class="xcard__rows">
              <span class="xcard__key">Background</span><p>${it.background}</p>
              <span class="xcard__key">Role</span><p>${it.role}</p>
            </div>
            <span class="xcard__badge">${it.result}</span>
          </article>
        </li>`
      )
      .join("");
  }

  function goTo(i, instant = false) {
    slideIndex = clamp(i, 0, slideCount - 1);
    track.classList.toggle("no-transition", instant);
    track.style.transform = `translateX(${-slideIndex * 100}%)`;   // 슬라이더는 패널 로컬 상태 → 직접 제어 허용
    if (instant) requestAnimationFrame(() => track.classList.remove("no-transition"));
    prevBtn.disabled = slideIndex === 0;
    nextBtn.disabled = slideIndex === slideCount - 1;
    countEl.textContent = `${slideIndex + 1} / ${slideCount}`;
  }

  function openPanel(idx) {
    const isl = C.islands[idx];
    panelKicker.textContent = `${isl.label_ko} · ${isl.count} items`;
    panelTitle.textContent = isl.label;
    renderCards(isl.items);
    slideCount = isl.items.length;
    goTo(0, true);
    panel.classList.remove("is-closing");
    panel.hidden = false;
    body.classList.add("is-locked");
    st.panelOpen = true;
    $(".panel__close").focus({ preventScroll: true });

    // 방문 기록
    st.visited.add(idx);
    islandButtons()[idx].classList.add("is-visited");
    if (st.visited.size === C.islands.length && !st.celebrated) {
      st.celebrated = true;
      setTimeout(() => fx.celebrate(), 300);
    }
  }

  function closePanel() {
    if (!st.panelOpen) return;
    const finish = () => {
      panel.hidden = true;
      body.classList.remove("is-locked");
      st.panelOpen = false;
      if (activeIsland) activeIsland.classList.remove("is-target");
      // 돌고래 중앙 복귀
      setVar("--dolphin-flip", -1);
      tweenDolphin(0, 0);
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };
    if (REDUCED) finish();
    else {
      panel.classList.add("is-closing");
      setTimeout(finish, 280);
    }
  }

  // 이벤트: 섬 클릭 / 키보드
  $("#islands").addEventListener("click", (e) => {
    const btn = e.target.closest(".island");
    if (btn) openIsland(btn);
  });
  $$("[data-panel-close]").forEach((el) => el.addEventListener("click", closePanel));
  prevBtn.addEventListener("click", () => goTo(slideIndex - 1));
  nextBtn.addEventListener("click", () => goTo(slideIndex + 1));
  document.addEventListener("keydown", (e) => {
    if (!st.panelOpen) return;
    if (e.key === "Escape") { e.preventDefault(); closePanel(); }
    else if (e.key === "ArrowRight") goTo(slideIndex + 1);
    else if (e.key === "ArrowLeft") goTo(slideIndex - 1);
  });

  // 드래그 (데스크톱 가로 슬라이더에서만)
  (() => {
    let startX = 0, dragging = false, moved = 0;
    viewport.addEventListener("pointerdown", (e) => {
      if (MOBILE_MQ.matches) return;
      dragging = true; moved = 0; startX = e.clientX;
      viewport.classList.add("is-dragging");
      track.classList.add("no-transition");
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      moved = e.clientX - startX;
      track.style.transform = `translateX(calc(${-slideIndex * 100}% + ${moved}px))`;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove("is-dragging");
      track.classList.remove("no-transition");
      const threshold = viewport.clientWidth * 0.18;
      if (moved < -threshold) goTo(slideIndex + 1);
      else if (moved > threshold) goTo(slideIndex - 1);
      else goTo(slideIndex);
    };
    viewport.addEventListener("pointerup", end);
    viewport.addEventListener("pointercancel", end);
  })();

  /* =========================================================
     7. Scene 2 — 창문 근접 점등
     ========================================================= */
  const wins = $$(".win");
  function updateWindows() {
    if (REDUCED || st.active[1] < 0.3 || st.rawX < 0) {
      if (wins.some((w) => w.classList.contains("lit"))) wins.forEach((w) => w.classList.remove("lit"));
      return;
    }
    const R = 72;
    for (const w of wins) {
      const r = w.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.hypot(cx - st.rawX, cy - st.rawY);
      w.classList.toggle("lit", d < R);
    }
  }

  /* =========================================================
     8. 메인 루프
     ========================================================= */
  let last = performance.now();
  function frame(now) {
    if (!st.running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    st.frame++;

    // ---- 스크롤 스무딩 ----
    if (REDUCED) st.smoothScroll = st.targetScroll;
    else {
      const diff = st.targetScroll - st.smoothScroll;
      st.smoothScroll = Math.abs(diff) < 0.08 ? st.targetScroll : lerp(st.smoothScroll, st.targetScroll, 0.14);
    }
    const s = st.smoothScroll;

    // ---- 커서 스무딩 ----
    st.mx = lerp(st.mx, st.tmx, 0.12);
    st.my = lerp(st.my, st.tmy, 0.12);
    setVar("--mx", st.mx);
    setVar("--my", st.my);

    // ---- 씬 활성도 ----
    const a1 = 1 - smoothstep(520, 760, s);
    const a2 = smoothstep(700, 950, s) * (1 - smoothstep(1330, 1500, s));
    const a3 = smoothstep(1500, 1720, s) * (1 - smoothstep(2720, 2900, s));
    const a4 = smoothstep(2900, 3120, s) * (1 - smoothstep(3430, 3600, s));
    const a5 = smoothstep(3600, 3820, s);
    st.active = [a1, a2, a3, a4, a5];
    setVar("--s1", a1); setVar("--s2", a2); setVar("--s3", a3); setVar("--s4", a4); setVar("--s5", a5);
    setVar("--s1-exit", smoothstep(300, 700, s));
    setVar("--s2-in", smoothstep(700, 1100, s));
    setVar("--s5-in", smoothstep(3600, 4000, s));

    // is-active 클래스 (텍스트 등장 트리거 + pointer-events)
    let cur = 1, best = 0;
    st.active.forEach((v, i) => {
      scenes[i].classList.toggle("is-active", v > 0.35);
      if (v > best) { best = v; cur = i + 1; }
    });
    if (cur !== st.currentScene) {
      st.currentScene = cur;
      const key = `scene${cur}`;
      navButtons.forEach((b) => b.classList.toggle("is-current", b.dataset.scrollTo === key && cur !== 1));
    }

    // ---- 배경 수심 ----
    const depth = clamp(
      smoothstep(500, 1000, s) * 0.5 + smoothstep(1400, 2000, s) * 0.5 - smoothstep(2900, 3400, s),
      0, 1
    );
    const bg = depth < 0.5 ? mix(SKY50, SKY100, depth * 2) : mix(SKY100, SKY200, (depth - 0.5) * 2);
    setVar("--bg", rgbStr(bg));
    setVar("--depth", depth);
    const deep = luminance(bg) < 0.3;
    if ((body.dataset.theme === "deep") !== deep) body.dataset.theme = deep ? "deep" : "";

    // ---- 돌고래 ----
    const k = sampleKF(s);
    // 커서 추종: Scene 1에선 최대 ±6vw, 그 외 ±1.5vw. 계수 0.06
    const range = lerp(1.5, 6, a1);
    const tx = REDUCED ? 0 : st.tmx * 2 * range;
    const ty = REDUCED ? 0 : st.tmy * 2 * range * 0.5;
    const prev = st.dcx;
    st.dcx = lerp(st.dcx, tx, 0.06);
    st.dcy = lerp(st.dcy, ty, 0.06);
    // 이동 방향에 따른 기울기 ±6deg (좌향 기준: 오른쪽 이동 = 시계방향)
    const vel = (st.dcx - prev) / Math.max(dt, 1 / 120);
    st.dtilt = lerp(st.dtilt, clamp(vel * 0.9, -6, 6) * a1, 0.1);
    setVar("--dolphin-x", k.x); setVar("--dolphin-y", k.y);
    setVar("--dolphin-cx", st.dcx); setVar("--dolphin-cy", st.dcy);
    setVar("--dolphin-rot", k.rot + st.dtilt * k.flip);
    setVar("--dolphin-scale", k.sc); setVar("--dolphin-op", k.op);
    setVar("--dolphin-back", k.back);
    if (!st.panelOpen) setVar("--dolphin-flip", k.flip);

    // ---- 돌고래 섬 이동 트윈 ----
    stepDolphinTween(now);

    // ---- 창문 점등 (3프레임마다) ----
    if (st.frame % 3 === 0) updateWindows();

    // ---- Canvas ----
    fx.draw(dt, now - fx.t0, st.active, st.mx, st.my);

    requestAnimationFrame(frame);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) st.running = false;
    else if (!st.running) { st.running = true; last = performance.now(); requestAnimationFrame(frame); }
  });

  /* =========================================================
     9. 시작
     ========================================================= */
  renderContent();
  measure();
  fx.resize();

  // 개발용: ?s=2200 → 스크롤과 무관하게 진행도를 s에 고정(pin), &open=0 → 섬 패널 자동 오픈
  const qs = new URLSearchParams(location.search);
  if (qs.has("s")) {
    st.pinned = clamp(Number(qs.get("s")) || 0, 0, S);
    st.targetScroll = st.pinned;
  }
  st.smoothScroll = st.targetScroll;

  // 첫 프레임에서 Scene 1 텍스트 등장
  requestAnimationFrame(() => {
    scenes[0].classList.add("is-active");
    requestAnimationFrame(frame);
    if (qs.has("open")) {
      const btn = islandButtons()[Number(qs.get("open")) || 0];
      if (btn) setTimeout(() => openIsland(btn), 400);
    }
  });
})();
