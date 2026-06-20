const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const levelEl = document.querySelector('#level');
const statusEl = document.querySelector('#status') || { textContent: '' };
const startBtn = document.querySelector('#start');
const resetBtn = document.querySelector('#reset');

const pilot = { x: 340, y: 360, w: 34, h: 30, emoji: '🚀', name: 'Pilot' };
const keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false };
let meteors = [];
let popups = [];
let relic = null;
let eyePowerup = null;
let pentagramPowerup = null;
let score = 0;
let dodges = 0;
let level = 1;
let speedLevel = 1;
let running = false;
let lastSpawn = 0;
let lastRelicSpawn = 0;
let lastEyeSpawn = 0;
let lastPentagramSpawn = 0;
let fateModeUntil = 0;
let levelSurgeUntil = 0;
let screenRotation = 0;
let frame = 0;
let audioContext = null;
let bassMusic = null;
let nextVoidWhisperAt = 0;

function resetPowerupTimers(timestamp = performance.now()) {
  lastRelicSpawn = timestamp;
  lastEyeSpawn = timestamp;
  lastPentagramSpawn = timestamp;
}
const pilotSpeed = 7;
const dodgesPerLevel = 13;
const speedBoostPerLevel = 1.1;
const relicBonus = 13;
const quietScreams = ['aah.', 'eep.', 'oh no.', 'tiny scream.', '...'];
const voidColors = ['#9dff6e', '#ff1744', '#00f5ff', '#b388ff', '#ffffff', '#ffea00'];

function reset() {
  pilot.x = canvas.width / 2 - pilot.w / 2;
  meteors = [];
  popups = [];
  relic = null;
  eyePowerup = null;
  pentagramPowerup = null;
  score = 0;
  dodges = 0;
  level = 1;
  speedLevel = 1;
  frame = 0;
  running = false;
  resetPowerupTimers();
  fateModeUntil = 0;
  levelSurgeUntil = 0;
  screenRotation = 0;
  nextVoidWhisperAt = 0;
  statusEl.textContent = 'Ready';
  updateHud();
  draw();
}

function summonVoidWhisper() {
  const whisper = document.createElement('div');
  whisper.className = 'void-whisper';
  whisper.textContent = 'The Void Watches';
  whisper.style.left = `${Math.random() * 82 + 6}vw`;
  whisper.style.top = `${Math.random() * 78 + 8}vh`;
  whisper.style.color = voidColors[Math.floor(Math.random() * voidColors.length)];
  whisper.style.transform = `rotate(${Math.random() * 18 - 9}deg)`;
  document.body.appendChild(whisper);
  setTimeout(() => whisper.remove(), 1500);
}

function maybeSummonVoidWhisper(timestamp) {
  if (!running || timestamp < nextVoidWhisperAt) return;

  summonVoidWhisper();
  nextVoidWhisperAt = timestamp + 1800 + Math.random() * 2600;
}

function updateHud() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
}

function spawnMeteor() {
  const size = 26 + Math.random() * 22;
  const baseSpeed = 3.2 + Math.random() * 1.8;
  const levelSpeedBoost = (speedLevel - 1) * speedBoostPerLevel;
  meteors.push({ x: Math.random() * (canvas.width - size), y: -size, size, baseSpeed, speed: baseSpeed + levelSpeedBoost, nearMissed: false });
}

function spawnRelic() {
  const size = 32;
  relic = { x: Math.random() * (canvas.width - size), y: -size, size, speed: 2.8 };
}

function spawnEyePowerup() {
  const size = 34;
  eyePowerup = { x: Math.random() * (canvas.width - size), y: -size, size, speed: 2.4 };
}

function spawnPentagramPowerup() {
  const size = 36;
  pentagramPowerup = { x: Math.random() * (canvas.width - size), y: -size, size, speed: 2.6 };
}

function whisperScream() {
  return quietScreams[Math.floor(Math.random() * quietScreams.length)];
}

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  audioContext ||= new AudioContext();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function playNoiseBurst(duration, gainPeak, filterStart, filterEnd) {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const noise = audio.createBufferSource();
  const noiseGain = audio.createGain();
  const filter = audio.createBiquadFilter();
  const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * duration), audio.sampleRate);
  const samples = buffer.getChannelData(0);

  for (let i = 0; i < samples.length; i++) {
    samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
  }

  noise.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterStart, now);
  filter.frequency.exponentialRampToValueAtTime(filterEnd, now + duration);
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(audio.destination);
  noise.start(now);
  noise.stop(now + duration);
}

function startBassMusic() {
  const audio = getAudioContext();
  if (!audio || bassMusic) return;

  const output = audio.createGain();
  output.gain.value = 0.055;
  output.connect(audio.destination);

  const notes = [41.2, 41.2, 49, 36.7, 55, 49, 41.2, 32.7];
  let stepIndex = 0;

  function playBassStep() {
    if (!bassMusic) return;

    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(notes[stepIndex % notes.length], now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.85, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    osc.start(now);
    osc.stop(now + 0.35);

    stepIndex++;
  }

  bassMusic = { output, interval: setInterval(playBassStep, 420) };
  playBassStep();
}

function stopBassMusic() {
  if (!bassMusic) return;

  clearInterval(bassMusic.interval);
  bassMusic.output.disconnect();
  bassMusic = null;
}

function playQuietScream() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(230, now);
  oscillator.frequency.exponentialRampToValueAtTime(340, now + 0.09);
  oscillator.frequency.exponentialRampToValueAtTime(115, now + 0.42);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);

  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.48);
}

function playRelicPunch() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const thump = audio.createOscillator();
  const gain = audio.createGain();

  thump.type = 'triangle';
  thump.frequency.setValueAtTime(95, now);
  thump.frequency.exponentialRampToValueAtTime(38, now + 0.16);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

  thump.connect(gain);
  gain.connect(audio.destination);
  thump.start(now);
  thump.stop(now + 0.22);
  playNoiseBurst(0.12, 0.09, 520, 90);
}

function playEyeSquish() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const squelch = audio.createOscillator();
  const gain = audio.createGain();

  squelch.type = 'sawtooth';
  squelch.frequency.setValueAtTime(180, now);
  squelch.frequency.exponentialRampToValueAtTime(70, now + 0.18);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

  squelch.connect(gain);
  gain.connect(audio.destination);
  squelch.start(now);
  squelch.stop(now + 0.25);
  playNoiseBurst(0.18, 0.045, 380, 120);
}

function playPentagramPortal() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const portal = audio.createOscillator();
  const shimmer = audio.createOscillator();
  const gain = audio.createGain();

  portal.type = 'sine';
  shimmer.type = 'square';
  portal.frequency.setValueAtTime(90, now);
  portal.frequency.exponentialRampToValueAtTime(560, now + 0.62);
  shimmer.frequency.setValueAtTime(740, now);
  shimmer.frequency.exponentialRampToValueAtTime(185, now + 0.62);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.68);

  portal.connect(gain);
  shimmer.connect(gain);
  gain.connect(audio.destination);
  portal.start(now);
  shimmer.start(now);
  portal.stop(now + 0.7);
  shimmer.stop(now + 0.7);
}

function playBottomExplosion() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const boom = audio.createOscillator();
  const boomGain = audio.createGain();
  const noise = audio.createBufferSource();
  const noiseGain = audio.createGain();
  const filter = audio.createBiquadFilter();
  const buffer = audio.createBuffer(1, audio.sampleRate * 0.18, audio.sampleRate);
  const samples = buffer.getChannelData(0);

  for (let i = 0; i < samples.length; i++) {
    samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
  }

  boom.type = 'triangle';
  boom.frequency.setValueAtTime(130, now);
  boom.frequency.exponentialRampToValueAtTime(42, now + 0.22);
  boomGain.gain.setValueAtTime(0.0001, now);
  boomGain.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
  boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(180, now + 0.18);
  noise.buffer = buffer;
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  boom.connect(boomGain);
  boomGain.connect(audio.destination);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(audio.destination);
  boom.start(now);
  boom.stop(now + 0.3);
  noise.start(now);
  noise.stop(now + 0.18);
}

function addNearMissPopup(timestamp) {
  popups.push({ text: '+1', x: pilot.x + pilot.w / 2, y: pilot.y - 8, born: timestamp });
}

function resetCanvasRotation() {
  screenRotation = 0;
  levelSurgeUntil = 0;
}

function resetMeteorSpeed() {
  speedLevel = 1;

  for (const meteor of meteors) {
    meteor.speed = meteor.baseSpeed || Math.min(meteor.speed, 5.4);
  }
}

function awardNearMisses(timestamp) {
  const pilotCenterX = pilot.x + pilot.w / 2;
  const pilotCenterY = pilot.y + pilot.h / 2;

  for (const meteor of meteors) {
    if (meteor.nearMissed || hit(pilot, meteor)) continue;

    const meteorCenterX = meteor.x + meteor.size / 2;
    const meteorCenterY = meteor.y + meteor.size / 2;
    const closeX = Math.abs(meteorCenterX - pilotCenterX) < meteor.size / 2 + pilot.w / 2 + 22;
    const crossingPlayer = Math.abs(meteorCenterY - pilotCenterY) < meteor.size / 2 + pilot.h / 2 + 10;

    if (closeX && crossingPlayer) {
      meteor.nearMissed = true;
      score++;
      addNearMissPopup(timestamp);
      statusEl.textContent = 'Near miss! +1';
      updateHud();
    }
  }
}

function countSuccessfulDodges(timestamp) {
  const stillFalling = [];

  for (const meteor of meteors) {
    if (meteor.y < canvas.height + meteor.size) {
      stillFalling.push(meteor);
      continue;
    }

    playBottomExplosion();
    score++;
    dodges++;

    if (dodges % dodgesPerLevel === 0) {
      level++;
      speedLevel = level;
      statusEl.textContent = `Level ${level}: the sins move faster.`;

      if ((level - 1) % 3 === 0) {
        levelSurgeUntil = timestamp + 3600;
        screenRotation = (screenRotation + 90) % 360;
        statusEl.textContent = `Level ${level}: fate surge awakened.`;
      }
    }
  }

  meteors = stillFalling;
  updateHud();
}

function hit(a, b) {
  const insetX = a.hitInsetX || 0;
  const insetY = a.hitInsetY || 0;
  return a.x + insetX < b.x + b.size &&
    a.x + a.w - insetX > b.x &&
    a.y + insetY < b.y + b.size &&
    a.y + a.h - insetY > b.y;
}

function glowText(text, x, y, color, blur = 18, outline = 5, outlineColor = '#050006') {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outline;
  ctx.strokeText(text, x, y);
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function glowRect(x, y, w, h, color, blur = 12) {
  ctx.save();
  ctx.fillStyle = '#050006';
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function step(timestamp) {
  if (!running) return;
  frame++;
  maybeSummonVoidWhisper(timestamp);

  if (keys.ArrowLeft || keys.a) pilot.x -= pilotSpeed;
  if (keys.ArrowRight || keys.d) pilot.x += pilotSpeed;
  pilot.x = Math.max(0, Math.min(canvas.width - pilot.w, pilot.x));

  if (timestamp - lastSpawn > 520) {
    spawnMeteor();
    lastSpawn = timestamp;
  }

  if (!relic && timestamp - lastRelicSpawn > 7000) {
    spawnRelic();
    lastRelicSpawn = timestamp;
  }

  if (!eyePowerup && timestamp - lastEyeSpawn > 12000) {
    spawnEyePowerup();
    lastEyeSpawn = timestamp;
  }

  if (screenRotation && !pentagramPowerup && timestamp - lastPentagramSpawn > 9000) {
    spawnPentagramPowerup();
    lastPentagramSpawn = timestamp;
  }

  for (const meteor of meteors) meteor.y += meteor.speed;
  popups = popups.filter(popup => timestamp - popup.born < 900);
  awardNearMisses(timestamp);
  countSuccessfulDodges(timestamp);

  if (relic) {
    relic.y += relic.speed;

    if (hit(pilot, relic)) {
      relic = null;
      playRelicPunch();
      fateModeUntil = timestamp + 4200;
      score += relicBonus;
      statusEl.textContent = 'Relic taken: fate sees you.';
      updateHud();
    } else if (relic.y > canvas.height + relic.size) {
      relic = null;
    }
  }

  if (eyePowerup) {
    eyePowerup.y += eyePowerup.speed;

    if (hit(pilot, eyePowerup)) {
      eyePowerup = null;
      playEyeSquish();
      resetMeteorSpeed();
      popups.push({ text: 'speed reset', x: pilot.x + pilot.w / 2 - 52, y: pilot.y - 12, born: timestamp });
      statusEl.textContent = 'Floating eye collected: game speed reset until the next level.';
    } else if (eyePowerup.y > canvas.height + eyePowerup.size) {
      eyePowerup = null;
    }
  }

  if (pentagramPowerup) {
    pentagramPowerup.y += pentagramPowerup.speed;

    if (hit(pilot, pentagramPowerup)) {
      pentagramPowerup = null;
      playPentagramPortal();
      resetCanvasRotation();
      popups.push({ text: 'unrotated', x: pilot.x + pilot.w / 2 - 44, y: pilot.y - 12, born: timestamp });
      statusEl.textContent = 'Pentagram collected: canvas reset.';
    } else if (pentagramPowerup.y > canvas.height + pentagramPowerup.size) {
      pentagramPowerup = null;
    }
  }

  for (const meteor of meteors) {
    if (hit(pilot, meteor)) {
      running = false;
      stopBassMusic();
      playQuietScream();
      statusEl.textContent = `Bonked! ${whisperScream()} Try again.`;
      draw();
      return;
    }
  }

  draw();
  requestAnimationFrame(step);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  if (screenRotation) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(canvas.height / canvas.width, canvas.height / canvas.width);
    ctx.rotate(screenRotation * Math.PI / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }

  const pulse = Math.sin(frame * 0.12) * 18;
  const fateMode = performance.now() < fateModeUntil;
  const levelSurge = performance.now() < levelSurgeUntil;
  ctx.fillStyle = '#030006';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (fateMode) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.06 + Math.abs(Math.sin(frame * 0.08)) * 0.05})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (levelSurge) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.10 + Math.abs(Math.sin(frame * 0.18)) * 0.08})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = 'rgba(157, 255, 110, .5)';
  for (let i = 0; i < 70; i++) {
    const x = (i * 97 + frame * 1.9) % canvas.width;
    const y = (i * 53 + frame * 3.2) % canvas.height;
    glowRect(x, y, 3, 10, i % 2 ? '#9dff6e' : '#00f5ff', 10);
  }

  if (fateMode) {
    ctx.fillStyle = '#050006';
    ctx.font = 'bold 20px sans-serif';

    for (let y = 34; y < canvas.height; y += 58) {
      const x = ((frame * 5) + y * 3) % (canvas.width + 420) - 420;
      glowText('YOU WILL NOT ESCAPE YOUR FATE', x, y, '#9dff6e', 12, 2);
      glowText('YOU WILL NOT ESCAPE YOUR FATE', x + 420, y, '#9dff6e', 12, 2);
    }
  }

  if (levelSurge) {
    ctx.fillStyle = '#050006';
    ctx.font = 'bold 30px sans-serif';
    glowText('FATE SURGE', 24, canvas.height - 34, '#9dff6e', 10, 2);
  }

  ctx.font = '34px serif';
  ctx.save();
  ctx.translate(pilot.x + pilot.w / 2, pilot.y + pilot.h / 2);
  ctx.rotate(-Math.PI / 4);
  ctx.filter = 'invert(1) hue-rotate(180deg)';
  glowText(pilot.emoji, -pilot.w / 2, pilot.h / 2, '#ff1744', 24, 6, '#ffffff');
  ctx.restore();

  for (const meteor of meteors) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${meteor.size}px serif`;
    glowText('☄', meteor.x, meteor.y + meteor.size, '#050006', 18, 7, '#050006');
  }

  if (relic) {
    ctx.font = `${relic.size}px serif`;
    glowText('🧿', relic.x, relic.y + relic.size, '#9dff6e', 30, 7);
  }

  if (eyePowerup) {
    ctx.font = `${eyePowerup.size}px serif`;
    glowText('👁️', eyePowerup.x, eyePowerup.y + eyePowerup.size, '#b388ff', 30, 7);
  }

  if (pentagramPowerup) {
    ctx.fillStyle = '#050006';
    ctx.font = `bold ${pentagramPowerup.size}px serif`;
    glowText('⛧', pentagramPowerup.x, pentagramPowerup.y + pentagramPowerup.size, '#ff1744', 34, 9, '#ff1744');
  }

  for (const popup of popups) {
    const age = performance.now() - popup.born;
    const rise = age / 14;
    ctx.globalAlpha = Math.max(0, 1 - age / 900);
    ctx.fillStyle = popup.text === '+1' ? '#ff1744' : '#b388ff';
    if (popup.text === 'unrotated') ctx.fillStyle = '#ff1744';
    ctx.font = popup.text === '+1' ? 'bold 24px sans-serif' : 'bold 18px sans-serif';
    glowText(popup.text, popup.x - 12, popup.y - rise, ctx.fillStyle, 18, 6);
    ctx.globalAlpha = 1;
  }


  ctx.restore();
}

function controlKey(event) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') return event.key;
  const key = event.key.toLowerCase();
  if (key === 'a' || key === 'd') return key;
  return null;
}

function startGame() {
  getAudioContext();
  if (running) return;
  resetPowerupTimers();
  running = true;
  startBassMusic();
  statusEl.textContent = 'Dodging!';
  requestAnimationFrame(step);
}

function resetAndStartGame() {
  reset();
  startGame();
}

window.addEventListener('keydown', event => {
  if (event.key.toLowerCase() === 'r') {
    resetAndStartGame();
    event.preventDefault();
    return;
  }

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

startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', () => {
  stopBassMusic();
  reset();
});
reset();
