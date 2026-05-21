// ======== Simple adaptive lesson engine ========
const state = {
  mode: "Math", // "Math" | "Programming"
  topic: "Addition",
  score: 0,
  total: 0,
  streak: 0,
  lastFingers: -1,
  lastTriggerAt: 0,
};

const el = {
  video: document.getElementById("video"),
  canvas: document.getElementById("canvas"),
  fingers: document.getElementById("fingers"),
  mode: document.getElementById("mode"),
  hint: document.getElementById("hint"),
  topicLine: document.getElementById("topicLine"),
  questionText: document.getElementById("questionText"),
  resultText: document.getElementById("resultText"),
  ans: [
    document.getElementById("ans0"),
    document.getElementById("ans1"),
    document.getElementById("ans2"),
    document.getElementById("ans3"),
  ]
};

function setResult(msg, ok = true) {
  el.resultText.textContent = msg;
  el.resultText.classList.remove("ok", "bad");
  el.resultText.classList.add(ok ? "ok" : "bad");
}

function setTopicAndQuestion(topic, question) {
  state.topic = topic;
  el.topicLine.textContent = `Topic: ${topic}`;
  el.questionText.textContent = question;
}

// ------------- Question generators -------------
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeChoices(correct, wrongs) {
  // create 4 choices A-D
  const choices = [correct, ...wrongs].slice(0, 4);
  // shuffle with indices
  const paired = choices.map((v, i) => ({ v, isCorrect: v === correct && i === 0 ? true : v === correct }));
  // simpler: compute correct index by value match
  // we'll instead do a robust approach:
  const shuffled = [...choices].sort(() => Math.random() - 0.5);
  const correctIndex = shuffled.findIndex(v => v === correct);
  return { shuffled, correctIndex };
}

// Keep "AI-like" adaptation: if user is wrong, reduce difficulty; if right, increase.
function difficulty() {
  // simple: 1..5
  const base = 1 + Math.floor(state.score / 3);
  const streakBoost = Math.min(3, Math.floor(state.streak / 2));
  return Math.min(5, Math.max(1, base + streakBoost));
}

let current = {
  correctIndex: 0,
  answerValues: [],
};

function loadMathQuestion() {
  const d = difficulty();
  // choose topic
  const topics = ["Addition", "Subtraction", "Multiplication"];
  const topic = topics[(d - 1) % topics.length];

  if (topic === "Addition") {
    const a = randInt(0, 5 + d * 2);
    const b = randInt(0, 5 + d * 2);
    const correct = a + b;
    const wrongs = [
      correct + randInt(-3 - d, -1),
      correct + randInt(1, 3 + d),
      correct + randInt(-2, 2),
    ].map(x => x);

    // Ensure uniqueness
    const unique = Array.from(new Set([correct, ...wrongs])).filter(v => Number.isFinite(v));
    while (unique.length < 4) unique.push(correct + randInt(2, 12));
    const picked = unique.slice(0, 4);
    const { shuffled, correctIndex } = makeChoices(correct, picked.filter(v => v !== correct).slice(0, 3));
    current.correctIndex = correctIndex;
    current.answerValues = shuffled;

    setTopicAndQuestion("Addition", `${a} + ${b} = ?`);
  }

  if (topic === "Subtraction") {
    const a = randInt(5 + d, 12 + d * 3);
    const b = randInt(0, Math.min(a, 4 + d * 2));
    const correct = a - b;
    const wrongs = [
      correct + randInt(-3 - d, -1),
      correct + randInt(1, 3 + d),
      correct + randInt(-2, 2),
    ];
    const unique = Array.from(new Set([correct, ...wrongs])).filter(v => Number.isFinite(v));
    while (unique.length < 4) unique.push(correct + randInt(2, 12));
    const picked = unique.slice(0, 4);

    const { shuffled, correctIndex } = makeChoices(correct, picked.filter(v => v !== correct).slice(0, 3));
    current.correctIndex = correctIndex;
    current.answerValues = shuffled;

    setTopicAndQuestion("Subtraction", `${a} - ${b} = ?`);
  }

  if (topic === "Multiplication") {
    const a = randInt(1, 3 + d);
    const b = randInt(1, 3 + d);
    const correct = a * b;
    const wrongs = [
      correct + randInt(-3 - d, -1),
      correct + randInt(1, 3 + d),
      correct + randInt(-2, 2),
    ];
    const unique = Array.from(new Set([correct, ...wrongs])).filter(v => Number.isFinite(v));
    while (unique.length < 4) unique.push(correct + randInt(2, 15));
    const picked = unique.slice(0, 4);

    const { shuffled, correctIndex } = makeChoices(correct, picked.filter(v => v !== correct).slice(0, 3));
    current.correctIndex = correctIndex;
    current.answerValues = shuffled;

    setTopicAndQuestion("Multiplication", `${a} × ${b} = ?`);
  }

  el.hint.textContent = `Choose answer by showing 1–4 fingers (A–D).`;
  renderAnswers();
}

function loadProgrammingQuestion() {
  // "Programming teaching": multiple-choice fundamentals (variables, loops, condition)
  const d = difficulty();
  const topics = ["Variables", "If/Else", "Loops", "Functions"];
  const topic = topics[(d - 1) % topics.length];

  if (topic === "Variables") {
    setTopicAndQuestion("Variables", `What is the correct way to declare a variable in JavaScript?`);
    const correct = "let x = 5;";
    const wrongs = ["x == 5;", "var x", "int x = 5;"];
    const choices = [correct, ...wrongs].sort(() => Math.random() - 0.5);
    current.correctIndex = choices.indexOf(correct);
    current.answerValues = choices;
  } else if (topic === "If/Else") {
    setTopicAndQuestion("If/Else", `If temperature > 30, which condition should you write?`);
    const correct = "if (temp > 30) { }";
    const wrongs = ["if (temp = 30) { }", "if (temp < 30) { }", "if temp > 30 { }"];
    const choices = [correct, ...wrongs].sort(() => Math.random() - 0.5);
    current.correctIndex = choices.indexOf(correct);
    current.answerValues = choices;
  } else if (topic === "Loops") {
    setTopicAndQuestion("Loops", `Which loop is best for repeating a known number of times?`);
    const correct = "for loop";
    const wrongs = ["while loop", "if loop", "switch loop"];
    const choices = [correct, ...wrongs].sort(() => Math.random() - 0.5);
    current.correctIndex = choices.indexOf(correct);
    current.answerValues = choices;
  } else {
    setTopicAndQuestion("Functions", `A function is used to...`);
    const correct = "group reusable code";
    const wrongs = ["store only numbers", "run a single statement", "replace variables"];
    const choices = [correct, ...wrongs].sort(() => Math.random() - 0.5);
    current.correctIndex = choices.indexOf(correct);
    current.answerValues = choices;
  }

  el.hint.textContent = `Choose A–D with 1–4 fingers. Use 5 fingers to switch modes.`;
  renderAnswers();
}

function renderAnswers() {
  for (let i = 0; i < 4; i++) {
    el.ans[i].textContent = `A${i}: ${current.answerValues[i]}`;
  }
}

function switchMode() {
  state.mode = (state.mode === "Math") ? "Programming" : "Math";
  el.mode.textContent = state.mode;
  setResult(`Switched to ${state.mode}.`, true);
  loadQuestion();
}

function loadQuestion() {
  if (state.mode === "Math") loadMathQuestion();
  else loadProgrammingQuestion();
}

async function saveProgress() {
  // PHP will append/update progress in progress.json
  const payload = {
    mode: state.mode,
    score: state.score,
    total: state.total
  };
  try {
    await fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    // not fatal
  }
}

// ------------- Answer handling -------------
async function chooseAnswerByIndex(i) {
  const correct = (i === current.correctIndex);
  state.total += 1;

  if (correct) {
    state.score += 1;
    state.streak += 1;
    setResult(`✅ Correct! (${state.mode})`, true);
    el.hint.textContent = "Nice! Show 0 fingers for next question.";
  } else {
    state.streak = 0;
    setResult(`❌ Wrong. Correct option was ${letterFromIndex(current.correctIndex)}.`, false);
    el.hint.textContent = "Try again next question (show 0).";
  }

  await saveProgress();
  // After a short delay, load next question automatically for better flow
  setTimeout(() => loadQuestion(), 900);
}

function letterFromIndex(i) {
  return ["A","B","C","D"][i] ?? "?";
}

// ------------- Gesture -> triggers -------------
function mapFingersToAction(fingers) {
  // 0 = next, 1-4 = answers A-D, 5 = switch mode
  if (fingers === 0) return { type: "next" };
  if (fingers >= 1 && fingers <= 4) return { type: "choose", index: fingers - 1 };
  if (fingers === 5) return { type: "switch" };
  return { type: "none" };
}

function handleGestureFingers(fingers) {
  const now = Date.now();
  // debounce to avoid repeated triggers
  if (fingers === state.lastFingers && now - state.lastTriggerAt < 900) return;

  // Only trigger when it changes or enough time passed
  if (now - state.lastTriggerAt < 900) return;

  state.lastFingers = fingers;
  state.lastTriggerAt = now;

  const action = mapFingersToAction(fingers);
  if (action.type === "next") {
    setResult("➡️ Next question", true);
    loadQuestion();
    return;
  }
  if (action.type === "switch") {
    switchMode();
    return;
  }
  if (action.type === "choose") {
    chooseAnswerByIndex(action.index);
    return;
  }
}

// ======== MediaPipe Hands Finger Counting ========
// This is a practical “simple” finger counter.
// Works best when your palm faces the camera.

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

hands.onResults(results => {
  let count = 0;

  // Draw landmarks
  const canvasCtx = el.canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = el.canvas.getBoundingClientRect();
  el.canvas.width = rect.width * dpr;
  el.canvas.height = rect.height * dpr;
  canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  canvasCtx.clearRect(0, 0, rect.width, rect.height);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    el.fingers.textContent = "-";
    return;
  }

  const landmarks = results.multiHandLandmarks[0];

  // finger logic:
  // Index/ Middle/ Ring/ Pinky: tip is above (smaller y) than PIP joint => finger up
  // Thumb: approximate by x comparison depending on hand orientation.
  const lm = (i) => landmarks[i];

  const tips = {
    index: 8,
    middle: 12,
    ring: 16,
    pinky: 20,
  };
  const pips = {
    index: 6,
    middle: 10,
    ring: 14,
    pinky: 18,
  };

  // count 4 fingers (excluding thumb for simplicity first)
  for (const name of ["index", "middle", "ring", "pinky"]) {
    const tip = lm(tips[name]);
    const pip = lm(pips[name]);
    if (tip.y < pip.y) count++;
  }

  // thumb: compare tip.x to ip.x depending on whether thumb is to left/right of hand
  // Using heuristic: if thumb tip is far enough outward.
  const thumbTip = lm(4);
  const thumbIp = lm(3);

  // If thumbTip.x < thumbIp.x then thumb likely open for one mirrored orientation.
  // MediaPipe can be mirrored by CSS/video; so do a relative heuristic:
  // Compare thumb tip with index MCP x (6) as baseline.
  const indexMcp = lm(5);
  const thumbUp = (thumbTip.x < indexMcp.x && thumbTip.x < thumbIp.x) ||
                  (thumbTip.x > indexMcp.x && thumbTip.x > thumbIp.x);

  if (thumbUp) count++;

  // clamp 0..5
  count = Math.max(0, Math.min(5, count));

  el.fingers.textContent = String(count);

  // Draw landmarks (optional)
  if (results.multiHandLandmarks) {
    for (const hand of results.multiHandLandmarks) {
      const draw = window;
      // Use global drawing utils if present
      if (window.drawConnectors && window.drawLandmarks) {
        window.drawConnectors(canvasCtx, hand, window.HAND_CONNECTIONS,
          { color: "#5dd6ff", lineWidth: 2 });
        window.drawLandmarks(canvasCtx, hand,
          { color: "#e7efff", lineWidth: 1 });
      }
    }
  }

  handleGestureFingers(count);
});

// Start camera
async function startCamera() {
  const cam = new Camera(el.video, {
    onFrame: async () => {},
    width: 640,
    height: 480
  });

  // Hook hands to camera frames
  cam.start();

  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  el.video.srcObject = stream;
  await el.video.play();

  // MediaPipe expects results per frame
  const loop = async () => {
    await hands.send({ image: el.video });
    requestAnimationFrame(loop);
  };
  loop();
}

// Init
el.mode.textContent = state.mode;
el.resultText.textContent = "Initializing camera + gestures...";

startCamera().catch(() => {
  setResult("Camera permission denied or unavailable.", false);
});

el.ans.forEach((btn, i) => {
  btn.addEventListener("click", () => chooseAnswerByIndex(i));
});

// Also allow click commands (optional)
document.addEventListener("keydown", (e) => {
  if (e.key === "5") switchMode();
  if (e.key === "0") loadQuestion();
  if (["1","2","3","4"].includes(e.key)) chooseAnswerByIndex(parseInt(e.key) - 1);
});

loadQuestion();