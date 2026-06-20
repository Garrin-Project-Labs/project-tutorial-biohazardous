const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const levelEl = document.querySelector('#level');
const statusEl = document.querySelector('#status');
const startBtn = document.querySelector('#start');
const resetBtn = document.querySelector('#reset');

const pilot = { x: 340, y: 360, w: 44, h: 36, emoji: '🚀', name: 'Pilot' };
const keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false };
let meteors = [];
let score = 0;
let level = 1;
let running = false;
let lastSpawn = 0;
let frame = 0;
const pilotSpeed = 7;
const dodgesPerLevel = 13;
const speedBoostPerLevel = 1.5;

function reset() {
  pilot.x = canvas.width / 2 - pilot.w / 2;
  meteors = [];
  score = 0;
  level = 1;
  frame = 0;
  running = false;
  statusEl.textContent = 'Ready';
  updateHud();
  draw();
}

function updateHud() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
}

function spawnMeteor() {
  const size = 26 + Math.random() * 22;
  const levelSpeedBoost = (level - 1) * speedBoostPerLevel;
  meteors.push({ x: Math.random() * (canvas.width - size), y: -size, size, speed: 4.2 + Math.random() * 2.4 + levelSpeedBoost });
}

function countSuccessfulDodges() {
  const stillFalling = [];

  for (const meteor of meteors) {
    if (meteor.y < canvas.height + meteor.size) {
      stillFalling.push(meteor);
      continue;
    }

    score++;

    if (score % dodgesPerLevel === 0) {
      level++;
      statusEl.textContent = `Level ${level}: the sins move faster.`;
    }
  }

  meteors = stillFalling;
  updateHud();
}

function hit(a, b) {
  return a.x < b.x + b.size && a.x + a.w > b.x && a.y < b.y + b.size && a.y + a.h > b.y;
}

function step(timestamp) {
  if (!running) return;
  frame++;

  if (keys.ArrowLeft || keys.a) pilot.x -= pilotSpeed;
  if (keys.ArrowRight || keys.d) pilot.x += pilotSpeed;
  pilot.x = Math.max(0, Math.min(canvas.width - pilot.w, pilot.x));

  if (timestamp - lastSpawn > 520) {
    spawnMeteor();
    lastSpawn = timestamp;
  }

  for (const meteor of meteors) meteor.y += meteor.speed;
  countSuccessfulDodges();

  for (const meteor of meteors) {
    if (hit(pilot, meteor)) {
      running = false;
      statusEl.textContent = 'Bonked! Try again.';
      draw();
      return;
    }
  }

  draw();
  requestAnimationFrame(step);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const pulse = Math.sin(frame * 0.12) * 18;
  ctx.fillStyle = '#030006';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = `rgba(120, 0, 24, ${0.18 + Math.abs(Math.sin(frame * 0.08)) * 0.14})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(157, 255, 110, .5)';
  for (let i = 0; i < 70; i++) {
    const x = (i * 97 + frame * 1.9) % canvas.width;
    const y = (i * 53 + frame * 3.2) % canvas.height;
    ctx.fillRect(x, y, 3, 10);
  }

  ctx.fillStyle = `rgba(176, 0, 42, ${0.18 + Math.abs(Math.sin(frame * 0.05)) * 0.12})`;
  for (let i = 0; i < 10; i++) {
    const x = (i * 79 + frame * 0.7) % canvas.width;
    const y = (i * 43 + frame * 1.1) % canvas.height;
    ctx.beginPath();
    ctx.arc(x, y, 10 + (i % 4) * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = `rgba(157, 255, 110, ${0.18 + Math.abs(Math.sin(frame * 0.15)) * 0.18})`;
  ctx.lineWidth = 3;
  ctx.strokeRect(16 + pulse * 0.05, 16 + pulse * 0.05, canvas.width - 32 - pulse * 0.1, canvas.height - 32 - pulse * 0.1);

  ctx.fillStyle = 'rgba(157, 255, 110, .85)';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('THE VOID WATCHES', 24, 62);

  ctx.font = '34px serif';
  ctx.fillText(pilot.emoji, pilot.x, pilot.y + pilot.h);

  ctx.fillStyle = '#eef6ff';
  ctx.font = '14px sans-serif';
  ctx.fillText(pilot.name, pilot.x - 2, pilot.y - 8);

  for (const meteor of meteors) {
    ctx.font = `${meteor.size}px serif`;
    ctx.fillText('🩸', meteor.x, meteor.y + meteor.size);
  }

  if (!running) {
    ctx.fillStyle = 'rgba(255,255,255,.84)';
    ctx.font = '18px sans-serif';
    ctx.fillText('Press Start, then use ←/→ or A/D to dodge.', 24, 36);
    ctx.fillText('Every 13 dodges wakes a faster level.', 24, 88);
  }
}

function controlKey(event) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') return event.key;
  const key = event.key.toLowerCase();
  if (key === 'a' || key === 'd') return key;
  return null;
}

window.addEventListener('keydown', event => {
  const key = controlKey(event);
  if (key) {
    keys[key] = true;
    event.preventDefault();
  }
});

window.addEventListener('keyup', event => {
  const key = controlKey(event);
  if (key) {
    keys[key] = false;
    event.preventDefault();
  }
});

startBtn.addEventListener('click', () => {
  if (running) return;
  running = true;
  statusEl.textContent = 'Dodging!';
  requestAnimationFrame(step);
});
resetBtn.addEventListener('click', reset);
reset();
