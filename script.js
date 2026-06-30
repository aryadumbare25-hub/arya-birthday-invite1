// Shared, public vote counts using Abacus (no signup, no backend needed).
// Docs: https://abacus.jasoncameron.dev
const NAMESPACE = "arya-birthday-3july2026";
const KEYS = ["tressa", "asiakitchen"];
const VOTED_KEY = "arya-bday-voted-choice";
const API_BASE = "https://abacus.jasoncameron.dev";
const FETCH_TIMEOUT_MS = 6000;

const noteEl = document.getElementById("note");

function fmtPct(n, total) {
  if (total === 0) return "0%";
  return Math.round((n / total) * 100) + "%";
}

// fetch wrapped with a hard timeout so a slow/dead network never leaves the UI hanging
async function fetchJSON(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    console.error("Request failed:", url, err);
    return null;
  }
}

async function getCount(key) {
  const data = await fetchJSON(`${API_BASE}/get/${NAMESPACE}/${key}`);
  return data && typeof data.value === "number" ? data.value : null;
}

async function hitCount(key) {
  const data = await fetchJSON(`${API_BASE}/hit/${NAMESPACE}/${key}`);
  return data && typeof data.value === "number" ? data.value : null;
}

async function renderResults() {
  const counts = {};
  let hadError = false;

  for (const key of KEYS) {
    const v = await getCount(key);
    if (v === null) hadError = true;
    counts[key] = v === null ? 0 : v;
  }

  const total = KEYS.reduce((sum, k) => sum + counts[k], 0);

  for (const key of KEYS) {
    const pct = fmtPct(counts[key], total);
    document.getElementById(`pct-${key}`).textContent = pct;
    document.getElementById(`votes-${key}`).textContent =
      counts[key] === 1 ? "1 vote" : `${counts[key]} votes`;
    document.getElementById(`fill-${key}`).style.width = pct;
  }

  const voted = localStorage.getItem(VOTED_KEY);
  if (hadError) {
    noteEl.textContent = "Results server is slow to respond — trying again shortly…";
    noteEl.classList.remove("success");
  } else if (voted) {
    noteEl.textContent = "Thanks for voting — results are live for everyone 💛";
    noteEl.classList.add("success");
  } else {
    noteEl.textContent = "Tap an option to vote · one vote per person, please 💛";
    noteEl.classList.remove("success");
  }

  return { counts, hadError };
}

function markVotedUI(choice) {
  document.querySelectorAll(".option").forEach((el) => {
    el.classList.toggle("voted", el.dataset.key === choice);
    el.classList.add("locked");
  });
}

let voteInFlight = false;

async function handleVote(key) {
  if (voteInFlight) return;
  if (localStorage.getItem(VOTED_KEY)) return;

  voteInFlight = true;
  localStorage.setItem(VOTED_KEY, key);
  markVotedUI(key);

  const optionEl = document.querySelector(`.option[data-key="${key}"]`);
  if (typeof burstConfetti === "function") burstConfetti(optionEl);

  const result = await hitCount(key);
  if (result === null) {
    // The vote is still remembered locally and will keep retrying via renderResults below.
    noteEl.textContent = "Vote saved on your device — syncing to the shared count…";
  }
  await renderResults();
  voteInFlight = false;
}

function attachVoteHandlers() {
  document.querySelectorAll(".option").forEach((el) => {
    el.addEventListener("click", () => handleVote(el.dataset.key));
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleVote(el.dataset.key);
      }
    });
  });
}

async function init() {
  attachVoteHandlers();
  await renderResults();

  const existingVote = localStorage.getItem(VOTED_KEY);
  if (existingVote) markVotedUI(existingVote);

  // Keep results fresh for anyone leaving the tab open, and retry silently if a request failed.
  setInterval(renderResults, 5000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
