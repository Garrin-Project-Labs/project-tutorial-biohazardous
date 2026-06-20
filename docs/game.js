const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const levelEl = document.querySelector('#level');
const statusEl = document.querySelector('#status');
const startBtn = document.querySelector('#start');
const resetBtn = document.querySelector('#reset');

const pilot = { x: 340, y: 360, w: 44, h: 36, emoji: '🚀', name: 'Pilot' };
let meteors = [];
let score = 0;
let level = 1;
let running = false;
let lastSpawn = 0;
let frame = 0;

function reset() {
  pilot.x = canvas.width / 2 - pilot.w / 2;
  meteors = [];
  score = 0;
  level = 1;
  frame = 0;
  running = false;
  statusEl.textContent = 'Unfinished';
  updateHud();
  draw();
}

function updateHud() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
}

function spawnMeteor() {
  const size = 26 + Math.random() * 22;
  meteors.push({ x: Math.random() * (canvas.width - size), y: -size, size, speed: 2.2 + Math.random() });
}

function hit(a, b) {
  return a.x < b.x + b.size && a.x + a.w > b.x && a.y < b.y + b.size && a.y + a.h > b.y;
}

function step(timestamp) {
  if (!running) return;
  frame++;

  // Quest 2 belongs here: add controls so the pilot can move left and right.

  if (timestamp - lastSpawn > 900) {
    spawnMeteor();
    lastSpawn = timestamp;
  }

  for (const meteor of meteors) meteor.y += meteor.speed;
  meteors = meteors.filter(m => m.y < canvas.height + m.size);

  for (const meteor of meteors) {
    if (hit(pilot, meteor)) {
      running = false;
      statusEl.textContent = 'Bonked! Quest 2 will help.';
      draw();
      return;
    }
  }

  draw();
  requestAnimationFrame(step);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#070a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(125, 211, 252, .35)';
  for (let i = 0; i < 48; i++) {
    const x = (i * 97 + frame * 0.15) % canvas.width;
    const y = (i * 53 + frame * 0.35) % canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.font = '34px serif';
  ctx.fillText(pilot.emoji, pilot.x, pilot.y + pilot.h);

  ctx.fillStyle = '#eef6ff';
  ctx.font = '14px sans-serif';
  ctx.fillText(pilot.name, pilot.x - 2, pilot.y - 8);

  for (const meteor of meteors) {
    ctx.font = `${meteor.size}px serif`;
    ctx.fillText('☄️', meteor.x, meteor.y + meteor.size);
  }

  if (!running) {
    ctx.fillStyle = 'rgba(255,255,255,.84)';
    ctx.font = '18px sans-serif';
    ctx.fillText('Starter game: the pilot cannot move yet.', 24, 36);
  }
}

startBtn.addEventListener('click', () => {
  if (running) return;
  running = true;
  statusEl.textContent = 'Dodging... sort of';
  requestAnimationFrame(step);
});
resetBtn.addEventListener('click', reset);
reset();
