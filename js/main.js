  /* =========================================================
     PIXEL BLACKHOLE  —  low-res canvas, rotating accretion disk
     ========================================================= */
  (function () {
    const canvas = document.getElementById('blackhole');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;   // 120
    const H = canvas.height;  // 120
    const cx = W / 2;
    const cy = H / 2;

    // Cream / sepia palette
    const palette = [
      '#FAF3E3', // brightest highlight
      '#E9C97A', // glow
      '#D4B98C', // mid cream
      '#B8864B', // accent gold
      '#8B6A3F', // sepia
      '#5C4530', // ink soft
      '#3A2A18', // ink
      '#1a1109'  // near-black rim
    ];

    let t = 0;

    function shade(noiseSeed, dist, angle, time) {
      // event horizon - black disk
      if (dist < 12) return null;            // void
      // photon ring / bright rim
      if (dist < 14) return palette[0];
      if (dist < 16) return palette[1];

      // accretion disk swirl
      // squashed perspective: scale y to fake disk tilt
      // already handled in caller; here we modulate by angle+dist
      const swirl = angle + time * 0.04 + dist * 0.18;
      const wave = Math.sin(swirl) * 0.5 + 0.5;        // 0..1
      const wave2 = Math.sin(swirl * 2.3 + noiseSeed) * 0.5 + 0.5;
      const intensity = wave * 0.7 + wave2 * 0.3;

      // distance falloff
      const fall = 1 - Math.min(1, (dist - 14) / 44);
      const v = intensity * fall;

      if (v > 0.85) return palette[1];
      if (v > 0.7)  return palette[2];
      if (v > 0.55) return palette[3];
      if (v > 0.4)  return palette[4];
      if (v > 0.25) return palette[5];
      if (v > 0.12) return palette[6];
      return null; // transparent
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // disk tilt: squash y by 0.45
      const tiltY = 0.45;
      const maxR = 56;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const dx = x - cx;
          const dy = (y - cy) / tiltY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxR + 2) continue;

          const angle = Math.atan2(dy, dx);
          // tiny per-pixel pseudo-noise for grain
          const noise = ((x * 73 + y * 131) % 7) * 0.07;

          const col = shade(noise, dist, angle, t);
          if (col === null) {
            // inside event horizon -> deep black
            if (dist < 12) {
              ctx.fillStyle = '#0a0603';
              ctx.fillRect(x, y, 1, 1);
            }
            continue;
          }
          ctx.fillStyle = col;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // gravitational lensing arc above the disk
      const lensR = 18;
      for (let a = -1.2; a < -0.2; a += 0.04) {
        const lx = Math.round(cx + Math.cos(a) * lensR);
        const ly = Math.round(cy + Math.sin(a) * lensR);
        const flicker = (Math.sin(t * 0.1 + a * 5) + 1) * 0.5;
        ctx.fillStyle = flicker > 0.6 ? palette[0] : palette[1];
        ctx.fillRect(lx, ly, 1, 1);
      }
      // lensing arc below
      for (let a = 0.2; a < 1.2; a += 0.04) {
        const lx = Math.round(cx + Math.cos(a) * lensR);
        const ly = Math.round(cy + Math.sin(a) * lensR);
        const flicker = (Math.sin(t * 0.1 + a * 5 + 1.5) + 1) * 0.5;
        ctx.fillStyle = flicker > 0.6 ? palette[0] : palette[1];
        ctx.fillRect(lx, ly, 1, 1);
      }

      // sparse background stars (twinkling)
      ctx.fillStyle = palette[2];
      const stars = [
        [10, 15], [22, 8], [104, 12], [115, 30], [8, 50],
        [110, 90], [18, 105], [98, 110], [60, 5], [60, 115],
        [4, 80], [116, 65]
      ];
      stars.forEach((s, i) => {
        const tw = (Math.sin(t * 0.08 + i) + 1) * 0.5;
        if (tw > 0.4) {
          ctx.fillStyle = tw > 0.8 ? palette[0] : palette[3];
          ctx.fillRect(s[0], s[1], 1, 1);
        }
      });

      t += 1;
      requestAnimationFrame(draw);
    }
    draw();
  })();

  /* =========================================================
     SCROLL REVEAL
     ========================================================= */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('show');
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* =========================================================
     ORBITAL SKILLS CANVAS
     pixel-art mini solar system: pulsar core, 6 planets, neutron
     star and Claude CLI satellite. Pure 2D canvas, low-res.
     ========================================================= */
  (function () {
    const canvas = document.getElementById('orbits');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const palette = {
      cream0: '#FAF3E3',
      glow:   '#E9C97A',
      cream3: '#D4B98C',
      accent: '#B8864B',
      sepia:  '#8B6A3F',
      inkS:   '#5C4530',
      ink:    '#3A2A18'
    };

    // Internal logical resolution — kept low for pixel feel.
    let W = canvas.width;
    let H = canvas.height;
    let cx = W / 2;
    let cy = H / 2;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      // Logical buffer matches displayed size scaled down for pixel feel.
      const scale = 0.35; // each logical px is ~3 display px
      W = Math.max(200, Math.floor(rect.width  * scale));
      H = Math.max(200, Math.floor(rect.height * scale));
      canvas.width  = W;
      canvas.height = H;
      cx = W / 2;
      cy = H / 2;
    }
    resize();
    window.addEventListener('resize', resize);

    // Orbits — radius is relative to min(W,H)/2
    // type drives draw style. label only used in tooltips.
    const bodies = [
      { type: 'rocky',    r: 0.18, speed: 0.020, phase: 0.0, size: 2, color: palette.sepia },
      { type: 'ringed',   r: 0.28, speed: 0.014, phase: 1.1, size: 3, color: palette.cream3 },
      { type: 'gas',      r: 0.40, speed: 0.010, phase: 2.4, size: 4, color: palette.glow   },
      { type: 'ice',      r: 0.52, speed: 0.008, phase: 3.6, size: 3, color: palette.cream0 },
      { type: 'claude',   r: 0.64, speed: 0.013, phase: 4.7, size: 3, color: palette.accent },
      { type: 'comet',    r: 0.78, speed: 0.018, phase: 5.9, size: 2, color: palette.cream0 },
    ];
    // Neutron star sits off to a side as a stationary deep-orbit pulsar
    const neutron = { x: 0.86, y: 0.18, r: 2 };

    function px(x, y, color) {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      ctx.fillStyle = color;
      ctx.fillRect(x | 0, y | 0, 1, 1);
    }
    function disc(x, y, rad, color) {
      // crude pixel disc
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          if (dx*dx + dy*dy <= rad*rad) px(x + dx, y + dy, color);
        }
      }
    }
    function ring(x, y, rad, color, tilt) {
      // squashed elliptical ring
      const t = tilt || 0.35;
      for (let a = 0; a < Math.PI * 2; a += 0.08) {
        px(x + Math.cos(a) * rad, y + Math.sin(a) * rad * t, color);
      }
    }

    let t = 0;
    let activeBody = null; // index of hovered card -> body to highlight
    const cards = Array.from(document.querySelectorAll('.skill-group'));
    const bodyMap = {
      'planet-rocky': 0, 'ringed': 1, 'gas-giant': 2, 'ice': 3,
      'claude': 4, 'comet': 5, 'neutron': -1
    };
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        const key = card.getAttribute('data-body');
        activeBody = bodyMap[key];
      });
      card.addEventListener('mouseleave', () => { activeBody = null; });
    });

    function drawOrbits() {
      // faint orbit traces
      ctx.fillStyle = palette.sepia;
      const minDim = Math.min(W, H);
      bodies.forEach((b, i) => {
        const rad = b.r * minDim * 0.5;
        const alpha = (i === activeBody) ? 0.9 : 0.18;
        ring(cx, cy, rad, palette.sepia, 0.35 + (i % 2) * 0.05);
        // brighten when active
        if (i === activeBody) ring(cx, cy, rad + 1, palette.accent, 0.35 + (i % 2) * 0.05);
      });
    }

    function drawCore() {
      // pulsar core — flashing center with cross rays
      const flash = (Math.sin(t * 0.18) + 1) * 0.5; // 0..1
      const coreColor = flash > 0.6 ? palette.cream0 : palette.glow;
      disc(cx, cy, 3, coreColor);
      // event-horizon-ish dark ring
      disc(cx, cy, 1, palette.ink);
      // cross-shaped rays
      const rayLen = 6 + Math.floor(flash * 4);
      for (let i = -rayLen; i <= rayLen; i++) {
        if (Math.abs(i) > 1) {
          px(cx + i, cy, palette.accent);
          px(cx, cy + i, palette.accent);
        }
      }
    }

    function drawBody(b, i) {
      const minDim = Math.min(W, H);
      const rad = b.r * minDim * 0.5;
      const ang = b.phase + t * b.speed;
      // disk-tilt so orbits look ecliptic
      const tilt = 0.35 + (i % 2) * 0.05;
      const x = cx + Math.cos(ang) * rad;
      const y = cy + Math.sin(ang) * rad * tilt;

      switch (b.type) {
        case 'rocky':
          disc(x, y, b.size, b.color);
          px(x - 1, y, palette.ink); // surface dot
          break;
        case 'ringed':
          disc(x, y, b.size, b.color);
          ring(x, y, b.size + 2, palette.accent, 0.25);
          break;
        case 'gas':
          disc(x, y, b.size, b.color);
          // banding
          for (let dx = -b.size; dx <= b.size; dx++) px(x + dx, y, palette.accent);
          for (let dx = -b.size + 1; dx <= b.size - 1; dx++) px(x + dx, y - 1, palette.sepia);
          break;
        case 'ice':
          disc(x, y, b.size, palette.cream0);
          ring(x, y, b.size, palette.glow, 1.0);
          break;
        case 'claude':
          // small "satellite" — square body with antennae + 4-pointed star glyph
          // body
          ctx.fillStyle = palette.accent;
          ctx.fillRect(x - 1, y - 1, 3, 3);
          // solar-panel wings
          px(x - 3, y, palette.sepia); px(x - 4, y, palette.sepia);
          px(x + 2, y, palette.sepia); px(x + 3, y, palette.sepia);
          // 4-point star glow above
          px(x, y - 3, palette.glow);
          px(x, y - 2, palette.cream0);
          break;
        case 'comet':
          disc(x, y, 1, palette.cream0);
          // tail points away from center
          const tx = (cx - x), ty = (cy - y);
          const len = Math.hypot(tx, ty) || 1;
          const ux = -tx / len, uy = -ty / len;
          for (let k = 1; k <= 6; k++) {
            const col = k < 3 ? palette.glow : (k < 5 ? palette.accent : palette.sepia);
            px(x + ux * k, y + uy * k, col);
          }
          break;
      }

      // active highlight ring around body
      if (i === activeBody) {
        ring(x, y, b.size + 3, palette.ink, 1.0);
      }
    }

    function drawNeutron() {
      const nx = neutron.x * W;
      const ny = neutron.y * H;
      // sharp bright pulsar — quick beat
      const beat = (Math.sin(t * 0.55) + 1) * 0.5;
      const bright = beat > 0.75;
      disc(nx, ny, neutron.r, bright ? palette.cream0 : palette.glow);
      if (bright) {
        // beams
        for (let k = 2; k <= 6; k++) {
          px(nx + k, ny, palette.glow);
          px(nx - k, ny, palette.glow);
          px(nx, ny + k, palette.glow);
          px(nx, ny - k, palette.glow);
        }
      }
      // permanent faint cross
      px(nx + 3, ny, palette.accent); px(nx - 3, ny, palette.accent);
      px(nx, ny + 3, palette.accent); px(nx, ny - 3, palette.accent);
    }

    function drawStars() {
      // sparse twinkling background
      for (let i = 0; i < 24; i++) {
        const sx = ((i * 53) % W);
        const sy = ((i * 97) % H);
        const tw = (Math.sin(t * 0.08 + i) + 1) * 0.5;
        if (tw > 0.55) px(sx, sy, tw > 0.85 ? palette.cream0 : palette.cream3);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      drawStars();
      drawOrbits();
      drawCore();
      bodies.forEach(drawBody);
      drawNeutron();
      t += 1;
      requestAnimationFrame(draw);
    }
    draw();
  })();

  /* =========================================================
     ENERGY SPINE — position nodes at each section's number badge,
     light the closest node as you scroll.
     ========================================================= */
  (function () {
    const spine = document.querySelector('.energy-spine');
    if (!spine) return;
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const nodes = [];

    sections.forEach((sec, i) => {
      const node = document.createElement('div');
      node.className = 'node';
      node.textContent = String(i + 1).padStart(2, '0').slice(-1); // 1..n single digit
      spine.appendChild(node);
      nodes.push({ el: node, section: sec });
    });

    function positionNodes() {
      const spineRect = spine.getBoundingClientRect();
      nodes.forEach(n => {
        const num = n.section.querySelector('.section-head .num');
        const anchor = num || n.section;
        const rect = anchor.getBoundingClientRect();
        const top = (rect.top + rect.height / 2) - spineRect.top;
        // Only show node when it falls within the visible spine range
        if (top < 0 || top > spineRect.height) {
          n.el.style.display = 'none';
        } else {
          n.el.style.display = 'grid';
          n.el.style.top = top + 'px';
        }
      });
    }

    function updateActive() {
      const mid = window.innerHeight * 0.42;
      let bestIdx = -1, bestDist = Infinity;
      nodes.forEach((n, i) => {
        const rect = n.section.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const d = Math.abs(center - mid);
        if (d < bestDist && rect.bottom > 0 && rect.top < window.innerHeight) {
          bestDist = d; bestIdx = i;
        }
      });
      nodes.forEach((n, i) => n.el.classList.toggle('active', i === bestIdx));
    }

    function onScroll() {
      positionNodes();
      updateActive();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Initial pass + retry after layout settles
    onScroll();
    setTimeout(onScroll, 100);
    setTimeout(onScroll, 400);
  })();
