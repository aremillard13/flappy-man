// ============================================================
// FLAP, BABY! — COMPLETE GAME JAVASCRIPT
// ============================================================

// ------------------------------------------------------------
// GAME ELEMENTS
// ------------------------------------------------------------

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const game = document.getElementById("game");

const startScreen = document.getElementById("startScreen");
const gameOver = document.getElementById("gameOver");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const scoreDisplay = document.getElementById("score");
const finalScore = document.getElementById("finalScore");
const scoreMessage = document.getElementById("scoreMessage");

// ------------------------------------------------------------
// LEADERBOARD ELEMENTS
// ------------------------------------------------------------

const highScoreScreen =
  document.getElementById("highScoreScreen");

const leaderboardScreen =
  document.getElementById("leaderboardScreen");

const highScoreValue =
  document.getElementById("highScoreValue");

const initialsInput =
  document.getElementById("initialsInput");

const submitScoreButton =
  document.getElementById("submitScoreButton");

const leaderboardRestartButton =
  document.getElementById("leaderboardRestartButton");

const leaderboard =
  document.getElementById("leaderboard");

// ------------------------------------------------------------
// SUPABASE
// ------------------------------------------------------------

const SUPABASE_URL =
  "https://fnbhfxhdemptcjfhzmxg.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_jaU5GdeNTTwfQks4SDU-Cw_D2kXSW-d";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

// ------------------------------------------------------------
// GAME VARIABLES
// ------------------------------------------------------------

let width = 0;
let height = 0;

let bird;

let pipes = [];

let score = 0;

let playing = false;

let animationFrame = null;

// ------------------------------------------------------------
// GAME SETTINGS
// ------------------------------------------------------------

const GRAVITY = 0.42;
const FLAP = -7;
const SPEED = 2.8;

const PIPE_WIDTH = 70;
const PIPE_GAP = 180;

// Variable obstacle spacing

const MIN_PIPE_DISTANCE = 190;
const MAX_PIPE_DISTANCE = 290;

// ------------------------------------------------------------
// RESIZE
// ------------------------------------------------------------

function resize() {

  const rect = game.getBoundingClientRect();

  width = rect.width;
  height = rect.height;

  canvas.width = width;
  canvas.height = height;

  if (!playing) {
    resetGame();
  }
}

resize();

window.addEventListener(
  "resize",
  resize
);

// ------------------------------------------------------------
// GAME SETUP
// ------------------------------------------------------------

function resetGame() {

  bird = {
    x: width * 0.28,
    y: height * 0.45,
    velocity: 0,
    radius: 18
  };

  pipes = [];

  score = 0;

  scoreDisplay.textContent = "0";

  // First obstacle

  createPipe(width + 100);

  // Second obstacle

  const firstDistance =
    MIN_PIPE_DISTANCE +
    Math.random() *
      (MAX_PIPE_DISTANCE - MIN_PIPE_DISTANCE);

  createPipe(
    width + 100 + firstDistance
  );

  draw();
}

// ------------------------------------------------------------
// CREATE OBSTACLE
// ------------------------------------------------------------

function createPipe(x) {

  const minimum = 90;

  const maximum =
    height - PIPE_GAP - 110;

  const top =
    minimum +
    Math.random() *
      (maximum - minimum);

  const types = [
    "teacup",
    "book",
    "cat"
  ];

  const type =
    types[
      Math.floor(
        Math.random() * types.length
      )
    ];

  pipes.push({
    x: x,
    top: top,
    scored: false,
    type: type
  });
}

// ------------------------------------------------------------
// START GAME
// ------------------------------------------------------------

function startGame() {

  startScreen.classList.add("hidden");

  gameOver.classList.add("hidden");

  highScoreScreen.classList.add("hidden");

  leaderboardScreen.classList.add("hidden");

  resetGame();

  playing = true;

  flap();

  cancelAnimationFrame(animationFrame);

  gameLoop();
}

// ------------------------------------------------------------
// SCORE MESSAGE
// ------------------------------------------------------------

function getScoreMessage() {

  // KEEPING YOUR EXISTING SCORE RANGES

  if (score === 0) {
    return "That's Okay, Big Dawg!";
  }

  else if (score <= 7) {
    return "Yikes...🚩";
  }

  else if (score === 10) {
    return "Okay, not too bad!";
  }

  else if (score <= 14) {
    return "What those fingers do??";
  }

  else {
    return "DADDY 👑";
  }
}

// ------------------------------------------------------------
// END GAME
// ------------------------------------------------------------

function endGame() {

  playing = false;

  finalScore.textContent = score;

  const message =
    getScoreMessage();

  scoreMessage.textContent =
    message;

  // Don't immediately show Game Over.
  // First check whether the score
  // belongs on the leaderboard.

  setTimeout(
    checkHighScore,
    500
  );
}

// ------------------------------------------------------------
// CHECK HIGH SCORE
// ------------------------------------------------------------

async function checkHighScore() {

  try {

    const result =
      await supabaseClient
        .from("leaderboard")
        .select("score")
        .order("score", {
          ascending: false
        })
        .limit(5);

    const data = result.data;
    const error = result.error;

    if (error) {

      console.error(
        "Leaderboard error:",
        error
      );

      // If leaderboard fails,
      // at least show Game Over.

      showNormalGameOver();

      return;
    }

    const qualifies =
      data.length < 5 ||
      score > data[data.length - 1].score;

    // --------------------------------------------------------
    // NEW HIGH SCORE
    // --------------------------------------------------------

    if (qualifies) {

      highScoreValue.textContent =
        score;

      // Skip Game Over entirely.

      gameOver.classList.add("hidden");

      leaderboardScreen.classList.add("hidden");

      highScoreScreen.classList.remove("hidden");

      initialsInput.value = "";

      submitScoreButton.disabled = false;

      submitScoreButton.textContent =
        "SUBMIT";

      setTimeout(
        function() {
          initialsInput.focus();
        },
        100
      );

      return;
    }

    // --------------------------------------------------------
    // NORMAL SCORE
    // --------------------------------------------------------

    showNormalLeaderboard();

  }

  catch (error) {

    console.error(
      "Leaderboard connection error:",
      error
    );

    showNormalGameOver();
  }
}

// ------------------------------------------------------------
// NORMAL SCORE FLOW
// ------------------------------------------------------------

async function showNormalLeaderboard() {

  gameOver.classList.add("hidden");

  highScoreScreen.classList.add("hidden");

  leaderboardScreen.classList.remove("hidden");

  // Show the player's score/message

  finalScore.textContent = score;

  scoreMessage.textContent =
    getScoreMessage();

  await showLeaderboard();
}

// ------------------------------------------------------------
// FALLBACK GAME OVER
// ------------------------------------------------------------

function showNormalGameOver() {

  finalScore.textContent =
    score;

  scoreMessage.textContent =
    getScoreMessage();

  highScoreScreen.classList.add("hidden");

  leaderboardScreen.classList.add("hidden");

  gameOver.classList.remove("hidden");
}

// ------------------------------------------------------------
// SUBMIT HIGH SCORE
// ------------------------------------------------------------

async function submitScore() {

  const initials =
    initialsInput.value
      .trim()
      .toUpperCase();

  if (!/^[A-Z]{3}$/.test(initials)) {

    initialsInput.focus();

    return;
  }

  submitScoreButton.disabled =
    true;

  submitScoreButton.textContent =
    "SAVING...";

  try {

    const result =
      await supabaseClient
        .from("leaderboard")
        .insert([
          {
            initials: initials,
            score: score
          }
        ]);

    const error = result.error;

    if (error) {

      console.error(
        "Score submission error:",
        error
      );

      submitScoreButton.disabled =
        false;

      submitScoreButton.textContent =
        "SUBMIT";

      return;
    }

    // Hide high-score entry

    highScoreScreen.classList.add(
      "hidden"
    );

    // Show leaderboard

    leaderboardScreen.classList.remove(
      "hidden"
    );

    await showLeaderboard(
      initials,
      score
    );

  }

  catch (error) {

    console.error(
      "Score submission error:",
      error
    );

    submitScoreButton.disabled =
      false;

    submitScoreButton.textContent =
      "SUBMIT";
  }
}

// ------------------------------------------------------------
// SHOW LEADERBOARD
// ------------------------------------------------------------

async function showLeaderboard(
  playerInitials = null,
  playerScore = null
) {

  leaderboard.innerHTML =
    '<div class="loading">LOADING...</div>';

  try {

    const result =
      await supabaseClient
        .from("leaderboard")
        .select(
          "initials, score, created_at"
        )
        .order("score", {
          ascending: false
        })
        .order("created_at", {
          ascending: true
        })
        .limit(5);

    const data = result.data;
    const error = result.error;

    if (error) {

      console.error(
        "Leaderboard error:",
        error
      );

      leaderboard.innerHTML =
        '<div class="loading">Leaderboard unavailable</div>';

      return;
    }

    leaderboard.innerHTML = "";

    data.forEach(
      function(entry, index) {

        const row =
          document.createElement("div");

        row.className =
          "leaderboard-row";

        // Highlight current player

        if (
          playerInitials &&
          playerScore !== null &&
          entry.initials === playerInitials &&
          entry.score === playerScore
        ) {

          row.classList.add(
            "player-score"
          );
        }

        const rank =
          document.createElement("span");

        rank.className =
          "leaderboard-rank";

        rank.textContent =
          (index + 1) + ".";

        const name =
          document.createElement("span");

        name.className =
          "leaderboard-name";

        name.textContent =
          entry.initials;

        const points =
          document.createElement("span");

        points.className =
          "leaderboard-score";

        points.textContent =
          entry.score;

        row.appendChild(rank);

        row.appendChild(name);

        row.appendChild(points);

        leaderboard.appendChild(row);
      }
    );

  }

  catch (error) {

    console.error(
      "Leaderboard error:",
      error
    );

    leaderboard.innerHTML =
      '<div class="loading">Leaderboard unavailable</div>';
  }
}

// ------------------------------------------------------------
// INITIALS INPUT
// ------------------------------------------------------------

initialsInput.addEventListener(
  "input",
  function() {

    this.value =
      this.value
        .replace(
          /[^a-zA-Z]/g,
          ""
        )
        .toUpperCase()
        .slice(0, 3);
  }
);

// ------------------------------------------------------------
// ENTER TO SUBMIT
// ------------------------------------------------------------

initialsInput.addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Enter") {

      event.preventDefault();

      submitScore();
    }
  }
);

// ------------------------------------------------------------
// SUBMIT BUTTON
// ------------------------------------------------------------

submitScoreButton.onclick =
  function(event) {

    event.preventDefault();

    event.stopPropagation();

    submitScore();
  };

// ------------------------------------------------------------
// PLAY AGAIN FROM LEADERBOARD
// ------------------------------------------------------------

leaderboardRestartButton.onclick =
  function(event) {

    event.preventDefault();

    event.stopPropagation();

    startGame();
  };

// ------------------------------------------------------------
// FLAP
// ------------------------------------------------------------

function flap() {

  if (!playing) {
    return;
  }

  bird.velocity = FLAP;
}

// ------------------------------------------------------------
// START BUTTON
// ------------------------------------------------------------

startButton.onclick =
  function(event) {

    event.preventDefault();

    event.stopPropagation();

    startGame();
  };

// ------------------------------------------------------------
// RESTART BUTTON
// ------------------------------------------------------------

restartButton.onclick =
  function(event) {

    event.preventDefault();

    event.stopPropagation();

    startGame();
  };

// ------------------------------------------------------------
// MOUSE CONTROLS
// ------------------------------------------------------------

game.onmousedown =
  function(event) {

    if (
      event.target === startButton ||
      event.target === restartButton ||
      event.target === submitScoreButton ||
      event.target === initialsInput ||
      event.target === leaderboardRestartButton
    ) {
      return;
    }

    event.preventDefault();

    flap();
  };

// ------------------------------------------------------------
// TOUCH CONTROLS
// ------------------------------------------------------------

game.ontouchstart =
  function(event) {

    if (
      event.target === startButton ||
      event.target === restartButton ||
      event.target === submitScoreButton ||
      event.target === initialsInput ||
      event.target === leaderboardRestartButton
    ) {
      return;
    }

    event.preventDefault();

    flap();
  };

// ------------------------------------------------------------
// KEYBOARD CONTROLS
// ------------------------------------------------------------

document.onkeydown =
  function(event) {

    if (
      event.code === "Space" ||
      event.code === "ArrowUp"
    ) {

      event.preventDefault();

      if (!playing) {
        startGame();
      }

      else {
        flap();
      }
    }
  };

// ------------------------------------------------------------
// GAME LOOP
// ------------------------------------------------------------

function gameLoop() {

  if (!playing) {
    return;
  }

  update();

  draw();

  animationFrame =
    requestAnimationFrame(
      gameLoop
    );
}

// ------------------------------------------------------------
// UPDATE
// ------------------------------------------------------------

function update() {

  // Bird physics

  bird.velocity += GRAVITY;

  bird.y += bird.velocity;

  // Move obstacles

  for (const pipe of pipes) {

    pipe.x -= SPEED;

    // Score when player passes obstacle

    if (
      !pipe.scored &&
      pipe.x + PIPE_WIDTH < bird.x
    ) {

      pipe.scored = true;

      score++;

      scoreDisplay.textContent =
        score;
    }
  }

  // Remove old obstacle

  if (
    pipes.length > 0 &&
    pipes[0].x < -PIPE_WIDTH
  ) {

    pipes.shift();

    const last =
      pipes[pipes.length - 1];

    const nextDistance =
      MIN_PIPE_DISTANCE +
      Math.random() *
        (MAX_PIPE_DISTANCE - MIN_PIPE_DISTANCE);

    createPipe(
      last.x + nextDistance
    );
  }

  checkCollision();
}

// ------------------------------------------------------------
// COLLISION
// ------------------------------------------------------------

function checkCollision() {

  // Ceiling / ground

  if (
    bird.y - bird.radius <= 0 ||
    bird.y + bird.radius >= height - 40
  ) {

    endGame();

    return;
  }

  // Obstacles

  for (const pipe of pipes) {

    const overlapsX =
      bird.x + bird.radius > pipe.x &&
      bird.x - bird.radius <
        pipe.x + PIPE_WIDTH;

    if (!overlapsX) {
      continue;
    }

    const hitsTop =
      bird.y - bird.radius <
      pipe.top;

    const hitsBottom =
      bird.y + bird.radius >
      pipe.top + PIPE_GAP;

    if (hitsTop || hitsBottom) {

      endGame();

      return;
    }
  }
}

// ------------------------------------------------------------
// DRAW EVERYTHING
// ------------------------------------------------------------

function draw() {

  ctx.clearRect(
    0,
    0,
    width,
    height
  );

  drawSky();

  drawClouds();

  drawMountains();

  drawPipes();

  drawGround();

  drawBird();
}

// ------------------------------------------------------------
// SKY
// ------------------------------------------------------------

function drawSky() {

  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      0,
      height
    );

  gradient.addColorStop(
    0,
    "#82d8f4"
  );

  gradient.addColorStop(
    1,
    "#e7f9ff"
  );

  ctx.fillStyle =
    gradient;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );
}

// ------------------------------------------------------------
// CLOUDS
// ------------------------------------------------------------

function drawClouds() {

  ctx.fillStyle =
    "rgba(255,255,255,0.75)";

  drawCloud(
    75,
    95,
    0.9
  );

  drawCloud(
    width - 110,
    170,
    0.65
  );

  drawCloud(
    width * 0.55,
    65,
    0.45
  );
}

function drawCloud(
  x,
  y,
  scale
) {

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    20 * scale,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x + 25 * scale,
    y - 8 * scale,
    28 * scale,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x + 55 * scale,
    y,
    20 * scale,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

// ------------------------------------------------------------
// MOUNTAINS
// ------------------------------------------------------------

function drawMountains() {

  // Far mountains

  ctx.fillStyle =
    "#a7c9c9";

  ctx.beginPath();

  ctx.moveTo(
    0,
    height - 125
  );

  ctx.lineTo(
    width * 0.22,
    height - 280
  );

  ctx.lineTo(
    width * 0.42,
    height - 125
  );

  ctx.lineTo(
    width * 0.62,
    height - 250
  );

  ctx.lineTo(
    width * 0.88,
    height - 125
  );

  ctx.lineTo(
    width,
    height - 180
  );

  ctx.lineTo(
    width,
    height
  );

  ctx.lineTo(
    0,
    height
  );

  ctx.closePath();

  ctx.fill();

  // Near mountains

  ctx.fillStyle =
    "#83b5a7";

  ctx.beginPath();

  ctx.moveTo(
    0,
    height - 80
  );

  ctx.lineTo(
    width * 0.28,
    height - 220
  );

  ctx.lineTo(
    width * 0.48,
    height - 80
  );

  ctx.lineTo(
    width * 0.72,
    height - 200
  );

  ctx.lineTo(
    width,
    height - 75
  );

  ctx.lineTo(
    width,
    height
  );

  ctx.lineTo(
    0,
    height
  );

  ctx.closePath();

  ctx.fill();

  // Snow caps

  ctx.fillStyle =
    "rgba(255,255,255,0.7)";

  ctx.beginPath();

  ctx.moveTo(
    width * 0.22,
    height - 280
  );

  ctx.lineTo(
    width * 0.16,
    height - 235
  );

  ctx.lineTo(
    width * 0.20,
    height - 245
  );

  ctx.lineTo(
    width * 0.25,
    height - 245
  );

  ctx.closePath();

  ctx.fill();

  ctx.beginPath();

  ctx.moveTo(
    width * 0.62,
    height - 250
  );

  ctx.lineTo(
    width * 0.57,
    height - 210
  );

  ctx.lineTo(
    width * 0.62,
    height - 222
  );

  ctx.lineTo(
    width * 0.67,
    height - 210
  );

  ctx.closePath();

  ctx.fill();
}

// ------------------------------------------------------------
// OBSTACLES
// ------------------------------------------------------------

function drawPipes() {

  for (const pipe of pipes) {

    drawObstacle(
      pipe.x,
      pipe.top,
      pipe.type,
      true
    );

    drawObstacle(
      pipe.x,
      pipe.top + PIPE_GAP,
      pipe.type,
      false
    );
  }
}

// ------------------------------------------------------------
// OBSTACLE DRAWING
// ------------------------------------------------------------

function drawObstacle(
  x,
  y,
  type,
  top
) {

  const centerX =
    x + PIPE_WIDTH / 2;

  // ----------------------------------------------------------
  // TEACUP
  // ----------------------------------------------------------

  if (type === "teacup") {

    const cupY =
      top ? y - 48 : y;

    ctx.save();

    ctx.translate(
      centerX,
      cupY
    );

    // Saucer

    ctx.fillStyle =
      "#e8b7a5";

    ctx.strokeStyle =
      "#9b6555";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.ellipse(
      0,
      48,
      35,
      7,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.stroke();

    // Cup

    ctx.fillStyle =
      "#fff8ef";

    ctx.beginPath();

    ctx.moveTo(-27, 0);

    ctx.lineTo(27, 0);

    ctx.lineTo(21, 40);

    ctx.quadraticCurveTo(
      0,
      50,
      -21,
      40
    );

    ctx.closePath();

    ctx.fill();

    ctx.stroke();

    // Rim

    ctx.fillStyle =
      "#f2d2c5";

    ctx.beginPath();

    ctx.ellipse(
      0,
      0,
      27,
      7,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.stroke();

    // Handle

    ctx.strokeStyle =
      "#9b6555";

    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.arc(
      27,
      20,
      12,
      -Math.PI / 2,
      Math.PI / 2
    );

    ctx.stroke();

    // Heart

    ctx.fillStyle =
      "#d47b86";

    ctx.beginPath();

    ctx.moveTo(0, 20);

    ctx.bezierCurveTo(
      -8,
      12,
      -14,
      20,
      0,
      32
    );

    ctx.bezierCurveTo(
      14,
      20,
      8,
      12,
      0,
      20
    );

    ctx.fill();

    // Steam

    ctx.strokeStyle =
      "rgba(255,255,255,0.9)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(-8, -8);

    ctx.quadraticCurveTo(
      -15,
      -20,
      -7,
      -30
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(8, -8);

    ctx.quadraticCurveTo(
      15,
      -20,
      7,
      -30
    );

    ctx.stroke();

    ctx.restore();

    return;
  }

  // ----------------------------------------------------------
  // BOOK
  // ----------------------------------------------------------

  if (type === "book") {

    const bookY =
      top ? y - 60 : y;

    ctx.save();

    ctx.translate(
      centerX,
      bookY
    );

    // Cover

    ctx.fillStyle =
      "#8064a8";

    ctx.strokeStyle =
      "#4f3c6b";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.roundRect(
      -31,
      0,
      62,
      58,
      4
    );

    ctx.fill();

    ctx.stroke();

    // Pages

    ctx.fillStyle =
      "#fff8e8";

    ctx.beginPath();

    ctx.roundRect(
      -25,
      5,
      50,
      48,
      2
    );

    ctx.fill();

    // Spine

    ctx.strokeStyle =
      "#d7c4ed";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.moveTo(0, 5);

    ctx.lineTo(0, 53);

    ctx.stroke();

    // Page lines

    ctx.strokeStyle =
      "#d6cbb9";

    ctx.lineWidth = 1;

    for (
      let i = 0;
      i < 4;
      i++
    ) {

      ctx.beginPath();

      ctx.moveTo(
        -20,
        15 + i * 8
      );

      ctx.lineTo(
        -4,
        15 + i * 8
      );

      ctx.stroke();

      ctx.beginPath();

      ctx.moveTo(
        5,
        15 + i * 8
      );

      ctx.lineTo(
        20,
        15 + i * 8
      );

      ctx.stroke();
    }

    // Bookmark

    ctx.fillStyle =
      "#d47b86";

    ctx.fillRect(
      15,
      0,
      6,
      22
    );

    ctx.beginPath();

    ctx.moveTo(15, 22);

    ctx.lineTo(18, 18);

    ctx.lineTo(21, 22);

    ctx.closePath();

    ctx.fill();

    ctx.restore();

    return;
  }

  // ----------------------------------------------------------
  // CAT
  // ----------------------------------------------------------

  if (type === "cat") {

    const cy =
      top ? y - 34 : y + 34;

    ctx.save();

    ctx.translate(
      centerX,
      cy
    );

    // Head

    ctx.fillStyle =
      "#d49b6a";

    ctx.strokeStyle =
      "#80573e";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      27,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.stroke();

    // Left ear

    ctx.beginPath();

    ctx.moveTo(-20, -17);

    ctx.lineTo(-27, -43);

    ctx.lineTo(-5, -28);

    ctx.closePath();

    ctx.fill();

    ctx.stroke();

    // Right ear

    ctx.beginPath();

    ctx.moveTo(20, -17);

    ctx.lineTo(27, -43);

    ctx.lineTo(5, -28);

    ctx.closePath();

    ctx.fill();

    ctx.stroke();

    // Inner ears

    ctx.fillStyle =
      "#e8a5a8";

    ctx.beginPath();

    ctx.moveTo(-20, -24);

    ctx.lineTo(-24, -35);

    ctx.lineTo(-12, -27);

    ctx.closePath();

    ctx.fill();

    ctx.beginPath();

    ctx.moveTo(20, -24);

    ctx.lineTo(24, -35);

    ctx.lineTo(12, -27);

    ctx.closePath();

    ctx.fill();

    // Eyes

    ctx.fillStyle =
      "#3a3028";

    ctx.beginPath();

    ctx.ellipse(
      -9,
      -3,
      4,
      6,
      0,
      0,
      Math.PI * 2
    );

    ctx.ellipse(
      9,
      -3,
      4,
      6,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    // Nose

    ctx.fillStyle =
      "#d47b86";

    ctx.beginPath();

    ctx.moveTo(0, 5);

    ctx.lineTo(-4, 9);

    ctx.lineTo(4, 9);

    ctx.closePath();

    ctx.fill();

    // Mouth

    ctx.strokeStyle =
      "#80573e";

    ctx.lineWidth = 1.5;

    ctx.beginPath();

    ctx.moveTo(0, 9);

    ctx.lineTo(-5, 14);

    ctx.moveTo(0, 9);

    ctx.lineTo(5, 14);

    ctx.stroke();

    // Whiskers

    ctx.beginPath();

    ctx.moveTo(-8, 10);

    ctx.lineTo(-30, 6);

    ctx.moveTo(-8, 14);

    ctx.lineTo(-30, 17);

    ctx.moveTo(8, 10);

    ctx.lineTo(30, 6);

    ctx.moveTo(8, 14);

    ctx.lineTo(30, 17);

    ctx.stroke();

    ctx.restore();
  }
}

// ------------------------------------------------------------
// FLYING MAN
// ------------------------------------------------------------

function drawBird() {

  ctx.save();

  ctx.translate(
    bird.x,
    bird.y
  );

  const rotation =
    Math.max(
      -0.45,
      Math.min(
        0.65,
        bird.velocity * 0.05
      )
    );

  ctx.rotate(rotation);

  // Arms

  ctx.fillStyle =
    "#6b7fa8";

  ctx.strokeStyle =
    "#465575";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.ellipse(
    -20,
    1,
    12,
    5,
    -0.4,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.stroke();

  ctx.beginPath();

  ctx.ellipse(
    20,
    1,
    12,
    5,
    0.4,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.stroke();

  // Body

  ctx.fillStyle =
    "#5d739b";

  ctx.strokeStyle =
    "#3f4f6d";

  ctx.lineWidth = 2.5;

  ctx.beginPath();

  ctx.roundRect(
    -13,
    -2,
    26,
    28,
    8
  );

  ctx.fill();

  ctx.stroke();

  // Shirt detail

  ctx.strokeStyle =
    "#d9e2f2";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(0, 2);

  ctx.lineTo(0, 22);

  ctx.stroke();

  // Head

  ctx.fillStyle =
    "#f1c7a5";

  ctx.strokeStyle =
    "#9b6b50";

  ctx.lineWidth = 2.5;

  ctx.beginPath();

  ctx.arc(
    0,
    -17,
    14,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.stroke();

  // Hair

  ctx.fillStyle =
    "#5a3d2e";

  ctx.beginPath();

  ctx.arc(
    0,
    -25,
    13,
    Math.PI,
    Math.PI * 2
  );

  ctx.fill();

  // Hair tufts

  ctx.beginPath();

  ctx.moveTo(-11, -25);

  ctx.lineTo(-15, -31);

  ctx.lineTo(-7, -27);

  ctx.closePath();

  ctx.fill();

  ctx.beginPath();

  ctx.moveTo(11, -25);

  ctx.lineTo(15, -31);

  ctx.lineTo(7, -27);

  ctx.closePath();

  ctx.fill();

  // Eyes

  ctx.fillStyle =
    "#342a25";

  ctx.beginPath();

  ctx.arc(
    -5,
    -18,
    2,
    0,
    Math.PI * 2
  );

  ctx.arc(
    5,
    -18,
    2,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Nose

  ctx.fillStyle =
    "#d59a7d";

  ctx.beginPath();

  ctx.arc(
    0,
    -14,
    2,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Smile

  ctx.strokeStyle =
    "#704d40";

  ctx.lineWidth = 1.5;

  ctx.beginPath();

  ctx.arc(
    0,
    -12,
    5,
    0.2,
    Math.PI - 0.2
  );

  ctx.stroke();

  // Legs

  ctx.strokeStyle =
    "#3d4352";

  ctx.lineWidth = 5;

  ctx.lineCap = "round";

  ctx.beginPath();

  ctx.moveTo(-6, 24);

  ctx.lineTo(-10, 34);

  ctx.stroke();

  ctx.beginPath();

  ctx.moveTo(6, 24);

  ctx.lineTo(10, 34);

  ctx.stroke();

  // Shoes

  ctx.fillStyle =
    "#3b302b";

  ctx.beginPath();

  ctx.ellipse(
    -12,
    35,
    7,
    4,
    0,
    0,
    Math.PI * 2
  );

  ctx.ellipse(
    12,
    35,
    7,
    4,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();
}

// ------------------------------------------------------------
// GROUND
// ------------------------------------------------------------

function drawGround() {

  ctx.fillStyle =
    "#91cf5b";

  ctx.fillRect(
    0,
    height - 40,
    width,
    40
  );

  ctx.fillStyle =
    "#6fac45";

  ctx.fillRect(
    0,
    height - 40,
    width,
    6
  );
}

// ------------------------------------------------------------
// INITIAL DRAW
// ------------------------------------------------------------

resetGame();

