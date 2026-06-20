<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Untitled Meteor Game</title>
  <link rel="stylesheet" href="game.css" />
</head>
<body>
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">Biohazardous's first OpenClaw project</p>
      <h1>Untitled Meteor Game</h1>
      <p id="tagline">This tiny starter game is missing the fun parts. Your quests will make it yours.</p>
    </section>

    <section class="game-card" aria-label="Unfinished Dodge the Meteors starter game">
      <canvas id="game" width="720" height="420"></canvas>
      <div class="hud">
        <span>Score: <strong id="score">0</strong></span>
        <span>Level: <strong id="level">1</strong></span>
        <span>Status: <strong id="status">Unfinished</strong></span>
      </div>
      <div class="controls">
        <button id="start">Start unfinished game</button>
        <button id="reset">Reset</button>
      </div>
      <p class="hint">Controls are not built yet. Quest 2 will teach the pilot how to move.</p>
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
