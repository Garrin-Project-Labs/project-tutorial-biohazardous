const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const levelEl = document.querySelector('#level');
const highScoreEl = document.querySelector('#high-score');
const heroEl = document.querySelector('.hero');
const heroTitleEl = document.querySelector('.hero h1');
const taglineEl = document.querySelector('#tagline');
const titleEchoesEl = document.querySelector('#title-echoes');
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
let highScore = Number(localStorage.getItem('meteorHighScore') || 0);
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
let lastEchoedTitle = heroTitleEl?.textContent || '';

function resetPowerupTimers(timestamp = performance.now()) {
  lastRelicSpawn = timestamp;
  lastEyeSpawn = timestamp;
  lastPentagramSpawn = timestamp;
}
const pilotSpeed = 7;
const dodgesPerLevel = 13;
const speedBoostPerLevel = 1.0;
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
  const isEye = Math.random() < 0.45;

  whisper.className = isEye ? 'void-whisper void-eye' : 'void-whisper';
  whisper.textContent = isEye ? `  .-"""-.
 /  ◉ ◉  \
|    ─    |
 \  ___  /
  \`-...-\`` : 'The Void Watches';
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
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('meteorHighScore', highScore);
  }

  scoreEl.textContent = score;
  levelEl.textContent = level;
  if (highScoreEl) highScoreEl.textContent = highScore;
  updateHeroText();
}

function addTitleEcho(title) {
  if (!titleEchoesEl || title === lastEchoedTitle) return;

  const echo = document.createElement('div');
  echo.className = 'title-echo';
  echo.textContent = title;
  titleEchoesEl.appendChild(echo);
  lastEchoedTitle = title;
}

function updateHeroText() {
  if (!heroEl || !heroTitleEl || !taglineEl) return;

  const fade = Math.max(0, 1 - Math.min(score, 13) / 13);
  const nextTitle = score >= 333
    ? 'Good Job...'
    : score >= 13
      ? "You Can't Run..."
      : 'You can not run from your sins. They watch.';

  heroEl.classList.toggle('doom-message', score >= 13);
  heroTitleEl.textContent = nextTitle;
  addTitleEcho(nextTitle);

  if (score >= 333) {
    heroTitleEl.style.opacity = 1;
    taglineEl.style.opacity = 0;
  } else if (score >= 13) {
    heroTitleEl.style.opacity = 1;
    taglineEl.style.opacity = 0;
  } else {
    heroTitleEl.style.opacity = fade;
    taglineEl.textContent = 'As you walk through the shadow of the valley of death';
    taglineEl.style.opacity = fade;
  }
}

function spawnMeteor() {
  const size = 26 + Math.random() * 22;
  const baseSpeed = 3.0 + Math.random() * 1.6;
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
  const masterFilter = audio.createBiquadFilter();
  const echo = audio.createDelay(0.28);
  const echoGain = audio.createGain();

  output.gain.value = 0.068;
  masterFilter.type = 'lowpass';
  masterFilter.frequency.value = 3600;
  echo.delayTime.value = 0.24;
  echoGain.gain.value = 0.22;
  output.connect(masterFilter);
  masterFilter.connect(audio.destination);
  output.connect(echo);
  echo.connect(echoGain);
  echoGain.connect(masterFilter);

  const bassNotes = [36.7, 36.7, 49, 38.9, 36.7, 55, 41.2, 32.7, 36.7, 49, 58.3, 41.2, 34.6, 36.7, 49, 30.9];
  const chordRoots = [73.4, 82.4, 69.3, 98, 61.7, 73.4, 58.3, 87.3];
  const leadNotes = [293.7, 311.1, 392, 349.2, 277.2, 293.7, 415.3, 369.9, 246.9, 311.1, 466.2, 392, 233.1, 277.2, 349.2, 311.1];
  const droneNotes = [36.7, 55, 34.6, 49];
  const kickPattern = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0];
  const snarePattern = [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1];
  const hatPattern = [1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1];
  let stepIndex = 0;

  function playSynthVoice(frequency, duration, gainPeak, type = 'sawtooth', filterFrequency = 2400, detune = 0) {
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();
    const pan = audio.createStereoPanner ? audio.createStereoPanner() : null;

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    osc.detune.value = detune;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFrequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    if (pan) {
      pan.pan.value = Math.max(-0.7, Math.min(0.7, detune / 18));
      gain.connect(pan);
      pan.connect(output);
    } else {
      gain.connect(output);
    }
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playBassStep() {
    if (!bassMusic) return;

    const now = audio.currentTime;
    const bass = audio.createOscillator();
    const bassGain = audio.createGain();
    const bassFilter = audio.createBiquadFilter();

    bass.type = 'sawtooth';
    bass.frequency.setValueAtTime(bassNotes[stepIndex % bassNotes.length], now);
    bass.detune.value = stepIndex % 2 ? -4 : 4;
    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(980, now);
    bassGain.gain.setValueAtTime(0.0001, now);
    bassGain.gain.exponentialRampToValueAtTime(0.5, now + 0.01);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.23);

    bass.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(output);
    bass.start(now);
    bass.stop(now + 0.25);

    if (stepIndex % 4 === 0) {
      const root = chordRoots[(stepIndex / 4) % chordRoots.length];
      playSynthVoice(root, 0.9, 0.055, 'triangle', 1400, -9);
      playSynthVoice(root * 1.06, 0.9, 0.04, 'sawtooth', 1300, 7);
      playSynthVoice(root * 1.5, 0.85, 0.036, 'triangle', 1800, 12);
      playSynthVoice(root * 2.01, 0.55, 0.02, 'sine', 2600, -14);
    }

    if (stepIndex % 2 === 1) {
      playSynthVoice(leadNotes[stepIndex % leadNotes.length], 0.16, 0.032, 'square', 3600, stepIndex % 4 === 1 ? -7 : 7);
      playSynthVoice(leadNotes[stepIndex % leadNotes.length] * 1.5, 0.12, 0.018, 'triangle', 4200, stepIndex % 4 === 1 ? 9 : -9);
    }

    if (stepIndex % 8 === 0) {
      playSynthVoice(droneNotes[(stepIndex / 8) % droneNotes.length], 1.7, 0.045, 'sawtooth', 900, -3);
      playSynthVoice(droneNotes[(stepIndex / 8) % droneNotes.length] * 1.01, 1.7, 0.032, 'triangle', 850, 3);
    }

    if (stepIndex % 8 === 6) {
      playSynthVoice(leadNotes[(stepIndex + 3) % leadNotes.length] * 2, 0.32, 0.02, 'sawtooth', 3000, 0);
    }

    if (kickPattern[stepIndex % kickPattern.length]) {
      const kick = audio.createOscillator();
      const kickGain = audio.createGain();

      kick.type = 'sine';
      kick.frequency.setValueAtTime(115, now);
      kick.frequency.exponentialRampToValueAtTime(32, now + 0.14);
      kickGain.gain.setValueAtTime(0.0001, now);
      kickGain.gain.exponentialRampToValueAtTime(1.15, now + 0.006);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      kick.connect(kickGain);
      kickGain.connect(output);
      kick.start(now);
      kick.stop(now + 0.2);
    }

    if (snarePattern[stepIndex % snarePattern.length]) {
      playNoiseBurst(0.1, 0.09, 2600, 460);
    }

    if (hatPattern[stepIndex % hatPattern.length]) {
      playNoiseBurst(0.032, 0.022, 6800, 3200);
    }

    stepIndex++;
  }

  bassMusic = { output: masterFilter, interval: setInterval(playBassStep, 165) };
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
  playNoiseBurst(0.14, 0.12, 620, 80);
  const crack = audio.createOscillator();
  const crackGain = audio.createGain();
  crack.type = 'square';
  crack.frequency.setValueAtTime(55, now + 0.04);
  crackGain.gain.setValueAtTime(0.0001, now + 0.04);
  crackGain.gain.exponentialRampToValueAtTime(0.12, now + 0.055);
  crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  crack.connect(crackGain);
  crackGain.connect(audio.destination);
  crack.start(now + 0.04);
  crack.stop(now + 0.2);
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
  playNoiseBurst(0.2, 0.065, 420, 95);
  const bubble = audio.createOscillator();
  const bubbleGain = audio.createGain();
  bubble.type = 'triangle';
  bubble.frequency.setValueAtTime(105, now + 0.08);
  bubble.frequency.exponentialRampToValueAtTime(48, now + 0.26);
  bubbleGain.gain.setValueAtTime(0.0001, now + 0.08);
  bubbleGain.gain.exponentialRampToValueAtTime(0.06, now + 0.11);
  bubbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  bubble.connect(bubbleGain);
  bubbleGain.connect(audio.destination);
  bubble.start(now + 0.08);
  bubble.stop(now + 0.3);
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
  playNoiseBurst(0.42, 0.04, 3200, 360);
}

function playBottomExplosion() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const wind = audio.createBufferSource();
  const windGain = audio.createGain();
  const filter = audio.createBiquadFilter();
  const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.34), audio.sampleRate);
  const samples = buffer.getChannelData(0);

  for (let i = 0; i < samples.length; i++) {
    const fadeIn = Math.min(1, i / (samples.length * 0.18));
    const fadeOut = 1 - i / samples.length;
    samples[i] = (Math.random() * 2 - 1) * fadeIn * fadeOut;
  }

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1250, now);
  filter.frequency.exponentialRampToValueAtTime(360, now + 0.32);
  filter.Q.value = 0.7;
  wind.buffer = buffer;
  windGain.gain.setValueAtTime(0.0001, now);
  windGain.gain.exponentialRampToValueAtTime(0.035, now + 0.04);
  windGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

  wind.connect(filter);
  filter.connect(windGain);
  windGain.connect(audio.destination);
  wind.start(now);
  wind.stop(now + 0.35);
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
    score += level;
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
      fateModeUntil = timestamp + 2200;
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
