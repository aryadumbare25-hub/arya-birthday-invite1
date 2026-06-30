// Lightweight confetti burst — no dependencies.
// Spawns a handful of small animated pieces from a given element (or screen center)
// and removes them once their animation finishes.
function burstConfetti(originEl, count = 22) {
  const colors = ["#c9a14a", "#e3c98a", "#e0536a", "#f3ead9", "#6e1830"];
  const rect = originEl
    ? originEl.getBoundingClientRect()
    : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  document.body.appendChild(layer);

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";

    const angle = Math.random() * Math.PI * 2;
    const distance = 70 + Math.random() * 140;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 40;
    const rotate = (Math.random() - 0.5) * 540;
    const size = 5 + Math.random() * 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const duration = 700 + Math.random() * 500;

    piece.style.left = `${originX}px`;
    piece.style.top = `${originY}px`;
    piece.style.width = `${size}px`;
    piece.style.height = `${size * (Math.random() > 0.5 ? 1 : 2.2)}px`;
    piece.style.background = color;
    piece.style.setProperty("--dx", `${dx}px`);
    piece.style.setProperty("--dy", `${dy}px`);
    piece.style.setProperty("--rotate", `${rotate}deg`);
    piece.style.animationDuration = `${duration}ms`;

    layer.appendChild(piece);
    setTimeout(() => piece.remove(), duration + 50);
  }

  setTimeout(() => layer.remove(), count > 0 ? 1300 : 0);
}
