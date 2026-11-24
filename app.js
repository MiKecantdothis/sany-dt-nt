(function () {
  const cfg = window.QUEST_CONFIG;

  // DOM References
  const stageBadge = document.getElementById("stage-badge");
  const targetDateChip = document.getElementById("target-date-chip");
  const loadingBar = document.getElementById("loading-bar");
  const sweaterGrid = document.getElementById("sweater-grid");
  const microReply = document.getElementById("p2-micro-reply");
  const notifyStatus = document.getElementById("notify-status");

  const screens = {
    page1: document.getElementById("page-1"),
    loading: document.getElementById("page-loading"),
    page2: document.getElementById("page-2"),
    page3: document.getElementById("page-3"),
    finale: document.getElementById("page-finale"),
    cancelled: document.getElementById("page-cancelled")
  };

  let activeQuest = null;
  let confettiAnimId = null;

  // ------------------------------------------------------------
  // 1. INITIALIZE DYNAMIC LABELS
  // ------------------------------------------------------------
  document.querySelectorAll("[data-recipient]").forEach((el) => {
    el.textContent = cfg.recipientName;
  });
  if (cfg.targetLabel) {
    targetDateChip.textContent = cfg.targetLabel;
  }

  // ------------------------------------------------------------
  // 2. SCREEN NAVIGATION
  // ------------------------------------------------------------
  const badgeLabels = {
    page1: "QUEST BRIEFING • 01/03",
    loading: "DECRYPTING • ...",
    page2: "QUEST BRIEFING • 02/03",
    page3: "CHOOSE YOUR SWEATER • 03/03",
    finale: "QUEST LOCKED IN ✨",
    cancelled: "QUEST ABORTED"
  };

  function showScreen(key) {
    Object.values(screens).forEach((s) => s.classList.remove("screen--active"));
    screens[key].classList.add("screen--active");
    stageBadge.textContent = badgeLabels[key] || "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ------------------------------------------------------------
  // 3. LIVE COUNTDOWN TIMER (ticks across Page 1 & Finale)
  // ------------------------------------------------------------
  function pad(n) {
    return String(Math.max(0, n)).padStart(2, "0");
  }

  function updateTimers() {
    const targetMs = new Date(cfg.targetDateISO).getTime();
    const diff = Math.max(0, targetMs - Date.now());

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    document.querySelectorAll("[data-timer-display]").forEach((box) => {
      box.querySelector("[data-days]").textContent = pad(days);
      box.querySelector("[data-hours]").textContent = pad(hours);
      box.querySelector("[data-minutes]").textContent = pad(minutes);
      box.querySelector("[data-seconds]").textContent = pad(seconds);
    });
  }

  updateTimers();
  setInterval(updateTimers, 1000);

  // ------------------------------------------------------------
  // 4. PAGE 1 -> LOADING -> PAGE 2
  // ------------------------------------------------------------
  document.getElementById("btn-start").addEventListener("click", () => {
    showScreen("loading");
    loadingBar.style.width = "0%";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        loadingBar.style.width = "100%";
      });
    });

    setTimeout(() => {
      showScreen("page2");
    }, 2450);
  });

  // ------------------------------------------------------------
  // 5. PAGE 2 REACTION -> PAGE 3
  // ------------------------------------------------------------
  document.querySelectorAll("[data-p2-reaction]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.p2Reaction;
      microReply.hidden = false;
      microReply.textContent =
        choice === "smiling"
          ? "Knew it. Bold move admitting it — advancing you to the good part..."
          : "Fair enough, bravery noted. Advancing you to the good part...";

      setTimeout(() => {
        showScreen("page3");
      }, 650);
    });
  });

  // ------------------------------------------------------------
  // 6. PAGE 3: RENDER TWO SWEATER CARDS
  // ------------------------------------------------------------
  function renderSweaterCards() {
    sweaterGrid.innerHTML = "";

    cfg.quests.forEach((quest) => {
      const card = document.createElement("article");
      card.className = "sweater-card";
      card.dataset.questId = quest.id;

      card.innerHTML = `
        <button class="sweater-trigger" type="button" aria-expanded="false">
          <div class="sweater-img-wrap">
            <img
              class="sweater-img"
              src="${quest.sweaterImage}"
              alt="${quest.sweaterLabel}"
            />
          </div>
          <div class="sweater-meta">
            <span class="sweater-name">${quest.sweaterLabel}</span>
            <span class="sweater-tag">${quest.sweaterTag}</span>
          </div>
          <span class="tap-prompt">Click sweater to inspect quest location →</span>
        </button>

        <div class="quest-reveal">
          <p class="reveal-kicker">Hidden Side-Quest Location</p>
          <h3 class="place-name">${quest.placeName}</h3>
          <p class="place-vibe">${quest.vibeDescription}</p>
          ${quest.detailsUrl
          ? `<a class="place-link" href="${quest.detailsUrl}" target="_blank" rel="noopener noreferrer">Peek at the spot on Zomato ↗</a>`
          : ""
        }
          <button class="btn btn-quest" type="button">
            Choose quest path ✨
          </button>
        </div>
      `;

      const trigger = card.querySelector(".sweater-trigger");
      const chooseBtn = card.querySelector(".btn-quest");

      trigger.addEventListener("click", () => {
        const wasOpen = card.classList.contains("is-open");
        // Close other cards so focus stays clear, or toggle if already open
        document.querySelectorAll(".sweater-card").forEach((c) => {
          c.classList.remove("is-open");
          c.querySelector(".sweater-trigger").setAttribute("aria-expanded", "false");
        });
        if (!wasOpen) {
          card.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });

      chooseBtn.addEventListener("click", () => selectQuestPath(quest));
      sweaterGrid.appendChild(card);
    });
  }

  renderSweaterCards();

  // ------------------------------------------------------------
  // 7. FINALE + NOTIFICATIONS + CONFETTI
  // ------------------------------------------------------------
  function selectQuestPath(quest) {
    activeQuest = quest;
    document.getElementById("chosen-place-name").textContent = quest.placeName;
    document.getElementById("chosen-sweater-img").src = quest.sweaterImage;
    document.getElementById("chosen-sweater-img").alt = quest.sweaterLabel;
    document.getElementById("chosen-sweater-label").textContent =
      `${quest.sweaterLabel} • ${quest.sweaterTag}`;
    document.getElementById("chosen-place-vibe").textContent = quest.vibeDescription;

    const placeLink = document.getElementById("chosen-place-link");
    if (quest.detailsUrl) {
      placeLink.href = quest.detailsUrl;
      placeLink.hidden = false;
    } else {
      placeLink.hidden = true;
    }

    showScreen("finale");
    launchConfetti();
    sendSilentNotification("ACCEPTED", quest);
  }

  // Cancel Side Quest flow
  document.getElementById("btn-cancel-quest").addEventListener("click", () => {
    showScreen("cancelled");
    sendSilentNotification("CANCELLED", null);
  });

  document.getElementById("btn-reconsider").addEventListener("click", () => {
    showScreen("page3");
  });

  document.getElementById("btn-switch-quest").addEventListener("click", () => {
    showScreen("page3");
  });

  // ------------------------------------------------------------
  // 8. EMAIL NOTIFICATION (Web3Forms) + CLIPBOARD RECEIPT
  // ------------------------------------------------------------
  async function sendSilentNotification(status, quest) {
    const { web3formsAccessKey } = cfg.notifications || {};
    const summaryText =
      status === "ACCEPTED"
        ? `${cfg.recipientName} ACCEPTED the side quest! Sweater: ${quest.sweaterLabel} | Place: ${quest.placeName}`
        : `${cfg.recipientName} clicked "Cancel side quest entirely".`;

    let sent = false;

    if (web3formsAccessKey) {
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: web3formsAccessKey,
            subject: `Date Night Quest Update: ${status}`,
            from_name: "Date Night Side Quest",
            message: `${summaryText}\nTimestamp: ${new Date().toLocaleString()}`
          })
        });
        if (res.ok) sent = true;
      } catch (_) {
        // Fallback copy button remains available
      }
    }

    if (status === "ACCEPTED" && notifyStatus) {
      notifyStatus.textContent = sent
        ? "Quest signal transmitted!"
        : "You can copy your quest receipt below.";
    }
  }

  document.getElementById("btn-send-receipt").addEventListener("click", async () => {
    if (!activeQuest) return;
    const msg = `Quest accepted! 🧶✨\nSweater: ${activeQuest.sweaterLabel}\nDestination: ${activeQuest.placeName}\nSee you ${cfg.targetLabel}!`;

    try {
      await navigator.clipboard.writeText(msg);
      notifyStatus.textContent = "Copied quest receipt to clipboard!";
    } catch (_) {
      notifyStatus.textContent = msg;
    }
  });

  // ------------------------------------------------------------
  // 9. ZERO-DEPENDENCY CANVAS CONFETTI ENGINE
  // ------------------------------------------------------------
  function launchConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (confettiAnimId) cancelAnimationFrame(confettiAnimId);

    const colors = ["#8f6fa0", "#c8add6", "#d9c1e6", "#6b4e7b", "#f4eff7", "#b18fc4"];
    const pieces = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height * 0.6 - 20,
      w: Math.random() * 9 + 6,
      h: Math.random() * 5 + 4,
      vx: (Math.random() - 0.5) * 4.5,
      vy: Math.random() * 4 + 2.5,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.18,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1
    }));

    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.rot += p.vRot;
        if (elapsed > 2600) {
          p.alpha = Math.max(0, p.alpha - 0.02);
        }
        if (p.y < canvas.height + 40 && p.alpha > 0.02) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }

      if (alive && elapsed < 5000) {
        confettiAnimId = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    confettiAnimId = requestAnimationFrame(tick);
  }
})();

