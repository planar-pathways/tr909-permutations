// ----------------------------
// CONFIGURATION
// ----------------------------

const NUM_SOUNDS = 11;
const STEPS_PER_PATTERN = 11;
const STEP_DURATION = 0.125; // seconds
const LOOKAHEAD = 0.1;       // seconds

// ----------------------------
// AUDIO SETUP
// ----------------------------

let audioCtx = null;
let buffers = [];
let isPlaying = false;

// ----------------------------
// PERMUTATION STATE
// ----------------------------

let permutation = Array.from({ length: NUM_SOUNDS }, (_, i) => i);
let permutationIndex = 0;

// ----------------------------
// UI
// ----------------------------

const startBtn = document.getElementById("startBtn");
const counterEl = document.getElementById("counter");

startBtn.addEventListener("click", async () => {
  if (!audioCtx) {
    await initAudio();
  }

  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

 if (!isPlaying) {
  // ---- PLAY ----
  isPlaying = true;
  startBtn.textContent = "STOP";

  // hard reset scheduler state
  nextEventTime = 0;
  stepIndex = 0;

  startScheduler();
} else {
  // ---- STOP ----
  isPlaying = false;
  startBtn.textContent = "PLAY";
  stopScheduler();
}
});

// ----------------------------
// INITIALIZATION
// ----------------------------

async function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const promises = [];

  for (let i = 1; i <= NUM_SOUNDS; i++) {
    const n = String(i).padStart(2, "0");
    const url = `samples/${n}.wav`;

    promises.push(
      fetch(url)
        .then(res => res.arrayBuffer())
        .then(data => audioCtx.decodeAudioData(data))
    );
  }

  buffers = await Promise.all(promises);
}

// ----------------------------
// PERMUTATION LOGIC
// ----------------------------

function nextPermutation(arr) {
  let i = arr.length - 2;
  while (i >= 0 && arr[i] >= arr[i + 1]) i--;

  if (i < 0) {
    arr.reverse();
    return false;
  }

  let j = arr.length - 1;
  while (arr[j] <= arr[i]) j--;

  [arr[i], arr[j]] = [arr[j], arr[i]];

  let left = i + 1;
  let right = arr.length - 1;
  while (left < right) {
    [arr[left], arr[right]] = [arr[right], arr[left]];
    left++;
    right--;
  }

  return true;
}

// ----------------------------
// SCHEDULER (background-safe)
// ----------------------------

let nextEventTime = 0;
let stepIndex = 0;
let schedulerTimer = null;

function scheduler() {
  if (!isPlaying) return;

  const now = audioCtx.currentTime;

  if (nextEventTime === 0) {
    nextEventTime = now + 0.05;
  }

  while (nextEventTime < now + LOOKAHEAD) {
    scheduleStep(stepIndex, nextEventTime);

    stepIndex++;

    if (stepIndex >= STEPS_PER_PATTERN) {
      stepIndex = 0;
      advancePermutation();
    }

    nextEventTime += STEP_DURATION;
  }
}

function startScheduler() {
  if (schedulerTimer !== null) return;

  // run scheduler regularly, even when tab is unfocused
  schedulerTimer = setInterval(scheduler, 25);
}

function stopScheduler() {
  if (schedulerTimer !== null) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  nextEventTime = 0;
}

function scheduleStep(step, time) {
  const soundIndex = permutation[step];
  const source = audioCtx.createBufferSource();
  source.buffer = buffers[soundIndex];
  source.connect(audioCtx.destination);
  source.start(time);
}

function advancePermutation() {
  nextPermutation(permutation);
  permutationIndex++;
  counterEl.textContent = `PERMUTATION: ${permutationIndex}`;
}
