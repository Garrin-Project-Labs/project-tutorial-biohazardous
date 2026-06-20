<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>You can not run from your sins. They watch.</title>
  <link rel="stylesheet" href="game.css" />
</head>
<body>
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">Biohazardous's cosmic horror rocket trial</p>
      <h1>You can not run from your sins. They watch.</h1>
      <p id="tagline">As you walk through the shadow of the valley of death</p>
    </section>

    <div class="game-layout">
      <aside class="instructions" aria-label="Game instructions">
        <h2>How to survive</h2>
        <p>Press Prepare To Die, then use ←/→ or A/D to dodge.</p>
        <p>Every 13 dodges wakes a faster level.</p>
        <p>Every 3 level-ups rotates the game screen.</p>
        <p>Green relics add 13 score and reveal fate text.</p>
        <p>Floating eyes reset the speed back to level 1.</p>
        <p>Pentagrams appear after rotation and reset the canvas.</p>
      </aside>

      <section class="game-card" aria-label="Cosmic horror Dodge the Meteors game">
        <canvas id="game" width="720" height="420"></canvas>
        <div class="hud">
          <span>Score: <strong id="score">0</strong></span>
          <span>Level: <strong id="level">1</strong></span>
          <span>Vibe: <strong>Cosmic Horror</strong></span>
          <span>Status: <strong id="status">Unfinished</strong></span>
        </div>
        <div class="controls">
          <button id="start">Prepare To Die</button>
          <button id="reset">Reset</button>
        </div>
        <p class="hint">Cosmic horror mode: green relics add 13 score, every 13 dodges levels you up, and every 3 level-ups rotates the game screen.</p>
      </section>
    </div>

    <section class="quests">
      <h2>Tutorial quests</h2>
      <ol>
        <li><strong>Make it yours:</strong> replace the placeholder title, pilot name, and welcome text.</li>
        <li><strong>Choose controls:</strong> add the movement keys so the pilot can dodge.</li>
        <li><strong>Pick the vibe:</strong> choose colors, emoji, or background style.</li>
        <li><strong>Add a twist:</strong> add a bonus, shield, level rule, or another tiny mechanic.</li>
        <li><strong>Make your own quest:</strong> choose one thing you want to improve.</li>
      </ol>
      <p>Back in Discord, ask the bot: <code>@G-Claw-Bot give me a quest</code>.</p>
    </section>
  </main>
  <script src="game.js"></script>
</body>
</html>
