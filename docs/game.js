const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const levelEl = document.querySelector('#level');
const highScoreEl = document.querySelector('#high-score');
const scoreBoxEl = scoreEl?.closest('.hud-score');
const heroEl = document.querySelector('.hero');
const heroTitleEl = document.querySelector('.hero h1');
const taglineEl = document.querySelector('#tagline');
const titleEchoesEl = document.querySelector('#title-echoes');
const gameCardEl = document.querySelector('.game-card');
const runeBorderSymbols = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛉ', 'ᛟ', '✦', '☽'];
const runeBorderEl = document.createElement('div');
runeBorderEl.className = 'rune-border';
['top', 'right', 'bottom', 'left'].forEach(side => {
  const strip = document.createElement('div');
  strip.className = `rune-border-side rune-border-${side}`;
  for (let i = 0; i < (side === 'top' || side === 'bottom' ? 72 : 48); i++) {
    const rune = document.createElement('span');
    rune.textContent = runeBorderSymbols[i % runeBorderSymbols.length];
    strip.append(rune);
  }
  runeBorderEl.append(strip);
});
gameCardEl?.append(runeBorderEl);
const hitSlimeEl = document.createElement('div');
hitSlimeEl.className = 'hit-slime';
for (let i = 0; i < 18; i++) {
  const drip = document.createElement('i');
  drip.style.left = `${2 + i * 5.7 + Math.random() * 1.8}%`;
  drip.style.setProperty('--drip-length', `${54 + Math.random() * 132}px`);
  drip.style.setProperty('--drip-delay', `${Math.random() * -2.4}s`);
  drip.style.setProperty('--drip-duration', `${2.4 + Math.random() * 1.8}s`);
  hitSlimeEl.append(drip);
}
document.body.append(hitSlimeEl);
const statusEl = document.querySelector('#status') || { textContent: '' };
const startBtn = document.querySelector('#start');
const resetBtn = document.querySelector('#reset');
let welcomeHomeInterval = null;
let deathEyeInterval = null;
let welcomeHomeSpawnCount = 0;
let sadViolinPlayed = false;
const welcomeHomeEls = [];
const deathEyeEls = [];
const maxDeathMessages = 13;
const tentacleBorderSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
tentacleBorderSvg.classList.add('tentacle-border');
tentacleBorderSvg.setAttribute('viewBox', '0 0 100 100');
tentacleBorderSvg.setAttribute('preserveAspectRatio', 'none');
const tentaclePaths = Array.from({ length: 4 }, () => {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'none');
  tentacleBorderSvg.append(path);
  return path;
});
gameCardEl?.append(tentacleBorderSvg);
const spaceStars = Array.from({ length: 58 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  z: 0.2 + Math.random() * 1.8,
  hue: Math.random() < 0.72 ? 210 : (Math.random() < 0.5 ? 115 : 285),
  drift: Math.random() * Math.PI * 2
}));

const pilot = { x: 340, y: 360, w: 34, h: 30, hitInsetX: 7, hitInsetY: 6, emoji: '🚀', name: 'Pilot' };
const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, a: false, d: false, w: false, s: false };
let meteors = [];
let popups = [];
let levelLaserShots = [];
let eyeBossShots = [];
const transcendWord = 'TRANSCEND';
let transcendLetters = [];
let transcendSpitLetters = [];
let transcendCollectedLetters = [];
let transcendSpitQueue = [];
let nextTranscendSpitAt = 0;
let transcendLetterSpeedBoost = 0;
let transcendShakeUntil = 0;
let transcendFilled = Array(transcendWord.length).fill(false);
let transcendRuneSlots = [];
let transcendenceCount = 0;
let transcendX = 210;
let transcendVx = 0.62;
let nextTranscendLetterAt = 0;
let transcendAnimation = null;
const branchThresholds = { gameLies: 3, eyeBoss: 5, whiteVoid: 7 };
let activeBranches = { gameLies: false, eyeBoss: false, whiteVoid: false };
let gameLiesUntil = 0;
let nextEyeBossShotAt = 0;
let whiteVoidStartedAt = 0;
let eyeBossDefeated = false;
let relic = null;
let eyePowerup = null;
let pentagramPowerup = null;
let blackHolePowerup = null;
let score = 0;
let combo = 0;
const highScoreStorageKey = 'meteorHighScore.v2';
let highScore = Number(localStorage.getItem(highScoreStorageKey) || 0);
let dodges = 0;
let level = 1;
let speedLevel = 1;
let running = false;
let paused = false;
let animationFrameId = null;
let runToken = 0;
let lastSpawn = 0;
let lastRelicSpawn = 0;
let lastEyeSpawn = 0;
let lastPentagramSpawn = 0;
let lastBlackHoleSpawn = 0;
let lastMoveSoundAt = 0;
let fateModeUntil = 0;
let levelSurgeUntil = 0;
let bePreparedUntil = 0;
let spawnPauseUntil = 0;
let rotationSlowUntil = 0;
let rotationCount = 0;
let pilotSpinUntil = 0;
let blackHoleUntil = 0;
let blackHoleCooldownUntil = 0;
let hitExplosion = null;
let pilotVisible = true;
let screenRotation = 0;
let backgroundTheme = 0;
let nextEyeBlinkAt = 0;
let eyeBlinkUntil = 0;
let frame = 0;
let lastFrameTimestamp = 0;
let audioContext = null;
let bassMusic = null;
let nextVoidWhisperAt = 0;
let nextComboBellAt = 5;
let lastEchoedTitle = heroTitleEl?.textContent || '';
let titleEchoWrapQueued = false;
let titleEchoClearedForTitle = '';
let deadEchoInterval = null;
let random777Title = '';

function randomTranscendRuneSlots() {
  return Array.from({ length: transcendWord.length }, () => meteorSymbols[Math.floor(Math.random() * meteorSymbols.length)]);
}

function resetPowerupTimers(timestamp = performance.now()) {
  lastRelicSpawn = timestamp;
  lastEyeSpawn = timestamp;
  lastPentagramSpawn = timestamp;
  lastBlackHoleSpawn = timestamp;
}
const pilotSpeed = 7;
const dodgesPerLevel = 13;
const speedBoostPerLevel = 0.52;
const normalMeteorSpawnDelay = 560;
const relicBonus = 13;
const quietScreams = ['aah.', 'eep.', 'oh no.', 'tiny scream.', '...'];
const voidColors = ['#9dff6e', '#ff1744', '#00f5ff', '#b388ff', '#ffffff', '#ffea00'];
const meteorImpactColors = ['#ff1744', '#ffea00', '#9dff6e', '#00f5ff', '#b388ff', '#ffffff', '#ff6a00'];
const meteorSymbols = ['☄', 'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛋ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ', 'ᛝ', '✦', '✧', '✶', '✹', '✷', '☽', '☾', '✺'];
const titleSymbols = ['☄', 'ᚱ', 'ᛉ', 'ᛟ', 'ᚦ', '✦', '✧', '✶', '✹', '✷', '☽', '☾', '✺', '⛧', '🜏', '☠'];
const deathSymbols = ['⛧', '🜏', '☠', 'ᛉ', 'ᛟ', 'ᚦ', 'ᚱ', '☽', '☾', '✹', '✺', '✶', '✷'];
const asciiEyeArts = [
  `  .-"""-.
 /  ◉ ◉  \
|    ─    |
 \  ___  /
  \`-...-\``,
  `  /\_/\
 (  o o  )
  >  ^  <`,
  ` .-------.
|  O   O  |
|    ∩    |
 '-------'`,
  `   .---.
  / ◐ ◑ \
 |   ▽   |
  \_._./`,
  `  <\   />
   (• •)
  /  V  \
  \_____/`,
  `  .-^-.
 / 0 0 \
|   -   |
 \_===_/`,
  `  .oOOo.
 (  @ @  )
  \  =  /
   '---'`,
  `  /-----\
 |  -   -  |
 |    o    |
  \_____/`,
  `   _   _
  (\_/ )
  (◌ ◌ )
   \_=/`,
  `  .-...-.
 /  < >  \
|    ^    |
 \  ---  /`,
  `  .:::::.
 (::o o::)
  :: v ::
   ':::'`,
  `  /\___/\
 |  ◍ ◍  |
 |   W   |
  \_____/`,
  `  ._____.
 /  ◒ ◓  \
|    ~    |
 \__-__/`
];
const backgroundThemes = [
  { base: '#030006', mist: 'rgba(157, 255, 110, .42)', alt: '#00f5ff', nebula: '#2b0038' },
  { base: '#030014', mist: 'rgba(179, 136, 255, .46)', alt: '#ff1744', nebula: '#40008a' },
  { base: '#160000', mist: 'rgba(255, 23, 68, .42)', alt: '#ffea00', nebula: '#5a0000' },
  { base: '#001114', mist: 'rgba(0, 245, 255, .44)', alt: '#9dff6e', nebula: '#003b47' },
  { base: '#101000', mist: 'rgba(255, 234, 0, .36)', alt: '#b388ff', nebula: '#4a3900' }
];

function reset() {
  running = false;
  paused = false;
  runToken++;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  hideWelcomeHome();
  hideSlimeDrips();
  stopDeadEchoRewrite();
  hitExplosion = null;
  pilotVisible = true;
  pilot.x = canvas.width / 2 - pilot.w / 2;
  meteors = [];
  popups = [];
  levelLaserShots = [];
  eyeBossShots = [];
  transcendLetters = [];
  transcendSpitLetters = [];
  transcendCollectedLetters = [];
  transcendSpitQueue = [];
  nextTranscendSpitAt = 0;
  transcendLetterSpeedBoost = 0;
  transcendShakeUntil = 0;
  transcendFilled = Array(transcendWord.length).fill(false);
  transcendRuneSlots = randomTranscendRuneSlots();
  transcendenceCount = 0;
  transcendX = canvas.width / 2 - 150;
  transcendVx = 0.62;
  nextTranscendLetterAt = performance.now() + 1800;
  transcendAnimation = null;
  activeBranches = { gameLies: false, eyeBoss: false, whiteVoid: false };
  gameLiesUntil = 0;
  nextEyeBossShotAt = 0;
  whiteVoidStartedAt = 0;
  eyeBossDefeated = false;
  relic = null;
  eyePowerup = null;
  pentagramPowerup = null;
  blackHolePowerup = null;
  score = 0;
  combo = 0;
  dodges = 0;
  level = 1;
  speedLevel = 1;
  frame = 0;
  lastFrameTimestamp = 0;
  resetPowerupTimers();
  lastMoveSoundAt = 0;
  fateModeUntil = 0;
  gameLiesUntil = 0;
  levelSurgeUntil = 0;
  bePreparedUntil = 0;
  spawnPauseUntil = 0;
  rotationSlowUntil = 0;
  rotationCount = 0;
  pilotSpinUntil = 0;
  blackHoleUntil = 0;
  blackHoleCooldownUntil = 0;
  hitExplosion = null;
  pilotVisible = true;
  screenRotation = 0;
  backgroundTheme = 0;
  nextEyeBlinkAt = performance.now() + 2500 + Math.random() * 4500;
  eyeBlinkUntil = 0;
  nextVoidWhisperAt = 0;
  nextComboBellAt = 5;
  random777Title = '';
  statusEl.textContent = 'Ready';
  updateHud();
  draw();
}

function summonVoidWhisper() {
  const whisper = document.createElement('div');
  const showVoidText = Math.random() < 0.15;

  whisper.className = showVoidText ? 'void-whisper' : 'void-whisper void-eye';
  whisper.textContent = showVoidText ? 'The Void Watches' : asciiEyeArts[Math.floor(Math.random() * asciiEyeArts.length)];
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
  nextVoidWhisperAt = timestamp + 4200 + Math.random() * 6200;
}



function resetEyeBossPhase() {
  activeBranches.eyeBoss = false;
  activeBranches.whiteVoid = false;
  eyeBossDefeated = false;
  eyeBossShots = [];
  nextEyeBossShotAt = 0;
  whiteVoidStartedAt = 0;
  nextEyeBlinkAt = performance.now() + 2500 + Math.random() * 4500;
  eyeBlinkUntil = 0;
}

function isEyeClosed(timestamp = performance.now()) {
  if (timestamp >= eyeBlinkUntil) return false;

  const blinkProgress = 1 - (eyeBlinkUntil - timestamp) / 2200;
  const closeAmount = Math.sin(Math.max(0, Math.min(1, blinkProgress)) * Math.PI);
  return closeAmount > 0.58;
}

function isEyeBossVisible() {
  return activeBranches.eyeBoss && !activeBranches.whiteVoid;
}

function maybeUnlockTranscendBranches(timestamp) {
  if (!activeBranches.gameLies && transcendenceCount >= branchThresholds.gameLies) {
    activeBranches.gameLies = true;
    gameLiesUntil = timestamp + 9000;
    shakePageText();
    playRecordScratch();
    popups.push({ text: 'THE GAME LIES', x: canvas.width / 2 - 76, y: 110, born: timestamp });
    statusEl.textContent = 'TRANSCENDENCE 3: the game starts lying.';
  }

  if (!eyeBossDefeated && !activeBranches.eyeBoss && transcendenceCount >= branchThresholds.eyeBoss && transcendenceCount < branchThresholds.whiteVoid) {
    activeBranches.eyeBoss = true;
    nextEyeBossShotAt = timestamp + 1500;
    eyeBlinkUntil = 0;
    nextEyeBlinkAt = timestamp + 1200;
    popups.push({ text: 'THE EYE WATCHES', x: canvas.width / 2 - 82, y: 150, born: timestamp });
    statusEl.textContent = 'TRANSCENDENCE 5: boss phase — the eye watches.';
  }

  if (!activeBranches.whiteVoid && transcendenceCount >= branchThresholds.whiteVoid) {
    const defeatedEye = activeBranches.eyeBoss && !eyeBossDefeated;
    activeBranches.eyeBoss = false;
    activeBranches.whiteVoid = true;
    eyeBossDefeated = true;
    eyeBossShots = [];
    whiteVoidStartedAt = timestamp;
    spawnPauseUntil = Math.max(spawnPauseUntil, timestamp + 900);
    meteors = [];
    popups.push({ text: defeatedEye ? 'THE EYE DIES' : 'WHITE VOID MODE', x: canvas.width / 2 - 78, y: 190, born: timestamp });
    statusEl.textContent = defeatedEye ? 'TRANSCENDENCE 7: the eye dies. White Void mode begins.' : 'TRANSCENDENCE 7: White Void mode. Survive the black meteors.';
    if (defeatedEye) playMonsterDeathSound();
    playTranscendJackpot();
  }
}

function branchStatusText() {
  if (activeBranches.whiteVoid) return 'WHITE VOID';
  if (activeBranches.eyeBoss) return 'EYE BOSS';
  if (activeBranches.gameLies) return 'THE GAME LIES';
  return null;
}

function scheduleEyeBossShot(timestamp) {
  if (!isEyeBossVisible() || isTranscendAnimating(timestamp) || timestamp < nextEyeBossShotAt || isEyeClosed(timestamp)) return;

  const eyeX = canvas.width / 2;
  const eyeY = canvas.height / 2;
  const targetX = pilot.x + pilot.w / 2;
  const targetY = pilot.y + pilot.h / 2;
  const angle = Math.atan2(targetY - eyeY, targetX - eyeX);
  const length = canvas.width * 0.82;
  const warningMs = activeBranches.whiteVoid ? 520 : 680;
  eyeBossShots.push({
    x1: eyeX,
    y1: eyeY,
    x2: eyeX + Math.cos(angle) * length,
    y2: eyeY + Math.sin(angle) * length,
    born: timestamp,
    warningMs,
    width: 14,
    fired: false
  });
  playEyeChargeSound(warningMs);
  nextEyeBossShotAt = timestamp + 1900;
}

function distancePointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (!dx && !dy) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}

function eyeBossLaserHitsPilot(shot, timestamp) {
  const age = timestamp - shot.born;
  if (age < shot.warningMs || age > shot.warningMs + 260) return false;

  const cx = pilot.x + pilot.w / 2;
  const cy = pilot.y + pilot.h / 2;
  return distancePointToSegment(cx, cy, shot.x1, shot.y1, shot.x2, shot.y2) < shot.width / 2 + 9;
}

function updateHud() {
  const previousHighScore = highScore;
  const hasPreviousHighScore = previousHighScore > 0;
  const highScoreProgress = hasPreviousHighScore ? Math.max(0, Math.min(1, score / previousHighScore)) : 0;
  const isNewHighScore = hasPreviousHighScore && score > previousHighScore;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem(highScoreStorageKey, highScore);
  }

  const gameLiesActive = activeBranches.gameLies && performance.now() < gameLiesUntil;
  scoreEl.textContent = gameLiesActive ? '???' : Math.floor(score);
  levelEl.textContent = gameLiesActive ? 'RUN' : level;
  if (highScoreEl) highScoreEl.textContent = Math.floor(highScore);
  if (scoreBoxEl) {
    const goldR = Math.round(12 + 178 * highScoreProgress);
    const goldG = Math.round(24 + 123 * highScoreProgress);
    const borderR = Math.round(157 + 98 * highScoreProgress);
    const borderG = Math.round(255 - 40 * highScoreProgress);
    const borderB = Math.round(110 - 90 * highScoreProgress);
    const glowAlpha = 0.08 + 0.34 * highScoreProgress;
    const glowSize = 12 + 18 * highScoreProgress;
    scoreBoxEl.style.setProperty('--score-gold-r', goldR);
    scoreBoxEl.style.setProperty('--score-gold-g', goldG);
    scoreBoxEl.style.setProperty('--score-border-r', borderR);
    scoreBoxEl.style.setProperty('--score-border-g', borderG);
    scoreBoxEl.style.setProperty('--score-border-b', borderB);
    scoreBoxEl.style.setProperty('--score-glow-alpha', glowAlpha.toFixed(3));
    scoreBoxEl.style.setProperty('--score-glow-size', `${glowSize.toFixed(1)}px`);
    scoreBoxEl.classList.toggle('score-new-record', isNewHighScore);
  }
  updateTentacleClass();
  updateHeroText();
}

function addTitleEcho(title) {
  if (!titleEchoesEl || title === lastEchoedTitle) return;

  const echo = document.createElement('div');
  echo.className = 'title-echo';
  for (const char of title) {
    const letter = document.createElement('span');
    letter.className = 'title-letter';
    letter.textContent = char === ' ' ? '\u00a0' : char;
    echo.appendChild(letter);
  }
  titleEchoesEl.appendChild(echo);
  lastEchoedTitle = title;
  titleEchoClearedForTitle = '';
  scheduleTitleEchoWrap();
}

function scheduleTitleEchoWrap() {
  if (titleEchoWrapQueued || !titleEchoesEl) return;

  titleEchoWrapQueued = true;
  requestAnimationFrame(updateTitleEchoWrap);
}

function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function updateTitleEchoWrap() {
  titleEchoWrapQueued = false;
  if (!titleEchoesEl || !canvas || !titleEchoesEl.children.length) return;

  for (const echo of titleEchoesEl.querySelectorAll('.title-echo')) {
    echo.style.position = '';
    echo.style.left = '';
    echo.style.top = '';
  }

  const echoRect = titleEchoesEl.getBoundingClientRect();
  const gameRect = canvas.getBoundingClientRect();
  const bottomAlignedHeight = Math.max(120, gameRect.bottom - echoRect.top);
  const columnWidth = Math.max(142, Math.min(220, window.innerWidth * 0.14));
  const columnGap = 12;
  titleEchoesEl.style.maxHeight = `${bottomAlignedHeight}px`;

  requestAnimationFrame(() => {
    const leftRect = titleEchoesEl.getBoundingClientRect();
    const entries = [...titleEchoesEl.querySelectorAll('.title-echo')].map(echo => ({ echo, rect: echo.getBoundingClientRect() }));

    for (const { echo, rect } of entries) {
      const columnIndex = Math.max(0, Math.round((rect.left - leftRect.left) / (columnWidth + columnGap)));
      if (columnIndex >= 3) {
        echo.style.position = 'fixed';
        echo.style.left = `${gameRect.right + 18 + (columnIndex - 3) * (columnWidth + columnGap)}px`;
        echo.style.top = `${rect.top}px`;
      }
    }

    for (const letter of titleEchoesEl.querySelectorAll('.title-letter')) {
      const letterRect = letter.getBoundingClientRect();
      letter.classList.toggle('title-letter-clear', rectsOverlap(letterRect, gameRect));
    }

    const updatedRect = titleEchoesEl.getBoundingClientRect();
    const anyEchoPastEdge = [...titleEchoesEl.querySelectorAll('.title-echo')].some(echo => echo.getBoundingClientRect().right >= window.innerWidth - 2);
    if (updatedRect.right >= window.innerWidth - 2 || anyEchoPastEdge) {
      titleEchoesEl.textContent = '';
      titleEchoClearedForTitle = lastEchoedTitle;
    }
  });
}

function stopDeadEchoRewrite() {
  if (deadEchoInterval) {
    clearInterval(deadEchoInterval);
    deadEchoInterval = null;
  }
}

function rewriteOneEchoToDead() {
  if (!titleEchoesEl) return;

  const nextEcho = [...titleEchoesEl.querySelectorAll('.title-echo:not(.dead-echo)')][0];
  if (!nextEcho) {
    stopDeadEchoRewrite();
    return;
  }

  nextEcho.classList.add('dead-echo');
  nextEcho.textContent = '';
  for (const char of 'Stay Dead...') {
    const letter = document.createElement('span');
    letter.className = 'title-letter';
    letter.textContent = char === ' ' ? '\u00a0' : char;
    nextEcho.appendChild(letter);
  }
  scheduleTitleEchoWrap();
}

function startDeadEchoRewrite() {
  stopDeadEchoRewrite();
  rewriteOneEchoToDead();
  deadEchoInterval = setInterval(rewriteOneEchoToDead, 650);
}

function randomTitleSymbols() {
  return Array.from({ length: 13 }, () => titleSymbols[Math.floor(Math.random() * titleSymbols.length)]).join(' ');
}

function randomDeathSymbols() {
  return Array.from({ length: 13 }, () => deathSymbols[Math.floor(Math.random() * deathSymbols.length)]).join(' ');
}

function updateTentacleClass() {
  // Tentacles were replaced by the rune border.
}

function shakePageText() {
  document.body.classList.remove('text-shake');
  void document.body.offsetWidth;
  document.body.classList.add('text-shake');
  setTimeout(() => document.body.classList.remove('text-shake'), 110);
}

function spawnWelcomeHome() {
  const message = document.createElement('div');
  message.className = 'welcome-home active';
  message.textContent = randomDeathSymbols();
  document.body.append(message);
  welcomeHomeEls.push(message);
  welcomeHomeSpawnCount++;
  if (welcomeHomeSpawnCount >= 1 && !sadViolinPlayed) {
    sadViolinPlayed = true;
    playSadViolinSong();
  }

  while (welcomeHomeEls.length > maxDeathMessages) {
    welcomeHomeEls.shift().remove();
  }
}

function spawnDeathEye() {
  const eye = document.createElement('div');
  eye.className = 'death-eye active';
  eye.textContent = asciiEyeArts[Math.floor(Math.random() * asciiEyeArts.length)];
  eye.style.left = `${Math.random() * 92}vw`;
  eye.style.top = `${Math.random() * 88}vh`;
  eye.style.setProperty('--eye-tilt', `${Math.random() * 60 - 30}deg`);
  document.body.append(eye);
  deathEyeEls.push(eye);

  while (deathEyeEls.length > maxDeathMessages) {
    deathEyeEls.shift().remove();
  }
}

function showWelcomeHome() {
  hideWelcomeHome();
  welcomeHomeSpawnCount = 0;
  sadViolinPlayed = false;
  spawnWelcomeHome();
  spawnDeathEye();
  welcomeHomeInterval = setInterval(spawnWelcomeHome, 1000);
  deathEyeInterval = setInterval(spawnDeathEye, 500);
}

function hideWelcomeHome() {
  if (welcomeHomeInterval) {
    clearInterval(welcomeHomeInterval);
    welcomeHomeInterval = null;
  }
  if (deathEyeInterval) {
    clearInterval(deathEyeInterval);
    deathEyeInterval = null;
  }

  while (welcomeHomeEls.length) {
    welcomeHomeEls.pop().remove();
  }
  while (deathEyeEls.length) {
    deathEyeEls.pop().remove();
  }
}

function showSlimeDrips() {
  hitSlimeEl.classList.add('active');
}

function hideSlimeDrips() {
  hitSlimeEl.classList.remove('active');
}

function updateHeroText() {
  if (!heroEl || !heroTitleEl || !taglineEl) return;

  if (score >= 777 && !random777Title) random777Title = randomTitleSymbols();

  const fade = Math.max(0, 1 - Math.min(score, 13) / 13);
  const branchText = branchStatusText();
  const nextTitle = branchText
    ? branchText
    : score >= 4313
    ? 'We Will Observe...'
    : score >= 2313
      ? "It's Ok To Give In..."
      : score >= 1313
        ? 'Once they slept...'
        : score >= 999
          ? 'NINE NETHERES NEVER NEAR...'
          : score >= 888
            ? '13 13 13 13 13 13 13 13 13 13 13 13 13...'
            : score >= 777
              ? random777Title
              : score >= 666
                ? 'Demonic...'
                : combo >= 69
                  ? 'x69. Nice...'
                  : score >= 333
                    ? 'Good Job...'
                    : score >= 131
                      ? 'Just Breathe...'
                      : score >= 13
                        ? "You Can't Run..."
                        : 'You can not run from your sins. They watch.';

  heroEl.classList.toggle('doom-message', (score >= 13 && score < 999) || score >= 1313);
  heroEl.classList.toggle('rainbow-message', score >= 999 && score < 1313);
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

function comboColor() {
  const heat = Math.min(combo / 69, 1);
  const cool = Math.round(255 * (1 - heat));
  return combo >= 69 ? '#ff6a00' : `rgb(255, ${cool}, ${cool})`;
}

function playComboBell(milestone) {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const bell = audio.createOscillator();
  const chime = audio.createOscillator();
  const gain = audio.createGain();
  const frequency = Math.max(55, 280 - milestone * 3.2);

  bell.type = 'sine';
  chime.type = 'triangle';
  bell.frequency.setValueAtTime(frequency, now);
  chime.frequency.setValueAtTime(frequency * 1.5, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

  bell.connect(gain);
  chime.connect(gain);
  gain.connect(audio.destination);
  bell.start(now);
  chime.start(now);
  bell.stop(now + 0.95);
  chime.stop(now + 0.75);
}

function addCombo(amount) {
  const previousCombo = combo;
  combo = Math.min(69, combo + amount);

  while (nextComboBellAt <= combo && nextComboBellAt > previousCombo) {
    playComboBell(nextComboBellAt);
    nextComboBellAt += 5;
  }
}

function awardPoints(basePoints) {
  addCombo(0.25);
  score += Math.max(1, Math.round(basePoints * (1 + combo)));
}

function spawnMeteor() {
  const whiteVoid = activeBranches.whiteVoid;
  const size = Math.max(pilot.w, pilot.h) + Math.random() * (whiteVoid ? 32 : 24);
  const baseSpeed = (whiteVoid ? 3.0 : 2.1) + Math.random() * (whiteVoid ? 1.35 : 0.95);
  const effectiveSpeedLevel = performance.now() < rotationSlowUntil ? Math.max(1, speedLevel - 2) : speedLevel;
  const levelSpeedBoost = (effectiveSpeedLevel - 1) * speedBoostPerLevel;
  meteors.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    size,
    hitPad: -8,
    baseSpeed,
    speed: baseSpeed + levelSpeedBoost,
    vx: (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.45),
    nearMissed: false,
    spin: Math.random() * Math.PI * 2,
    spinSpeed: (Math.random() < 0.5 ? -1 : 1) * (0.018 + Math.random() * 0.017),
    flashOffset: Math.random() * Math.PI * 2,
    symbol: whiteVoid ? ['●', '◆', '✦', '☄'][Math.floor(Math.random() * 4)] : meteorSymbols[Math.floor(Math.random() * meteorSymbols.length)],
    color: whiteVoid ? '#050006' : '#ffffff',
    mouthTouched: false
  });
}

function spawnRelic() {
  const size = 32;
  relic = { x: Math.random() * (canvas.width - size), y: -size, size, hitPad: 8, speed: 2.8, spin: 0, spinSpeed: 0, flashOffset: Math.random() * Math.PI * 2 };
}

function spawnEyePowerup() {
  const size = 34;
  eyePowerup = { x: Math.random() * (canvas.width - size), y: -size, size, hitPad: 8, speed: 2.4, spin: 0, spinSpeed: 0, flashOffset: Math.random() * Math.PI * 2 };
}

function spawnPentagramPowerup() {
  const size = 36;
  pentagramPowerup = { x: Math.random() * (canvas.width - size), y: -size, size, hitPad: 8, speed: 1.6, spin: 0, spinSpeed: 0, flashOffset: Math.random() * Math.PI * 2 };
}

function spawnBlackHolePowerup() {
  const size = 38;
  blackHolePowerup = { x: Math.random() * (canvas.width - size), y: -size, size, hitPad: 8, speed: 2.05, spin: 0, spinSpeed: 0.035, flashOffset: Math.random() * Math.PI * 2 };
  playBlackHoleSpawnSound();
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
  const deathGain = audio.createGain();
  const growl = audio.createOscillator();
  const sub = audio.createOscillator();
  const scrape = audio.createOscillator();

  deathGain.gain.setValueAtTime(0.0001, now);
  deathGain.gain.exponentialRampToValueAtTime(0.22, now + 0.04);
  deathGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

  growl.type = 'sawtooth';
  growl.frequency.setValueAtTime(72, now);
  growl.frequency.exponentialRampToValueAtTime(28, now + 0.82);

  sub.type = 'triangle';
  sub.frequency.setValueAtTime(38, now);
  sub.frequency.exponentialRampToValueAtTime(18, now + 0.9);

  scrape.type = 'square';
  scrape.frequency.setValueAtTime(115, now + 0.08);
  scrape.frequency.exponentialRampToValueAtTime(46, now + 0.65);

  growl.connect(deathGain);
  sub.connect(deathGain);
  scrape.connect(deathGain);
  deathGain.connect(audio.destination);
  growl.start(now);
  sub.start(now);
  scrape.start(now + 0.08);
  growl.stop(now + 1.0);
  sub.stop(now + 1.0);
  scrape.stop(now + 0.75);
  playNoiseBurst(0.55, 0.07, 520, 70);
}

function playSadGameOverJingle() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const output = audio.createGain();
  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.16, now + 0.03);
  output.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
  output.connect(audio.destination);

  const notes = [523.25, 493.88, 415.30, 392.00, 329.63, 311.13, 261.63, 246.94];
  const bassNotes = [130.81, 123.47, 98.00, 82.41];

  notes.forEach((frequency, index) => {
    const start = now + index * 0.18;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();

    osc.type = index % 2 ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(frequency, start);
    osc.detune.setValueAtTime(index % 2 ? -7 : 7, start);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600 - index * 160, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.11, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    osc.start(start);
    osc.stop(start + 0.36);
  });

  bassNotes.forEach((frequency, index) => {
    const start = now + index * 0.42;
    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);

    osc.connect(gain);
    gain.connect(output);
    osc.start(start);
    osc.stop(start + 0.55);
  });

  playNoiseBurst(0.12, 0.035, 1800, 700);
}

function playEvilLaugh() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const laughGain = audio.createGain();
  laughGain.connect(audio.destination);

  [0, 0.13, 0.27].forEach((offset, index) => {
    const voice = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + offset;

    voice.type = 'sawtooth';
    voice.frequency.setValueAtTime(180 - index * 24, start);
    voice.frequency.exponentialRampToValueAtTime(82 - index * 10, start + 0.16);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.075, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

    voice.connect(gain);
    gain.connect(laughGain);
    voice.start(start);
    voice.stop(start + 0.24);
  });
}

function playRocketMoveSound() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const thrust = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  thrust.type = 'triangle';
  thrust.frequency.setValueAtTime(92, now);
  thrust.frequency.exponentialRampToValueAtTime(148, now + 0.08);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(620, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.035, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
  thrust.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  thrust.start(now);
  thrust.stop(now + 0.12);
}


function playEyeChargeSound(durationMs = 680) {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const duration = durationMs / 1000;
  const zap = audio.createOscillator();
  const whine = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();

  zap.type = 'sawtooth';
  whine.type = 'square';
  zap.frequency.setValueAtTime(120, now);
  zap.frequency.exponentialRampToValueAtTime(980, now + duration);
  whine.frequency.setValueAtTime(240, now);
  whine.frequency.exponentialRampToValueAtTime(1840, now + duration);
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(520, now);
  filter.frequency.exponentialRampToValueAtTime(3200, now + duration);
  filter.Q.value = 7;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.075, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.05);
  zap.connect(filter);
  whine.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  zap.start(now);
  whine.start(now);
  zap.stop(now + duration + 0.08);
  whine.stop(now + duration + 0.08);
}

function playMonsterDeathSound() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const growl = audio.createOscillator();
  const throat = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();

  growl.type = 'sawtooth';
  throat.type = 'square';
  growl.frequency.setValueAtTime(96, now);
  growl.frequency.exponentialRampToValueAtTime(24, now + 1.2);
  throat.frequency.setValueAtTime(54, now);
  throat.frequency.exponentialRampToValueAtTime(18, now + 1.35);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(80, now + 1.15);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);
  growl.connect(filter);
  throat.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  growl.start(now);
  throat.start(now);
  growl.stop(now + 1.5);
  throat.stop(now + 1.5);
  playNoiseBurst(0.9, 0.08, 520, 45);
}

function playLaserCannonSound() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const blast = audio.createOscillator();
  const boom = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();

  blast.type = 'square';
  boom.type = 'sawtooth';
  blast.frequency.setValueAtTime(220, now);
  blast.frequency.exponentialRampToValueAtTime(54, now + 0.22);
  boom.frequency.setValueAtTime(78, now);
  boom.frequency.exponentialRampToValueAtTime(26, now + 0.38);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, now);
  filter.frequency.exponentialRampToValueAtTime(120, now + 0.34);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  blast.connect(gain);
  boom.connect(gain);
  gain.connect(filter);
  filter.connect(audio.destination);
  blast.start(now);
  boom.start(now);
  blast.stop(now + 0.28);
  boom.stop(now + 0.44);
  playNoiseBurst(0.26, 0.09, 2600, 90);
}

function fireLevelUpLasers(timestamp) {
  if (!meteors.length) return false;

  const originX = pilot.x + pilot.w / 2;
  const originY = pilot.y + pilot.h / 2;
  const targets = [...meteors]
    .map(meteor => ({
      meteor,
      distance: Math.hypot(meteor.x + meteor.size / 2 - originX, meteor.y + meteor.size / 2 - originY)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)
    .map(entry => entry.meteor);

  if (!targets.length) return false;

  const targetSet = new Set(targets);
  targets.forEach(meteor => { meteor.laserDestroyed = true; });
  meteors = meteors.filter(meteor => !targetSet.has(meteor));
  levelLaserShots.push(...targets.map((meteor, index) => ({
    x1: originX,
    y1: originY,
    x2: meteor.x + meteor.size / 2,
    y2: meteor.y + meteor.size / 2,
    born: timestamp,
    offset: index * 0.04
  })));
  playLaserCannonSound();
  popups.push({ text: `lasers x${targets.length}`, x: originX - 48, y: originY - 44, born: timestamp });
  return true;
}

function playLevelLaser() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const output = audio.createGain();
  const filter = audio.createBiquadFilter();
  const chime = audio.createOscillator();
  const bell = audio.createOscillator();
  const sub = audio.createOscillator();

  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.095, now + 0.025);
  output.gain.exponentialRampToValueAtTime(0.0001, now + 0.82);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3600, now);
  filter.frequency.exponentialRampToValueAtTime(820, now + 0.72);
  chime.type = 'triangle';
  bell.type = 'sine';
  sub.type = 'sine';
  chime.frequency.setValueAtTime(660, now);
  chime.frequency.exponentialRampToValueAtTime(990, now + 0.22);
  bell.frequency.setValueAtTime(330, now + 0.08);
  bell.frequency.exponentialRampToValueAtTime(247, now + 0.62);
  sub.frequency.setValueAtTime(82, now);
  sub.frequency.exponentialRampToValueAtTime(55, now + 0.58);
  chime.connect(output);
  bell.connect(output);
  sub.connect(output);
  output.connect(filter);
  filter.connect(audio.destination);
  chime.start(now);
  bell.start(now + 0.08);
  sub.start(now);
  chime.stop(now + 0.75);
  bell.stop(now + 0.85);
  sub.stop(now + 0.66);
  playNoiseBurst(0.08, 0.018, 4200, 900);
}

function playThunderCrash() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const rumble = audio.createOscillator();
  const rumbleGain = audio.createGain();

  rumble.type = 'sawtooth';
  rumble.frequency.setValueAtTime(58, now);
  rumble.frequency.exponentialRampToValueAtTime(24, now + 1.1);
  rumbleGain.gain.setValueAtTime(0.0001, now);
  rumbleGain.gain.exponentialRampToValueAtTime(0.2, now + 0.04);
  rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);

  rumble.connect(rumbleGain);
  rumbleGain.connect(audio.destination);
  rumble.start(now);
  rumble.stop(now + 1.4);
  playNoiseBurst(0.72, 0.16, 1800, 70);
}

function playBitCrushedBePrepared() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const output = audio.createGain();
  const lowFilter = audio.createBiquadFilter();
  const throatFilter = audio.createBiquadFilter();
  const crusher = audio.createWaveShaper();
  const whisper = audio.createBufferSource();
  const whisperGain = audio.createGain();
  const whisperFilter = audio.createBiquadFilter();
  const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 1.55), audio.sampleRate);
  const samples = buffer.getChannelData(0);
  const curve = new Float32Array(512);

  for (let i = 0; i < curve.length; i++) {
    const x = i / (curve.length - 1) * 2 - 1;
    curve[i] = Math.tanh(5.5 * x) * 0.82;
  }

  for (let i = 0; i < samples.length; i++) {
    const t = i / samples.length;
    const syllableGate = Math.sin(t * Math.PI) * (Math.floor(t * 18) % 2 ? 0.42 : 1);
    samples[i] = (Math.random() * 2 - 1) * syllableGate;
  }

  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.13, now + 0.08);
  output.gain.exponentialRampToValueAtTime(0.0001, now + 1.55);
  lowFilter.type = 'lowpass';
  lowFilter.frequency.setValueAtTime(130, now);
  lowFilter.Q.value = 3.5;
  throatFilter.type = 'bandpass';
  throatFilter.frequency.setValueAtTime(72, now);
  throatFilter.Q.value = 12;
  crusher.curve = curve;
  crusher.oversample = 'none';
  output.connect(crusher);
  crusher.connect(throatFilter);
  throatFilter.connect(lowFilter);
  lowFilter.connect(audio.destination);

  const syllables = [
    { offset: 0, root: 24, length: 0.42 },
    { offset: 0.43, root: 18, length: 0.5 },
    { offset: 0.93, root: 14, length: 0.58 }
  ];

  syllables.forEach(({ offset, root, length }, index) => {
    const start = now + offset;
    const growl = audio.createOscillator();
    const sub = audio.createOscillator();
    const rumble = audio.createOscillator();
    const gate = audio.createGain();
    const wobble = audio.createOscillator();
    const wobbleGain = audio.createGain();

    growl.type = 'sawtooth';
    sub.type = 'triangle';
    rumble.type = 'sine';
    growl.frequency.setValueAtTime(root, start);
    growl.frequency.exponentialRampToValueAtTime(Math.max(8, root * 0.62), start + length);
    sub.frequency.setValueAtTime(root / 2, start);
    sub.frequency.exponentialRampToValueAtTime(Math.max(5, root * 0.34), start + length);
    rumble.frequency.setValueAtTime(root / 4, start);
    wobble.frequency.setValueAtTime(7 + index * 1.7, start);
    wobbleGain.gain.setValueAtTime(3.5, start);
    wobble.connect(wobbleGain);
    wobbleGain.connect(growl.frequency);
    gate.gain.setValueAtTime(0.0001, start);
    gate.gain.exponentialRampToValueAtTime(0.18, start + 0.06);
    gate.gain.exponentialRampToValueAtTime(0.0001, start + length);
    growl.connect(gate);
    sub.connect(gate);
    rumble.connect(gate);
    gate.connect(output);
    wobble.start(start);
    growl.start(start);
    sub.start(start);
    rumble.start(start);
    wobble.stop(start + length);
    growl.stop(start + length + 0.04);
    sub.stop(start + length + 0.04);
    rumble.stop(start + length + 0.04);
  });

  whisper.buffer = buffer;
  whisperFilter.type = 'bandpass';
  whisperFilter.frequency.setValueAtTime(430, now);
  whisperFilter.Q.value = 2;
  whisperGain.gain.setValueAtTime(0.0001, now);
  whisperGain.gain.exponentialRampToValueAtTime(0.026, now + 0.08);
  whisperGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);
  whisper.connect(whisperFilter);
  whisperFilter.connect(whisperGain);
  whisperGain.connect(audio.destination);
  whisper.start(now);
  whisper.stop(now + 1.55);
}

function playRecordScratch() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const scratch = audio.createBufferSource();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.42), audio.sampleRate);
  const samples = buffer.getChannelData(0);

  for (let i = 0; i < samples.length; i++) {
    const t = i / samples.length;
    const chirp = Math.sin((1 - t) * (1 - t) * 900 + Math.sin(t * 120) * 16);
    const grit = Math.random() * 2 - 1;
    samples[i] = (chirp * 0.58 + grit * 0.42) * (1 - t);
  }

  scratch.buffer = buffer;
  scratch.playbackRate.setValueAtTime(1.35, now);
  scratch.playbackRate.exponentialRampToValueAtTime(0.38, now + 0.38);
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3400, now);
  filter.frequency.exponentialRampToValueAtTime(620, now + 0.36);
  filter.Q.value = 7;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  scratch.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  scratch.start(now);
  scratch.stop(now + 0.43);
}

function playSadViolinSong() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const output = audio.createGain();
  const filter = audio.createBiquadFilter();
  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.11, now + 0.16);
  output.gain.exponentialRampToValueAtTime(0.0001, now + 4.7);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2800, now);
  output.connect(filter);
  filter.connect(audio.destination);

  const notes = [392, 370, 329.63, 293.66, 277.18, 246.94, 220];
  notes.forEach((frequency, index) => {
    const start = now + index * 0.52;
    const stop = start + 0.9;
    const osc = audio.createOscillator();
    const shadow = audio.createOscillator();
    const gain = audio.createGain();
    const vibrato = audio.createOscillator();
    const vibratoGain = audio.createGain();

    osc.type = 'sawtooth';
    shadow.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, start);
    shadow.frequency.setValueAtTime(frequency * 0.997, start);
    vibrato.frequency.setValueAtTime(5.6, start);
    vibratoGain.gain.setValueAtTime(5.5, start);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    vibratoGain.connect(shadow.frequency);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.07, start + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, stop);
    osc.connect(gain);
    shadow.connect(gain);
    gain.connect(output);
    vibrato.start(start);
    osc.start(start);
    shadow.start(start);
    vibrato.stop(stop);
    osc.stop(stop);
    shadow.stop(stop);
  });
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

function playBlackHoleSpawnSound() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const ping = audio.createOscillator();
  const hollow = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();

  ping.type = 'sine';
  hollow.type = 'triangle';
  ping.frequency.setValueAtTime(740, now);
  ping.frequency.exponentialRampToValueAtTime(185, now + 0.46);
  hollow.frequency.setValueAtTime(92, now);
  hollow.frequency.exponentialRampToValueAtTime(46, now + 0.5);
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(920, now);
  filter.frequency.exponentialRampToValueAtTime(160, now + 0.5);
  filter.Q.value = 5;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.07, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);
  ping.connect(gain);
  hollow.connect(gain);
  gain.connect(filter);
  filter.connect(audio.destination);
  ping.start(now);
  hollow.start(now);
  ping.stop(now + 0.58);
  hollow.stop(now + 0.58);
}

function playBlackHoleSpaceSound() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const output = audio.createGain();
  const filter = audio.createBiquadFilter();
  const gravity = audio.createOscillator();
  const shimmer = audio.createOscillator();

  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
  output.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2200, now);
  filter.frequency.exponentialRampToValueAtTime(90, now + 1.45);
  gravity.type = 'sawtooth';
  shimmer.type = 'triangle';
  gravity.frequency.setValueAtTime(46, now);
  gravity.frequency.exponentialRampToValueAtTime(14, now + 1.45);
  shimmer.frequency.setValueAtTime(880, now);
  shimmer.frequency.exponentialRampToValueAtTime(110, now + 1.2);
  gravity.connect(output);
  shimmer.connect(output);
  output.connect(filter);
  filter.connect(audio.destination);
  gravity.start(now);
  shimmer.start(now);
  gravity.stop(now + 1.65);
  shimmer.stop(now + 1.25);
  playNoiseBurst(0.58, 0.06, 4200, 120);
}

function playRocketExplosion() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const blast = audio.createOscillator();
  const gain = audio.createGain();
  blast.type = 'sawtooth';
  blast.frequency.setValueAtTime(180, now);
  blast.frequency.exponentialRampToValueAtTime(32, now + 0.28);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
  blast.connect(gain);
  gain.connect(audio.destination);
  blast.start(now);
  blast.stop(now + 0.38);
  playNoiseBurst(0.32, 0.11, 1800, 90);
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
    const closeX = Math.abs(meteorCenterX - pilotCenterX) < meteor.size / 2 + pilot.w / 2 + 42;
    const crossingPlayer = Math.abs(meteorCenterY - pilotCenterY) < meteor.size / 2 + pilot.h / 2 + 26;

    if (closeX && crossingPlayer) {
      meteor.nearMissed = true;
      awardPoints(1);
      addNearMissPopup(timestamp);
      statusEl.textContent = 'Near miss! +1';
      updateHud();
    }
  }
}

function countSuccessfulDodges(timestamp) {
  const stillFalling = [];
  let clearMeteorsForRotation = false;

  for (const meteor of meteors) {
    if (meteor.y < canvas.height + meteor.size) {
      stillFalling.push(meteor);
      continue;
    }

    playBottomExplosion();
    awardPoints(level);
    dodges++;

    if (dodges % dodgesPerLevel === 0) {
      level++;
      shakePageText();
      fireLevelUpLasers(timestamp);
      speedLevel = level;
      pilotSpinUntil = timestamp + 1100;
      statusEl.textContent = `Level ${level}: the sins move faster.`;

      if ((level - 1) % 3 === 0) {
        levelSurgeUntil = timestamp + 3600;
        bePreparedUntil = timestamp + 1300;
        rotationCount++;
        const rotationPause = Math.max(normalMeteorSpawnDelay, 3200 - rotationCount * 520);
        const rotationOptions = [90, 180, -90, -180];
        spawnPauseUntil = timestamp + rotationPause;
        rotationSlowUntil = timestamp + Math.max(2400, rotationPause + 4000);
        screenRotation = rotationOptions[Math.floor(Math.random() * rotationOptions.length)];
        backgroundTheme = (backgroundTheme + 1) % backgroundThemes.length;
        clearMeteorsForRotation = true;
        lastSpawn = timestamp + rotationPause;
        resetPowerupTimers(timestamp);
        playThunderCrash();
        playRecordScratch();
        playBitCrushedBePrepared();
        statusEl.textContent = `Level ${level}: the screen turns.`;
      }
    }
  }

  meteors = clearMeteorsForRotation ? [] : stillFalling.filter(meteor => !meteor.laserDestroyed);
  updateHud();
}

function hit(a, b) {
  const insetX = a.hitInsetX || 0;
  const insetY = a.hitInsetY || 0;
  const pad = b.hitPad || 0;
  return a.x + insetX < b.x + b.size + pad &&
    a.x + a.w - insetX > b.x - pad &&
    a.y + insetY < b.y + b.size + pad &&
    a.y + a.h - insetY > b.y - pad;
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

function isTranscendAnimating(timestamp = performance.now()) {
  return transcendAnimation && timestamp - transcendAnimation.born < 1550;
}

function playTranscendJackpot() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const master = audio.createGain();
  const filter = audio.createBiquadFilter();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.16, now + 0.05);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(280, now);
  master.connect(filter);
  filter.connect(audio.destination);

  const notes = [1046.5, 1318.5, 1568, 2093, 1568, 1318.5, 1760, 2349.3];
  for (let i = 0; i < 26; i++) {
    const start = now + i * 0.105;
    const coin = audio.createOscillator();
    const ring = audio.createOscillator();
    const gain = audio.createGain();
    coin.type = 'square';
    ring.type = 'sine';
    coin.frequency.setValueAtTime(notes[i % notes.length], start);
    coin.frequency.exponentialRampToValueAtTime(notes[(i + 2) % notes.length] * 0.92, start + 0.08);
    ring.frequency.setValueAtTime(notes[(i + 3) % notes.length] * 1.5, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.045 + (i % 4) * 0.008, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
    coin.connect(gain);
    ring.connect(gain);
    gain.connect(master);
    coin.start(start);
    ring.start(start);
    coin.stop(start + 0.16);
    ring.stop(start + 0.12);
  }

  const roll = audio.createOscillator();
  const rollGain = audio.createGain();
  roll.type = 'triangle';
  roll.frequency.setValueAtTime(196, now);
  roll.frequency.exponentialRampToValueAtTime(784, now + 2.5);
  rollGain.gain.setValueAtTime(0.0001, now);
  rollGain.gain.exponentialRampToValueAtTime(0.035, now + 0.12);
  rollGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.1);
  roll.connect(rollGain);
  rollGain.connect(master);
  roll.start(now);
  roll.stop(now + 3.15);
}

function playTranscendGunshot() {
  const audio = getAudioContext();
  if (!audio) return;

  const now = audio.currentTime;
  const crack = audio.createOscillator();
  const thump = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();

  crack.type = 'square';
  thump.type = 'sawtooth';
  crack.frequency.setValueAtTime(520, now);
  crack.frequency.exponentialRampToValueAtTime(120, now + 0.055);
  thump.frequency.setValueAtTime(90, now);
  thump.frequency.exponentialRampToValueAtTime(38, now + 0.16);
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1400, now);
  filter.frequency.exponentialRampToValueAtTime(260, now + 0.12);
  filter.Q.value = 5;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  crack.connect(gain);
  thump.connect(gain);
  gain.connect(filter);
  filter.connect(audio.destination);
  crack.start(now);
  thump.start(now);
  crack.stop(now + 0.08);
  thump.stop(now + 0.18);
  playNoiseBurst(0.12, 0.055, 2200, 260);
}

function spawnOneTranscendSpitLetter(letter, timestamp, index = 0) {
  const mouthY = canvas.height - 34;
  const originX = Math.max(28, Math.min(canvas.width - 28, transcendX + 18 + (index % transcendWord.length) * 32));
  const effects = ['jitter', 'spin', 'stretch', 'flicker', 'mirror', 'blur'];
  transcendShakeUntil = timestamp + 140;
  transcendSpitLetters.push({
    letter,
    x: originX,
    y: mouthY - 4,
    vx: (Math.random() < 0.5 ? -1 : 1) * (1.6 + Math.random() * 3.8),
    vy: -(8.5 + Math.random() * 6.2),
    gravity: 0.25 + Math.random() * 0.09,
    size: 28,
    effect: effects[Math.floor(Math.random() * effects.length)],
    effectSeed: Math.random() * Math.PI * 2,
    born: timestamp
  });
  playTranscendGunshot();
}

function startTranscendSpitOut(timestamp) {
  if (!transcendCollectedLetters.length) return false;

  transcendSpitQueue = [...transcendCollectedLetters];
  transcendCollectedLetters = [];
  transcendFilled = Array(transcendWord.length).fill(false);
  transcendRuneSlots = randomTranscendRuneSlots();
  transcendLetters = [];
  transcendAnimation = null;
  transcendenceCount = 0;
  resetEyeBossPhase();
  nextTranscendLetterAt = timestamp + 1400;
  nextTranscendSpitAt = timestamp;
  statusEl.textContent = 'The mouth rejected every collected TRANSCEND letter.';
  return true;
}


function triggerPlayerHit(timestamp, message = `Bonked! ${whisperScream()} Try again.`) {
  running = false;
  combo = 0;
  nextComboBellAt = 5;
  stopBassMusic();
  playQuietScream();
  playRocketExplosion();
  hitExplosion = { x: pilot.x + pilot.w / 2, y: pilot.y + pilot.h / 2, born: performance.now() };
  pilotVisible = false;
  setTimeout(() => { hitExplosion = null; draw(); }, 650);
  playSadGameOverJingle();
  playEvilLaugh();
  statusEl.textContent = message;
  animationFrameId = null;
  showSlimeDrips();
  startDeadEchoRewrite();
  showWelcomeHome();
  draw();
}

function updateTranscendSystem(timestamp, delta) {
  const mouthY = canvas.height - 34;
  const wordWidth = 300;
  const wordY = mouthY - 42;

  if (isTranscendAnimating(timestamp)) {
    meteors = [];
    return;
  }

  if (transcendAnimation && timestamp - transcendAnimation.born >= 1550) {
    transcendAnimation = null;
    transcendFilled = Array(transcendWord.length).fill(false);
    transcendRuneSlots = randomTranscendRuneSlots();
    transcendLetters = [];
    nextTranscendLetterAt = timestamp + 850;
  }

  transcendX += transcendVx * delta;
  if (transcendX <= 12 || transcendX + wordWidth >= canvas.width - 12) {
    transcendVx *= -1;
    transcendX = Math.max(12, Math.min(canvas.width - 12 - wordWidth, transcendX));
  }

  if (timestamp >= nextTranscendLetterAt && !transcendLetters.length && !transcendSpitQueue.length && !transcendSpitLetters.length && !transcendFilled.every(Boolean)) {
    const index = transcendFilled.findIndex(filled => !filled);
    if (index < 0) return;
    const slotX = transcendX + 16 + index * 32;
    transcendLetters.push({
      letter: transcendWord[index],
      index,
      x: Math.max(32, Math.min(canvas.width - 32, slotX + (Math.random() * 48 - 24))),
      y: -24,
      vy: 4.1 + Math.random() * 1.3 + transcendenceCount * 0.6 + transcendLetterSpeedBoost * 2,
      sway: Math.random() * Math.PI * 2,
      size: 30
    });
    nextTranscendLetterAt = timestamp + 900;
  }

  for (const letter of transcendLetters) {
    letter.y += letter.vy * delta;
    letter.x += Math.sin(frame * 0.04 + letter.sway) * 0.28 * delta;
    if (hit(pilot, { x: letter.x - letter.size / 2, y: letter.y - letter.size / 2, size: letter.size, hitPad: -6 })) {
      startTranscendSpitOut(timestamp);
      letter.consumed = true;
      continue;
    }
    if (letter.y >= mouthY - 4) {
      transcendFilled[letter.index] = true;
      transcendCollectedLetters.push(letter.letter);
      letter.consumed = true;
      popups.push({ text: letter.letter, x: letter.x - 6, y: mouthY - 18, born: timestamp });
    }
  }
  transcendLetters = transcendLetters.filter(letter => !letter.consumed && letter.y < canvas.height + 30);

  if (transcendSpitQueue.length && timestamp >= nextTranscendSpitAt) {
    const letter = transcendSpitQueue.shift();
    spawnOneTranscendSpitLetter(letter, timestamp, transcendSpitLetters.length);
    nextTranscendSpitAt = timestamp + 115;
  }

  for (const letter of transcendSpitLetters) {
    letter.x += letter.vx * delta;
    letter.y += letter.vy * delta;
    letter.vy += letter.gravity * delta;
  }
  transcendSpitLetters = transcendSpitLetters.filter(letter => letter.y < canvas.height + 48 && timestamp - letter.born < 5200);

  if (transcendFilled.every(Boolean) && !transcendAnimation) {
    transcendenceCount++;
    maybeUnlockTranscendBranches(timestamp);
    transcendAnimation = { born: timestamp, startX: transcendX, startY: wordY };
    playTranscendJackpot();
    meteors = [];
    transcendLetters = [];
    statusEl.textContent = 'TRANSCEND complete.';
  }
}

function drawTranscendSystem(now) {
  const mouthY = canvas.height - 34;
  const word = transcendWord;
  const spacing = 32;
  const fontSize = 34;
  const baseY = mouthY - 42;
  let x = transcendX;
  let y = baseY;
  let rotation = 0;
  let alpha = 1;
  let transcendMouthHit = false;

  if (transcendAnimation) {
    const age = now - transcendAnimation.born;
    const raise = Math.min(1, age / 420);
    const hold = Math.max(0, Math.min(1, (age - 420) / 360));
    const slam = Math.max(0, Math.min(1, (age - 780) / 520));
    x = transcendAnimation.startX;
    y = transcendAnimation.startY + (canvas.height / 2 - transcendAnimation.startY) * raise;
    if (hold > 0) rotation = hold * Math.PI * 2;
    if (slam > 0) {
      y = canvas.height / 2 + (canvas.height + 80 - canvas.height / 2) * Math.pow(slam, 2.2);
      rotation = Math.PI * 2 + slam * Math.PI * 3;
      alpha = 1 - Math.max(0, (slam - 0.6) / 0.4);
      transcendMouthHit = y >= mouthY - 20;
    }
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `900 ${fontSize}px 'Creepster', 'Nosifer', 'Metal Mania', 'Cinzel Decorative', Georgia, serif`;
  ctx.lineWidth = 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.translate(x + (word.length * spacing) / 2, y);
  ctx.rotate(rotation);
  ctx.translate(-(word.length * spacing) / 2, 0);

  for (let i = 0; i < word.length; i++) {
    const lx = i * spacing;
    const displayChar = (transcendFilled[i] || transcendAnimation) ? word[i] : (transcendRuneSlots[i] || '?');
    const rainbowHue = (now * 0.45 + i * 42) % 360;
    ctx.strokeStyle = transcendAnimation ? (transcendMouthHit ? '#050006' : '#ffffff') : '#ffcf33';
    ctx.shadowColor = '#9dff6e';
    ctx.shadowBlur = transcendAnimation ? (transcendMouthHit ? 22 : 8) : 12;
    ctx.strokeText(displayChar, lx, 0);
    if (transcendFilled[i] || transcendAnimation) {
      ctx.fillStyle = transcendAnimation
        ? (transcendMouthHit ? `hsl(${rainbowHue}, 100%, 58%)` : '#050006')
        : '#ffcf33';
      ctx.fillText(displayChar, lx, 0);
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, .72)';
      ctx.fillText(displayChar, lx, 0);
    }
  }
  ctx.restore();

  for (const letter of transcendLetters) {
    ctx.save();
    ctx.font = `900 30px 'Creepster', 'Nosifer', 'Metal Mania', 'Cinzel Decorative', Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffcf33';
    ctx.strokeStyle = '#050006';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#9dff6e';
    ctx.shadowBlur = 16;
    ctx.strokeText(letter.letter, letter.x, letter.y);
    ctx.fillText(letter.letter, letter.x, letter.y);
    ctx.restore();
  }

  for (const letter of transcendSpitLetters) {
    const age = now - letter.born;
    const pulse = Math.sin(age * 0.035 + letter.effectSeed);
    const jitterX = letter.effect === 'jitter' ? (Math.random() * 5 - 2.5) : 0;
    const jitterY = letter.effect === 'jitter' ? (Math.random() * 5 - 2.5) : 0;

    ctx.save();
    ctx.translate(letter.x + jitterX, letter.y + jitterY);
    if (letter.effect === 'spin') ctx.rotate(age * 0.018);
    if (letter.effect === 'mirror') ctx.scale(pulse > 0 ? 1 : -1, 1);
    if (letter.effect === 'stretch') ctx.scale(1 + Math.abs(pulse) * 0.35, 1 - Math.abs(pulse) * 0.18);
    if (letter.effect === 'flicker') ctx.globalAlpha = 0.35 + Math.abs(pulse) * 0.65;
    if (letter.effect === 'blur') ctx.filter = `blur(${Math.abs(pulse) * 1.6}px)`;
    ctx.font = `900 28px 'Creepster', 'Nosifer', 'Metal Mania', 'Cinzel Decorative', Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = letter.effect === 'flicker' ? '#ffffff' : '#ffcf33';
    ctx.strokeStyle = '#050006';
    ctx.lineWidth = 5;
    ctx.shadowColor = letter.effect === 'blur' ? '#ffffff' : '#9dff6e';
    ctx.shadowBlur = letter.effect === 'blur' ? 28 : 18;
    ctx.strokeText(letter.letter, 0, 0);
    ctx.fillText(letter.letter, 0, 0);
    ctx.restore();
  }
}

function pullPowerupTowardPilot(powerup, strength = 0.018) {
  if (!powerup || performance.now() >= blackHoleUntil) return;

  const targetX = pilot.x + pilot.w / 2 - powerup.size / 2;
  const targetY = pilot.y + pilot.h / 2 - powerup.size / 2;
  powerup.x += (targetX - powerup.x) * strength;
  powerup.y += (targetY - powerup.y) * strength;
}

function step(timestamp, token = runToken) {
  if (!running || token !== runToken) return;
  if (paused) {
    lastFrameTimestamp = timestamp;
    draw();
    animationFrameId = requestAnimationFrame(nextTimestamp => step(nextTimestamp, token));
    return;
  }
  const delta = lastFrameTimestamp ? Math.min(1.6, Math.max(0.35, (timestamp - lastFrameTimestamp) / 16.67)) : 1;
  lastFrameTimestamp = timestamp;
  frame++;
  maybeSummonVoidWhisper(timestamp);

  const movingRocket = keys.ArrowLeft || keys.a || keys.ArrowRight || keys.d || keys.ArrowUp || keys.w || keys.ArrowDown || keys.s;
  if (keys.ArrowLeft || keys.a) pilot.x -= pilotSpeed * delta;
  if (keys.ArrowRight || keys.d) pilot.x += pilotSpeed * delta;
  if (keys.ArrowUp || keys.w) pilot.y -= pilotSpeed * delta;
  if (keys.ArrowDown || keys.s) pilot.y += pilotSpeed * delta;
  if (movingRocket && timestamp - lastMoveSoundAt > 135) {
    playRocketMoveSound();
    lastMoveSoundAt = timestamp;
  }
  pilot.x = Math.max(0, Math.min(canvas.width - pilot.w, pilot.x));
  const mouthHeight = 34;
  pilot.y = Math.max(0, Math.min(canvas.height - mouthHeight - pilot.h, pilot.y));
  updateTranscendSystem(timestamp, delta);
  maybeUnlockTranscendBranches(timestamp);
  scheduleEyeBossShot(timestamp);
  const transcendLockout = isTranscendAnimating(timestamp);

  if (!transcendLockout && timestamp >= spawnPauseUntil && timestamp - lastSpawn > normalMeteorSpawnDelay) {
    spawnMeteor();
    lastSpawn = timestamp;
  }

  if (timestamp >= spawnPauseUntil && !relic && timestamp - lastRelicSpawn > 7000) {
    spawnRelic();
    lastRelicSpawn = timestamp;
  }

  if (timestamp >= spawnPauseUntil && !eyePowerup && timestamp - lastEyeSpawn > 6500) {
    spawnEyePowerup();
    lastEyeSpawn = timestamp;
  }

  if (timestamp >= spawnPauseUntil && screenRotation && !pentagramPowerup && timestamp - lastPentagramSpawn > 3200) {
    spawnPentagramPowerup();
    lastPentagramSpawn = timestamp;
  }

  if (timestamp >= spawnPauseUntil && !blackHolePowerup && timestamp >= blackHoleCooldownUntil && timestamp - lastBlackHoleSpawn > 11000) {
    spawnBlackHolePowerup();
    lastBlackHoleSpawn = timestamp;
  }

  if (transcendLockout) meteors = [];

  for (const meteor of meteors) {
    meteor.y += meteor.speed * delta;
    meteor.x += meteor.vx * delta;
    if (!meteor.mouthTouched && meteor.y + meteor.size >= canvas.height - 34) {
      meteor.mouthTouched = true;
      meteor.color = meteorImpactColors[Math.floor(Math.random() * meteorImpactColors.length)];
      meteor.spinSpeed *= 1.35;
    }
    if (meteor.x <= 0 || meteor.x + meteor.size >= canvas.width) {
      meteor.vx *= -1;
      meteor.x = Math.max(0, Math.min(canvas.width - meteor.size, meteor.x));
    }
    meteor.spin += meteor.spinSpeed;
  }

  for (let i = 0; i < meteors.length; i++) {
    for (let j = i + 1; j < meteors.length; j++) {
      const a = meteors[i];
      const b = meteors[j];
      const ax = a.x + a.size / 2;
      const ay = a.y + a.size / 2;
      const bx = b.x + b.size / 2;
      const by = b.y + b.size / 2;
      const minDistance = (a.size + b.size) / 2;

      if (Math.hypot(ax - bx, ay - by) < minDistance) {
        [a.vx, b.vx] = [b.vx, a.vx];
        a.spinSpeed *= -1;
        b.spinSpeed *= -1;
      }
    }
  }
  popups = popups.filter(popup => timestamp - popup.born < 900);
  levelLaserShots = levelLaserShots.filter(shot => timestamp - shot.born < 420);
  eyeBossShots = eyeBossShots.filter(shot => !shot.cancelled && timestamp - shot.born < shot.warningMs + 420);
  awardNearMisses(timestamp);
  countSuccessfulDodges(timestamp);

  if (relic) {
    relic.y += relic.speed * delta;
    relic.spin += relic.spinSpeed * delta;
    pullPowerupTowardPilot(relic, 0.022);

    if (hit(pilot, relic)) {
      relic = null;
      playRelicPunch();
      fateModeUntil = timestamp + 1200;
      const hadMaxCombo = combo >= 69;
      addCombo(5);
      if (hadMaxCombo) {
        score += Math.max(1, Math.round(313 * (1 + combo)));
      } else {
        awardPoints(relicBonus);
      }
      popups.push({ text: hadMaxCombo ? '+313 x combo' : '+5 combo', x: pilot.x + pilot.w / 2 - 54, y: pilot.y - 34, born: timestamp });
      statusEl.textContent = hadMaxCombo ? 'Relic taken at max combo: +313 score times combo.' : 'Relic taken: +5 combo. Fate sees you.';
      updateHud();
    } else if (relic.y > canvas.height + relic.size) {
      relic = null;
    }
  }

  if (eyePowerup) {
    eyePowerup.y += eyePowerup.speed * delta;
    eyePowerup.spin += eyePowerup.spinSpeed * delta;
    pullPowerupTowardPilot(eyePowerup, 0.022);

    if (hit(pilot, eyePowerup)) {
      eyePowerup = null;
      playEyeSquish();
      resetMeteorSpeed();
      transcendLetterSpeedBoost += 0.18;
      popups.push({ text: 'speed reset', x: pilot.x + pilot.w / 2 - 52, y: pilot.y - 12, born: timestamp });
      statusEl.textContent = 'Floating eye collected: game speed reset. TRANSCEND letters fall faster.';
    } else if (eyePowerup.y > canvas.height + eyePowerup.size) {
      eyePowerup = null;
    }
  }

  if (pentagramPowerup) {
    pentagramPowerup.y += pentagramPowerup.speed * delta;
    pentagramPowerup.spin += pentagramPowerup.spinSpeed * delta;
    pullPowerupTowardPilot(pentagramPowerup, 0.022);

    if (hit(pilot, pentagramPowerup)) {
      pentagramPowerup = null;
      meteors = [];
      playPentagramPortal();
      resetCanvasRotation();
      statusEl.textContent = 'Pentagram collected: canvas reset.';
    } else if (pentagramPowerup.y > canvas.height + pentagramPowerup.size) {
      pentagramPowerup = null;
    }
  }

  if (blackHolePowerup) {
    blackHolePowerup.y += blackHolePowerup.speed * delta;
    blackHolePowerup.spin += blackHolePowerup.spinSpeed * delta;

    if (hit(pilot, blackHolePowerup)) {
      blackHolePowerup = null;
      blackHoleUntil = timestamp + 13000;
      blackHoleCooldownUntil = timestamp + 39000;
      playBlackHoleSpaceSound();
      popups.push({ text: 'black hole', x: pilot.x + pilot.w / 2 - 46, y: pilot.y - 16, born: timestamp });
      statusEl.textContent = 'Black hole collected: powerups are pulled toward you for 13 seconds.';
    } else if (blackHolePowerup.y > canvas.height + blackHolePowerup.size) {
      blackHolePowerup = null;
    }
  }

  for (const shot of eyeBossShots) {
    if (!shot.fired && timestamp - shot.born >= shot.warningMs) {
      if (isEyeClosed(timestamp)) {
        shot.cancelled = true;
        nextEyeBossShotAt = timestamp + 600;
        continue;
      }
      shot.fired = true;
      playLaserCannonSound();
    }
    if (eyeBossLaserHitsPilot(shot, timestamp)) {
      triggerPlayerHit(timestamp, 'The eye watched too closely. Try again.');
      return;
    }
  }

  for (const letter of transcendSpitLetters) {
    if (hit(pilot, { x: letter.x - letter.size / 2, y: letter.y - letter.size / 2, size: letter.size, hitPad: -5 })) {
      triggerPlayerHit(timestamp, 'TRANSCEND rejected you. Try again.');
      return;
    }
  }

  for (const meteor of meteors) {
    if (hit(pilot, meteor)) {
      triggerPlayerHit(timestamp);
      return;
    }
  }

  draw();
  animationFrameId = requestAnimationFrame(nextTimestamp => step(nextTimestamp, token));
}

function drawGiantBlinkingEye(bg) {
  const bossEye = isEyeBossVisible();
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const now = performance.now();

  if (!nextEyeBlinkAt) nextEyeBlinkAt = now + 2500 + Math.random() * 4500;
  if (now >= nextEyeBlinkAt) {
    eyeBlinkUntil = now + (bossEye ? 700 : 1550) + Math.random() * (bossEye ? 350 : 950);
    nextEyeBlinkAt = eyeBlinkUntil + (bossEye ? 1800 : 4200) + Math.random() * (bossEye ? 2200 : 7600);
  }

  const blinkProgress = now < eyeBlinkUntil ? 1 - (eyeBlinkUntil - now) / 2200 : 1;
  const closeAmount = now < eyeBlinkUntil ? Math.sin(Math.max(0, Math.min(1, blinkProgress)) * Math.PI) : 0;
  const open = (bossEye ? 0.58 : 0.48) - closeAmount * (bossEye ? 0.50 : 0.38);

  ctx.save();
  ctx.globalAlpha = bossEye ? Math.max(0.18, 1 - closeAmount * 0.72) : (1 - closeAmount) * 0.22;
  ctx.globalCompositeOperation = 'screen';
  ctx.translate(cx, cy);
  ctx.scale(1, open);

  const eyeGlow = ctx.createRadialGradient(0, 0, 20, 0, 0, canvas.width * 0.48);
  eyeGlow.addColorStop(0, bossEye ? 'rgba(216, 178, 255, .96)' : 'rgba(255, 255, 255, .22)');
  eyeGlow.addColorStop(0.35, bossEye ? 'rgba(136, 42, 255, .62)' : 'rgba(160, 160, 160, .16)');
  eyeGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = eyeGlow;
  ctx.beginPath();
  ctx.moveTo(-canvas.width * 0.46, 0);
  ctx.lineTo(-canvas.width * 0.22, -canvas.height * 0.28);
  ctx.lineTo(0, -canvas.height * 0.34);
  ctx.lineTo(canvas.width * 0.22, -canvas.height * 0.28);
  ctx.lineTo(canvas.width * 0.46, 0);
  ctx.lineTo(canvas.width * 0.22, canvas.height * 0.28);
  ctx.lineTo(0, canvas.height * 0.34);
  ctx.lineTo(-canvas.width * 0.22, canvas.height * 0.28);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = bossEye ? 'rgba(210, 160, 255, .95)' : 'rgba(255, 255, 255, .24)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-canvas.width * 0.42, 0);
  ctx.lineTo(-canvas.width * 0.2, -canvas.height * 0.23);
  ctx.lineTo(0, -canvas.height * 0.28);
  ctx.lineTo(canvas.width * 0.2, -canvas.height * 0.23);
  ctx.lineTo(canvas.width * 0.42, 0);
  ctx.lineTo(canvas.width * 0.2, canvas.height * 0.23);
  ctx.lineTo(0, canvas.height * 0.28);
  ctx.lineTo(-canvas.width * 0.2, canvas.height * 0.23);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = bossEye ? 'rgba(32, 0, 56, .92)' : 'rgba(0, 0, 0, .62)';
  ctx.beginPath();
  ctx.moveTo(0, -canvas.width * 0.09);
  ctx.lineTo(canvas.width * 0.075, 0);
  ctx.lineTo(0, canvas.width * 0.09);
  ctx.lineTo(-canvas.width * 0.075, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = bossEye ? 'rgba(255, 255, 255, .82)' : 'rgba(255, 255, 255, .26)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -canvas.width * 0.15);
  ctx.lineTo(canvas.width * 0.13, 0);
  ctx.lineTo(0, canvas.width * 0.15);
  ctx.lineTo(-canvas.width * 0.13, 0);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

function drawGiantMouth() {
  const mouthHeight = 34;
  const y = canvas.height - mouthHeight;
  const pulse = Math.sin(frame * 0.08) * 2;

  ctx.save();
  ctx.fillStyle = '#050006';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(0, y + 8 + pulse);
  ctx.quadraticCurveTo(canvas.width / 2, y - 7 - pulse, canvas.width, y + 8 + pulse);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, .20)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y + 9 + pulse);
  ctx.quadraticCurveTo(canvas.width / 2, y - 7 - pulse, canvas.width, y + 9 + pulse);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, .72)';
  for (let x = 6; x < canvas.width; x += 14) {
    const tooth = 7 + ((x / 14) % 2) * 4;
    const curveY = px => {
      const t = px / canvas.width;
      const start = y + 8 + pulse;
      const control = y - 7 - pulse;
      return (1 - t) * (1 - t) * start + 2 * (1 - t) * t * control + t * t * start;
    };
    const y1 = curveY(x);
    const y2 = curveY(x + 7);
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x + 7, y2);
    ctx.lineTo(x + 3.5, (y1 + y2) / 2 + tooth);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawFlyingSpace(bg) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (const star of spaceStars) {
    const speed = running ? 1.25 + level * 0.16 : 0.45;
    star.z += 0.018 * speed;
    if (star.z > 2.2) {
      star.x = Math.random() * canvas.width;
      star.y = Math.random() * canvas.height;
      star.z = 0.2;
      star.hue = Math.random() < 0.72 ? 210 : (Math.random() < 0.5 ? 115 : 285);
    }

    const dx = star.x - cx;
    const dy = star.y - cy;
    const stretch = star.z * (running ? 6 + level * 0.35 : 3);
    const x = cx + dx * star.z;
    const y = cy + dy * star.z;
    const angle = Math.atan2(dy, dx);
    const alpha = Math.min(0.42, 0.08 + star.z * 0.16);

    if (x < -40 || x > canvas.width + 40 || y < -40 || y > canvas.height + 40) {
      star.z = 0.2;
      star.x = Math.random() * canvas.width;
      star.y = Math.random() * canvas.height;
      continue;
    }

    ctx.strokeStyle = `hsla(${star.hue}, 100%, ${72 + star.z * 9}%, ${alpha})`;
    ctx.lineWidth = Math.max(1, star.z * 1.6);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - Math.cos(angle) * stretch, y - Math.sin(angle) * stretch);
    ctx.stroke();
  }

  const warp = 0.075 + Math.abs(Math.sin(frame * 0.035)) * 0.055;
  const gradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, canvas.width * 0.65);
  gradient.addColorStop(0, `rgba(255, 255, 255, ${warp})`);
  gradient.addColorStop(0.22, 'rgba(0, 245, 255, .055)');
  gradient.addColorStop(0.6, 'rgba(179, 136, 255, .04)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawTranscendWhiteWarp() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.strokeStyle = '#050006';
  ctx.fillStyle = '#050006';
  ctx.lineCap = 'round';
  for (const star of spaceStars) {
    const speed = 2.6 + transcendenceCount * 0.25;
    star.z += 0.04 * speed;
    if (star.z > 2.4) {
      star.x = Math.random() * canvas.width;
      star.y = Math.random() * canvas.height;
      star.z = 0.18;
    }

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const dx = star.x - cx;
    const dy = star.y - cy;
    const x = cx + dx * star.z;
    const y = cy + dy * star.z;
    const angle = Math.atan2(dy, dx);
    const length = star.z * 18;
    const alpha = Math.min(0.7, 0.14 + star.z * 0.23);

    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1, star.z * 1.4);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - Math.cos(angle) * length, y - Math.sin(angle) * length);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawTentacleBorder() {
  if (!tentacleBorderSvg) return;

  const variant = (level - 1) % 3;
  const configs = [
    { color: '#2f7a24', dark: '#020901', width: 3.6, amp: 1.8, waves: 8 },
    { color: '#7a1200', dark: '#100000', width: 4.1, amp: 2.3, waves: 10 },
    { color: '#4a2575', dark: '#05000b', width: 4.6, amp: 2.8, waves: 7 }
  ];
  const config = configs[variant];
  const sides = [
    { fixed: 1.5, from: 5, to: 95, horizontal: true },
    { fixed: 98.5, from: 5, to: 95, horizontal: false },
    { fixed: 98.5, from: 95, to: 5, horizontal: true },
    { fixed: 1.5, from: 95, to: 5, horizontal: false }
  ];

  tentacleBorderSvg.style.setProperty('--tentacle-svg-glow', config.color);
  tentacleBorderSvg.style.setProperty('--tentacle-svg-dark', config.dark);

  sides.forEach((side, sideIndex) => {
    const points = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const travel = side.from + (side.to - side.from) * t;
      const wobble = Math.sin(t * Math.PI * 2 * config.waves + frame * 0.05 + sideIndex) * config.amp;
      const x = side.horizontal ? travel : side.fixed + wobble;
      const y = side.horizontal ? side.fixed + wobble : travel;
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }

    const path = tentaclePaths[sideIndex];
    path.setAttribute('d', `M ${points.join(' L ')}`);
    path.setAttribute('stroke-width', config.width);
  });
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
  const now = performance.now();
  if (now < transcendShakeUntil) {
    const shake = (transcendShakeUntil - now) / 140;
    ctx.translate((Math.random() * 2 - 1) * 4 * shake, (Math.random() * 2 - 1) * 3 * shake);
  }
  const transcendAnimatingNow = isTranscendAnimating(now);
  const fateMode = now < fateModeUntil;
  const levelSurge = now < levelSurgeUntil;
  const pilotSpin = now < pilotSpinUntil;
  const bg = backgroundThemes[backgroundTheme] || backgroundThemes[0];
  if (transcendAnimatingNow || activeBranches.whiteVoid) {
    drawTranscendWhiteWarp();
    if (!transcendAnimatingNow) {
      ctx.fillStyle = 'rgba(255, 255, 255, .22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  } else {
    ctx.fillStyle = bg.base;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGiantBlinkingEye(bg);
    drawFlyingSpace(bg);
  }
  if (activeBranches.eyeBoss && !transcendAnimatingNow) drawGiantBlinkingEye(bg);
  drawGiantMouth();
  drawTranscendSystem(now);

  if (fateMode && !transcendAnimatingNow) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.06 + Math.abs(Math.sin(frame * 0.08)) * 0.05})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (levelSurge && !transcendAnimatingNow) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.10 + Math.abs(Math.sin(frame * 0.18)) * 0.08})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (now < bePreparedUntil && Math.floor(frame / 8) % 2 === 0) {
    ctx.fillStyle = '#ffea00';
    ctx.font = 'bold 48px Georgia, serif';
    ctx.textAlign = 'center';
    glowText('Be Prepared...', canvas.width / 2, canvas.height / 2, '#ffea00', 24, 4, '#050006');
    ctx.textAlign = 'start';
  }

  if (paused) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, .35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 42px Georgia, serif';
    ctx.textAlign = 'center';
    glowText('PAUSED', canvas.width / 2, canvas.height / 2, '#b388ff', 22, 4, '#050006');
    ctx.textAlign = 'start';
    ctx.restore();
  }

  ctx.fillStyle = bg.mist;
  for (let i = 0; i < 70; i++) {
    const x = (i * 97 + frame * 1.9) % canvas.width;
    const y = (i * 53 + frame * 3.2) % canvas.height;
    glowRect(x, y, 3, 10, i % 2 ? '#9dff6e' : bg.alt, 10);
  }


  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = comboColor();
  ctx.font = 'bold 13px Papyrus, \"Cinzel Decorative\", Georgia, serif';
  if (combo >= 69) {
    const flicker = Math.sin(frame * 0.55) * 2;
    const comboText = `COMBO ${combo.toFixed(2)}`;

    ctx.save();
    ctx.font = 'bold 14px Papyrus, \"Cinzel Decorative\", Georgia, serif';
    ctx.globalAlpha = 0.65;
    glowText(comboText, 21, 30 + flicker, '#ff2a00', 24, 4, '#2a0000');
    ctx.globalAlpha = 0.55;
    glowText(comboText, 23, 26 - flicker, '#ffea00', 20, 3, '#7a1200');
    ctx.globalAlpha = 1;
    glowText(comboText, 22, 28, '#fff1b8', 18, 2.5, '#5a0000');
    ctx.restore();
  } else {
    glowText(`COMBO ${combo.toFixed(2)}`, 22, 28, comboColor(), 8, 1.5, '#050006');
  }

  ctx.save();
  ctx.font = 'bold 12px "Cinzel Decorative", Georgia, serif';
  glowText(`TRANSCENDENCE ${transcendenceCount}`, 22, 48, activeBranches.whiteVoid ? '#050006' : '#ffcf33', 10, 2, activeBranches.whiteVoid ? '#ffffff' : '#050006');
  const branchText = branchStatusText();
  if (branchText) glowText(branchText, 22, 68, activeBranches.whiteVoid ? '#050006' : '#ff1744', 10, 2, activeBranches.whiteVoid ? '#ffffff' : '#050006');
  ctx.restore();
  ctx.restore();


  if (fateMode) {
    ctx.fillStyle = '#050006';
    ctx.font = 'bold 20px sans-serif';

    for (let y = 34; y < canvas.height; y += 58) {
      const x = ((frame * 5) + y * 3) % (canvas.width + 420) - 420;
      glowText('YOU WILL NOT ESCAPE YOUR FATE', x, y, '#9dff6e', 12, 2);
      glowText('YOU WILL NOT ESCAPE YOUR FATE', x + 420, y, '#9dff6e', 12, 2);
    }
  }

  if (pilotVisible) {
    ctx.font = '34px serif';
    ctx.save();
    const steeringTilt = (keys.ArrowLeft || keys.a ? -0.28 : 0) + (keys.ArrowRight || keys.d ? 0.28 : 0);
    ctx.translate(pilot.x + pilot.w / 2, pilot.y + pilot.h / 2);
    ctx.rotate(-Math.PI / 4 + steeringTilt + (pilotSpin ? frame * 0.28 : 0));
    ctx.filter = 'invert(1) hue-rotate(180deg)';
    glowText(pilot.emoji, -pilot.w / 2, pilot.h / 2, '#ff1744', 24, 6, '#ffffff');
    ctx.restore();
  }

  if (now < blackHoleUntil && pilotVisible) {
    const secondsLeft = Math.max(0, (blackHoleUntil - now) / 1000);
    ctx.save();
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    glowText(`🕳 ${secondsLeft.toFixed(1)}s`, pilot.x + pilot.w / 2, pilot.y + pilot.h + 24, '#b388ff', 16, 3, '#050006');
    ctx.textAlign = 'start';
    ctx.restore();
  }

  if (hitExplosion) {
    const age = now - hitExplosion.born;
    if (age < 650) {
      const t = age / 650;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.translate(hitExplosion.x, hitExplosion.y);
      for (let i = 0; i < 14; i++) {
        const angle = i / 14 * Math.PI * 2 + frame * 0.04;
        const distance = 10 + t * 46;
        glowRect(Math.cos(angle) * distance - 3, Math.sin(angle) * distance - 3, 6 + t * 8, 6 + t * 8, i % 2 ? '#ffea00' : '#ff1744', 22);
      }
      ctx.restore();
    }
  }

  for (const shot of levelLaserShots) {
    const age = now - shot.born - shot.offset * 1000;
    if (age < 0 || age > 420) continue;
    const progress = Math.min(1, age / 140);
    const fade = Math.max(0, 1 - age / 420);
    const endX = shot.x1 + (shot.x2 - shot.x1) * progress;
    const endY = shot.y1 + (shot.y2 - shot.y1) * progress;

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.strokeStyle = '#ff8c00';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#ff8c00';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.moveTo(shot.x1, shot.y1);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.strokeStyle = '#ffea00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(shot.x1, shot.y1);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath();
    ctx.arc(shot.x2, shot.y2, 10 + (1 - fade) * 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const shot of eyeBossShots) {
    const age = now - shot.born;
    const firing = age >= shot.warningMs;
    const charge = Math.max(0, Math.min(1, age / shot.warningMs));
    const warningGreen = Math.round(255 - 90 * charge);
    const warningBlue = Math.round(255 - 255 * charge);
    const warningColor = `rgb(255, ${warningGreen}, ${warningBlue})`;
    const fade = firing ? Math.max(0, 1 - (age - shot.warningMs) / 360) : 0.5 + charge * 0.35;

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.strokeStyle = firing ? '#b388ff' : warningColor;
    ctx.lineWidth = firing ? shot.width : 3 + charge * 3;
    ctx.shadowColor = firing ? '#b388ff' : warningColor;
    ctx.shadowBlur = firing ? 36 : 16 + charge * 20;
    ctx.beginPath();
    ctx.moveTo(shot.x1, shot.y1);
    ctx.lineTo(shot.x2, shot.y2);
    ctx.stroke();
    if (firing) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, shot.width * 0.24);
      ctx.beginPath();
      ctx.moveTo(shot.x1, shot.y1);
      ctx.lineTo(shot.x2, shot.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  for (const meteor of meteors) {
    const flash = 0.55 + Math.abs(Math.sin(frame * 0.16 + meteor.flashOffset)) * 0.45;

    ctx.save();
    ctx.globalAlpha = activeBranches.whiteVoid ? Math.min(1, flash + 0.2) : flash;
    ctx.fillStyle = meteor.color || '#ffffff';
    ctx.font = `bold ${meteor.size}px serif`;
    ctx.translate(meteor.x + meteor.size / 2, meteor.y + meteor.size / 2);
    ctx.rotate(meteor.spin);
    glowText(meteor.symbol, -meteor.size / 2, meteor.size / 2, meteor.color || '#ffffff', 18 + flash * 10, 7, activeBranches.whiteVoid ? '#ffffff' : '#050006');
    ctx.restore();
  }

  if (relic) {
    const blink = 0.45 + Math.abs(Math.sin(frame * 0.18 + relic.flashOffset)) * 0.55;
    ctx.save();
    ctx.globalAlpha = blink;
    ctx.translate(relic.x + relic.size / 2, relic.y + relic.size / 2);
    ctx.rotate(relic.spin);
    ctx.fillStyle = '#050006';
    ctx.beginPath();
    ctx.arc(0, 0, relic.size * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffea00';
    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur = 30 + blink * 8;
    ctx.beginPath();
    ctx.arc(0, 0, relic.size * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#050006';
    ctx.font = `bold ${relic.size * 0.82}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☢', 0, 1);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  if (eyePowerup) {
    const blink = 0.45 + Math.abs(Math.sin(frame * 0.2 + eyePowerup.flashOffset)) * 0.55;
    ctx.save();
    ctx.globalAlpha = blink;
    ctx.font = `${eyePowerup.size}px serif`;
    ctx.translate(eyePowerup.x + eyePowerup.size / 2, eyePowerup.y + eyePowerup.size / 2);
    ctx.rotate(eyePowerup.spin);
    ctx.filter = 'invert(1) hue-rotate(180deg)';
    glowText('👁️', -eyePowerup.size / 2, eyePowerup.size / 2, '#4c7700', 30 + blink * 8, 7);
    ctx.restore();
  }

  if (pentagramPowerup) {
    const blink = 0.45 + Math.abs(Math.sin(frame * 0.22 + pentagramPowerup.flashOffset)) * 0.55;
    ctx.save();
    ctx.globalAlpha = blink;
    ctx.fillStyle = '#050006';
    ctx.font = `bold ${pentagramPowerup.size}px serif`;
    ctx.translate(pentagramPowerup.x + pentagramPowerup.size / 2, pentagramPowerup.y + pentagramPowerup.size / 2);
    ctx.rotate(pentagramPowerup.spin);
    glowText('⛧', -pentagramPowerup.size / 2, pentagramPowerup.size / 2, '#ff1744', 34 + blink * 10, 9, '#ff1744');
    ctx.restore();
  }

  if (blackHolePowerup) {
    const blink = 0.55 + Math.abs(Math.sin(frame * 0.24 + blackHolePowerup.flashOffset)) * 0.45;
    ctx.save();
    ctx.globalAlpha = blink;
    ctx.translate(blackHolePowerup.x + blackHolePowerup.size / 2, blackHolePowerup.y + blackHolePowerup.size / 2);
    ctx.rotate(blackHolePowerup.spin);
    ctx.fillStyle = '#050006';
    ctx.shadowColor = '#b388ff';
    ctx.shadowBlur = 34;
    ctx.beginPath();
    ctx.arc(0, 0, blackHolePowerup.size * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b388ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, blackHolePowerup.size * 0.58, blackHolePowerup.size * 0.22, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, blackHolePowerup.size * 0.34, 0, Math.PI * 1.65);
    ctx.stroke();
    ctx.restore();
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

  if (activeBranches.gameLies && now < gameLiesUntil) {
    const warningText = 'SCORE SAFE   RUNES FRIENDLY   MOUTH CLOSED';
    const flashOn = Math.floor(frame / 6) % 2 === 0;
    const boxWidth = canvas.width - 56;
    const boxHeight = 58;
    const boxX = 28;
    const boxY = 56;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.96;
    ctx.fillStyle = flashOn ? '#ff8c00' : '#050006';
    ctx.strokeStyle = flashOn ? '#050006' : '#ff8c00';
    ctx.lineWidth = 6;
    ctx.shadowColor = flashOn ? '#ffea00' : '#ff8c00';
    ctx.shadowBlur = 26;
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeRect(boxX + 3, boxY + 3, boxWidth - 6, boxHeight - 6);

    ctx.save();
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxWidth, boxHeight);
    ctx.clip();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = flashOn ? '#050006' : '#ff8c00';
    for (let stripeX = boxX - boxHeight; stripeX < boxX + boxWidth + boxHeight; stripeX += 28) {
      ctx.beginPath();
      ctx.moveTo(stripeX, boxY + boxHeight);
      ctx.lineTo(stripeX + 18, boxY + boxHeight);
      ctx.lineTo(stripeX + boxHeight + 18, boxY);
      ctx.lineTo(stripeX + boxHeight, boxY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.globalAlpha = 1;
    ctx.font = '900 26px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    glowText(warningText, canvas.width / 2, boxY + boxHeight / 2, '#ffffff', 30, 7, '#050006');
    ctx.restore();
  }


  ctx.restore();
}

function controlKey(event) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') return event.key;
  const key = event.key.toLowerCase();
  if (key === 'a' || key === 'd' || key === 'w' || key === 's') return key;
  return null;
}

function startGame() {
  getAudioContext();
  if (running) return;
  hideWelcomeHome();
  hideSlimeDrips();
  stopDeadEchoRewrite();
  hitExplosion = null;
  pilotVisible = true;
  resetPowerupTimers();
  running = true;
  paused = false;
  runToken++;
  const token = runToken;
  startBassMusic();
  statusEl.textContent = activeBranches.whiteVoid ? 'White Void mode!' : activeBranches.eyeBoss ? 'The eye watches.' : activeBranches.gameLies ? 'The game lies.' : 'Dodging!';
  animationFrameId = requestAnimationFrame(timestamp => step(timestamp, token));
}

function resetAndStartGame() {
  reset();
  startGame();
}

window.addEventListener('keydown', event => {
  if (event.code === 'Space') {
    if (running) {
      paused = !paused;
      statusEl.textContent = paused ? 'Paused' : 'Dodging!';
    }
    event.preventDefault();
    return;
  }

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
window.addEventListener('resize', scheduleTitleEchoWrap);
resetBtn.addEventListener('click', () => {
  stopBassMusic();
  reset();
});
reset();
