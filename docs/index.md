<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bio's Big Bouncing Rocket</title>
  <link rel="stylesheet" href="game.css" />
</head>
<body>
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">Biohazardous's cosmic horror rocket trial</p>
      <h1>Bio's Big Bouncing Rocket</h1>
      <p id="tagline">The void is hungry. Keep the rocket out of the red cosmic mess.</p>
    </section>

    <section class="game-card" aria-label="Cosmic horror Dodge the Meteors game">
      <canvas id="game" width="720" height="420"></canvas>
      <div class="hud">
        <span>Score: <strong id="score">0</strong></span>
        <span>Level: <strong id="level">1</strong></span>
        <span>Vibe: <strong>Cosmic Horror</strong></span>
        <span>Status: <strong id="status">Unfinished</strong></span>
      </div>
      <div class="controls">
        <button id="start">Start rocket run</button>
        <button id="reset">Reset</button>
      </div>
      <p class="hint">Cosmic horror mode: use arrow keys or WASD to steer through the cursed stars.</p>
    </section>

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
