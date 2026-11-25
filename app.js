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
    loadout: document.getElementById("page-loadout"),
    finale: document.getElementById("page-finale"),
    cancelled: document.getElementById("page-cancelled")
  };

  let activeQuest = null;
  let selectedWeapon = null;
  let selectedDateISO = null;
  let selectedDateLabel = cfg.defaultDateChip || "DATE: TBD";
  let customNote = "";
  let confettiAnimId = null;
  let timerIntervalId = null;

  // Date/time inputs on Loadout screen
  const questDateInput = document.getElementById("quest-date");
  const questTimeInput = document.getElementById("quest-time");
  const questMessageInput = document.getElementById("quest-message");
  const dateError = document.getElementById("date-error");
  const weaponError = document.getElementById("weapon-error");

  // Leave date & time empty so she picks directly; prevent past dates
  const today = new Date();
  const todayLocal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  questDateInput.min = todayLocal;

  // ------------------------------------------------------------
  // 1. INITIALIZE DYNAMIC LABELS
  // ------------------------------------------------------------
  document.querySelectorAll("[data-recipient]").forEach((el) => {
    el.textContent = cfg.recipientName;
  });
  targetDateChip.textContent = selectedDateLabel;

  // ------------------------------------------------------------
  // 2. SCREEN NAVIGATION
  // ------------------------------------------------------------
  const badgeLabels = {
    page1: "QUEST BRIEFING • 01/04",
    loading: "DECRYPTING • ...",
    page2: "QUEST BRIEFING • 02/04",
    page3: "CHOOSE YOUR SWEATER • 03/04",
    loadout: "QUEST LOADOUT • 04/04",
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
  // 3. LIVE COUNTDOWN TIMER (starts once she locks in her date)
  // ------------------------------------------------------------
  function pad(n) {
    return String(Math.max(0, n)).padStart(2, "0");
  }

  function updateTimers() {
    if (!selectedDateISO) return;
    const targetMs = new Date(selectedDateISO).getTime();
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

  function startCountdown() {
    updateTimers();
    if (timerIntervalId) clearInterval(timerIntervalId);
    timerIntervalId = setInterval(updateTimers, 1000);
  }

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
  // 7. VENUE PICKED -> LOADOUT -> FINALE + NOTIFICATIONS + CONFETTI
  // ------------------------------------------------------------
  function formatDateLabel(dateStr, timeStr) {
    if (!dateStr) return cfg.defaultDateChip || "DATE: TBD";
    const dt = new Date(`${dateStr}T${timeStr || "20:00"}:00`);
    if (Number.isNaN(dt.getTime())) return cfg.defaultDateChip || "DATE: TBD";
    const dateFormatted = dt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
    const timeFormatted = dt.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
    return `${dateFormatted} • ${timeFormatted}`;
  }

  function selectQuestPath(quest) {
    activeQuest = quest;
    document.getElementById("loadout-place-name").textContent = quest.placeName;
    dateError.hidden = true;
    weaponError.hidden = true;
    showScreen("loadout");
  }

  questDateInput.addEventListener("input", () => { dateError.hidden = true; });
  questTimeInput.addEventListener("input", () => { dateError.hidden = true; });

  // Weapon selection buttons (Tulips / Orchids)
  document.querySelectorAll(".weapon-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedWeapon = btn.dataset.weapon;
      weaponError.hidden = true;
      document.querySelectorAll(".weapon-card").forEach((other) => {
        const isSelected = other === btn;
        other.classList.toggle("is-selected", isSelected);
        other.setAttribute("aria-pressed", String(isSelected));
      });
    });
  });

  // Back to sweaters from Loadout
  document.getElementById("btn-back-sweaters").addEventListener("click", () => {
    showScreen("page3");
  });

  // Confirm Loadout -> Launch Finale
  document.getElementById("btn-confirm-loadout").addEventListener("click", () => {
    if (!activeQuest) return;

    const pickedDate = questDateInput.value;
    const pickedTime = questTimeInput.value;
    const candidateMs = pickedDate && pickedTime ? new Date(`${pickedDate}T${pickedTime}:00`).getTime() : NaN;
    if (!pickedDate || !pickedTime || Number.isNaN(candidateMs) || candidateMs <= Date.now()) {
      dateError.hidden = false;
      return;
    }

    if (!selectedWeapon) {
      weaponError.hidden = false;
      return;
    }

    selectedDateISO = `${pickedDate}T${pickedTime}:00`;
    selectedDateLabel = formatDateLabel(pickedDate, pickedTime);
    customNote = questMessageInput.value.trim();

    // Update top chip & start the live countdown on Finale
    targetDateChip.textContent = selectedDateLabel;
    startCountdown();

    document.getElementById("chosen-place-name").textContent = activeQuest.placeName;
    document.getElementById("chosen-sweater-img").src = activeQuest.sweaterImage;
    document.getElementById("chosen-sweater-img").alt = activeQuest.sweaterLabel;
    document.getElementById("chosen-sweater-label").textContent =
      `${activeQuest.sweaterLabel} • ${activeQuest.sweaterTag}`;
    document.getElementById("chosen-place-vibe").textContent = activeQuest.vibeDescription;
    document.getElementById("chosen-date-pill").textContent = `📅 ${selectedDateLabel}`;
    document.getElementById("chosen-weapon-pill").textContent =
      `${selectedWeapon === "Tulips" ? "🌷" : "🪻"} Weapon: ${selectedWeapon}`;
    document.getElementById("finale-timer-caption").textContent =
      `Countdown started for ${selectedDateLabel}:`;

    const noteEl = document.getElementById("chosen-custom-note");
    if (customNote) {
      noteEl.textContent = `"${customNote}"`;
      noteEl.hidden = false;
    } else {
      noteEl.hidden = true;
    }

    const placeLink = document.getElementById("chosen-place-link");
    if (activeQuest.detailsUrl) {
      placeLink.href = activeQuest.detailsUrl;
      placeLink.hidden = false;
    } else {
      placeLink.hidden = true;
    }

    showScreen("finale");
    launchConfetti();
    sendSilentNotification("ACCEPTED", activeQuest);
  });

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
        ? [
          `${cfg.recipientName} ACCEPTED the side quest!`,
          `Sweater: ${quest.sweaterLabel} (${quest.sweaterTag})`,
          `Venue: ${quest.placeName}`,
          `Date & Time: ${selectedDateLabel}`,
          `Weapon of Choice: ${selectedWeapon}`,
          `Custom Message: ${customNote || "(none)"}`
        ].join("\n")
        : `${cfg.recipientName} clicked "Cancel side quest entirely".`;

    let sent = false;

    if (web3formsAccessKey) {
      try {
        const formData = new FormData();
        formData.append("access_key", web3formsAccessKey);
        formData.append("subject", `Date Night Quest Update: ${status}`);
        formData.append("from_name", "Date Night Side Quest");
        formData.append("name", cfg.recipientName || "Guest");
        formData.append("message", `${summaryText}\nTimestamp: ${new Date().toLocaleString()}`);

        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: formData
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          sent = true;
        } else {
          console.warn("Web3Forms response:", res.status, data);
        }
      } catch (err) {
        console.warn("Web3Forms error:", err);
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
    const lines = [
      "Quest accepted! 🧶✨",
      `Sweater: ${activeQuest.sweaterLabel}`,
      `Destination: ${activeQuest.placeName}`,
      `Date & Time: ${selectedDateLabel}`,
      `Weapon of choice: ${selectedWeapon}`
    ];
    if (customNote) lines.push(`Note: "${customNote}"`);
    const msg = lines.join("\n");

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

