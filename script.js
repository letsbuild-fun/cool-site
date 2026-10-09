// Theme toggle: system preference by default, remembered override if clicked.
const root = document.documentElement;
try {
  const saved = localStorage.getItem("theme");
  if (saved) root.dataset.theme = saved;
} catch (e) {}

document.getElementById("theme").addEventListener("click", () => {
  const isDark = root.dataset.theme
    ? root.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = isDark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
});

document.getElementById("year").textContent = new Date().getFullYear();

// Rotating headline word.
const words = ["fun things", "tiny tools", "weird ideas", "cool sites", "side quests"];
const wordEl = document.getElementById("word");
let wordIndex = 0;
setInterval(() => {
  wordEl.classList.add("swap");
  setTimeout(() => {
    wordIndex = (wordIndex + 1) % words.length;
    wordEl.textContent = words[wordIndex];
    wordEl.classList.remove("swap");
  }, 250);
}, 2600);

// Particle field that drifts, links nearby dots, follows the cursor, and bursts on click.
const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const colors = ["#ff5f6d", "#7b61ff", "#00c2a8"];
const pointer = { x: -9999, y: -9999 };
let particles = [];
let width, height, dpr;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = Math.round(Math.min(110, (width * height) / 14000));
  particles = Array.from({ length: count }, () => makeParticle(Math.random() * width, Math.random() * height, 0.4));
}

function makeParticle(x, y, speed) {
  const angle = Math.random() * Math.PI * 2;
  return {
    x, y,
    vx: Math.cos(angle) * speed * (0.5 + Math.random()),
    vy: Math.sin(angle) * speed * (0.5 + Math.random()),
    r: 1.5 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: Infinity,
  };
}

function burst(x, y) {
  for (let i = 0; i < 24; i++) {
    const p = makeParticle(x, y, 3 + Math.random() * 3);
    p.life = 60 + Math.random() * 40;
    particles.push(p);
  }
}

function frame() {
  ctx.clearRect(0, 0, width, height);

  for (const p of particles) {
    const dx = pointer.x - p.x;
    const dy = pointer.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 160 && dist > 1) {
      p.vx += (dx / dist) * 0.03;
      p.vy += (dy / dist) * 0.03;
    }
    if (p.life !== Infinity) {
      p.life--;
      p.vx *= 0.96;
      p.vy *= 0.96;
    } else {
      p.vx *= 0.99;
      p.vy *= 0.99;
      if (Math.hypot(p.vx, p.vy) < 0.15) {
        p.vx += (Math.random() - 0.5) * 0.1;
        p.vy += (Math.random() - 0.5) * 0.1;
      }
    }
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x += width;
    if (p.x > width) p.x -= width;
    if (p.y < 0) p.y += height;
    if (p.y > height) p.y -= height;
  }
  particles = particles.filter((p) => p.life > 0);

  ctx.lineWidth = 1;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 110) {
        ctx.globalAlpha = (1 - d / 110) * 0.35;
        ctx.strokeStyle = a.color;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  for (const p of particles) {
    ctx.globalAlpha = p.life === Infinity ? 0.9 : Math.max(0, p.life / 100);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (!reduceMotion) requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; });
window.addEventListener("pointerleave", () => { pointer.x = pointer.y = -9999; });
window.addEventListener("pointerdown", (e) => {
  if (e.target.closest("a, button")) return;
  burst(e.clientX, e.clientY);
  if (reduceMotion) frame();
});

resize();
frame();
