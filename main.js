// =======================
// CONFIG
// =======================

const NUM_SOUNDS = 11; 
const STEP_MS = 150;

// =======================
// UTILS
// =======================

function factorial(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

const TOTAL_PERMUTATIONS = factorial(NUM_SOUNDS);

// =======================
// AUDIO
// =======================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const buffers = [];

async function loadSamples() {
  for (let i = 1; i <= NUM_SOUNDS; i++) {
    const num = String(i).padStart(2, "0");
    const res = await fetch(`samples/${num}.wav`);
    const arrayBuffer = await res.arrayBuffer();
    buffers.push(await audioCtx.decodeAudioData(arrayBuffer));
  }
}

function playSound(index) {
  const src = audioCtx.createBufferSource();
  src.buffer = buffers[index];
  src.connect(audioCtx.destination);
  src.start();
}

// =======================
// PERMUTATIONS
// =======================

function nextPermutation(arr) {
  const a = arr.slice();

  let i = a.length - 2;
  while (i >= 0 && a[i] >= a[i + 1]) i--;
  if (i < 0) return a.slice(); // wrap (cyclic)

  let j = a.length - 1;
  while (a[j] <= a[i]) j--;

  [a[i], a[j]] = [a[j], a[i]];

  let left = i + 1,
    right = a.length - 1;
  while (left < right) {
    [a[left], a[right]] = [a[right], a[left]];
    left++;
    right--;
  }

  return a;
}

// =======================
// STATE
// =======================

let initialPermutation = [];
for (let i = 0; i < NUM_SOUNDS; i++) initialPermutation.push(i);

let currentPermutation = initialPermutation.slice();
let permutationIndex = 0;
let stepIndex = 0;

let isPlaying = false;
let timerId = null;
let endedNaturally = false;


// =======================
// UI
// =======================

const startBtn = document.getElementById("startBtn");
const counterEl = document.getElementById("counter");

counterEl.textContent = "PERMUTATION: 0";

// =======================
// SCHEDULER
// =======================

function tick() {
  if (!isPlaying) return;

  playSound(currentPermutation[stepIndex]);
  stepIndex++;

  if (stepIndex >= currentPermutation.length) {
    stepIndex = 0;

    // END CHECK
    if (permutationIndex >= TOTAL_PERMUTATIONS - 1) {
  endedNaturally = true;
  stopPlayback();
  return;
    }


    currentPermutation = nextPermutation(currentPermutation);
    permutationIndex++;
    counterEl.textContent = `PERMUTATION: ${permutationIndex}`;
  }
}

function startPlayback() {
  if (isPlaying) return;

  audioCtx.resume();
  isPlaying = true;
  endedNaturally = false;
  startBtn.textContent = "STOP";

  timerId = setInterval(tick, STEP_MS);
}


function stopPlayback() {
  isPlaying = false;
  clearInterval(timerId);
  timerId = null;

  if (endedNaturally) {
    permutationIndex = 0;
    stepIndex = 0;
    currentPermutation = initialPermutation.slice();
    counterEl.textContent = "PERMUTATION: 0";
    endedNaturally = false;
  }

  startBtn.textContent = "PLAY";
}


// =======================
// EVENTS
// =======================

startBtn.onclick = () => {
  if (!isPlaying) {
    startPlayback();
  } else {
    stopPlayback();
  }
};

// =======================
// INIT
// =======================

loadSamples();
