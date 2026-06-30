// Shared, public vote counts using Abacus (no signup, no backend needed).
// Each key's count is visible to anyone who loads this page — perfect for a group poll.
// Docs: https://abacus.jasoncameron.dev
const NAMESPACE = "arya-birthday-3july2026";
const KEYS = ["tressa", "asiakitchen"];
const VOTED_KEY = "arya-bday-voted-choice";
const API_BASE = "https://abacus.jasoncameron.dev";

const els = {
  options: document.getElementById("options"),
  note: document.getElementById("note"),
};

function fmtPct(n, total) {
  if (total === 0) return "0%";
  return Math.round((n / total) * 100) + "%";
}

async function getCount(key) {
  try {
    const res = await fetch(`${API_BASE}/get/${NAMESPACE}/${key}`);
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    return typeof data.value === "number" ? data.value : 0;
  } catch (e) {
    return null;
  }
}

async function hitCount(key) {
  try {
    const res = await fetch(`${API_BASE}/hit/${NAMESPACE}/${key}`);
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    return typeof data.value === "number" ? data.value : 0;
  } catch (e) {
    return null;
  }
}

async function renderResults() {
  const counts = {};
  let hadError = false;
  for (const key of KEYS) {
    const v = await getCount(key);
    if (v === null) hadError = true;
    counts[key] = v === null ? 0 : v;
  }

  if (hadError && !localStorage.getItem(VOTED_KEY)) {
    els.note.textContent = "Couldn't reach the results server — check your connection and refresh.";
  }

  const total = KEYS.reduce((sum, k) => sum + counts[k], 0);

  for (const key of KEYS) {
    const pct = fmtPct(counts[key], total);
    document.getElementById(`pct-${key}`).textContent = pct;
    document.getElementById(`votes-${key}`).textContent =
      counts[key] === 1 ? "1 vote" : `${counts[key]} votes`;
    document.getElementById(`fill-${key}`).style.width = pct;
  }
  return counts;
}

function markVotedUI(choice) {
  document.querySelectorAll(".option").forEach((el) => {
    el.classList.toggle("voted", el.dataset.key === choice);
    el.style.pointerEvents = "none";
    el.style.cursor = "default";
  });
  els.note.textContent = "Thanks for voting — results are live for everyone 💛";
  els.note.classList.add("success");
}

async function handleVote(key) {
  const already = localStorage.getItem(VOTED_KEY);
  if (already) return;

  localStorage.setItem(VOTED_KEY, key);
  markVotedUI(key);

  const optionEl = document.querySelector(`.option[data-key="${key}"]`);
  if (typeof burstConfetti === "function") burstConfetti(optionEl);

  const newVal = await hitCount(key);
  if (newVal === null) {
    // network hiccup — still reflect locally, but try a refresh
  }
  await renderResults();
}

(async function init() {
  await renderResults();

  const existingVote = localStorage.getItem(VOTED_KEY);
  if (existingVote) {
    markVotedUI(existingVote);
  } else {
    document.querySelectorAll(".option").forEach((el) => {
      el.addEventListener("click", () => handleVote(el.dataset.key));
    });
  }

  // Keep results fresh for anyone leaving the tab open
  setInterval(renderResults, 6000);
})();
