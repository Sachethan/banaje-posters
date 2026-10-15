(function() {
  const TELEMETRY_SPREADSHEET_ID = "11VJ9sxd6MC8zcEBMvKMeuztG-zAaFGt7eI7IwdPS5JI";
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwkCSWw1-XIAmPNkUfQWlJpeClq1rjuZ-40G7DmMFfxUfWgmCJm6wdqyZUTlJeOoJEmZw/exec";
  const STORAGE_USER_ID_KEY = "ssc_app_user_id";

  function getDeviceAndBrowser() {
    const ua = navigator.userAgent;
    let browser = "Browser";
    let device = "Device";

    if (ua.includes("Firefox/")) browser = "Firefox";
    else if (ua.includes("Edg/")) browser = "Edge";
    else if (ua.includes("Chrome/")) browser = "Chrome";
    else if (ua.includes("Safari/")) browser = "Safari";

    if (/android/i.test(ua)) device = "Android";
    else if (/iPad|iPhone|iPod/.test(ua)) device = "iOS";
    else if (/Win/i.test(ua)) device = "Windows";
    else if (/Mac/i.test(ua)) device = "Mac";
    else if (/Linux/i.test(ua)) device = "Linux";

    return { device, browser };
  }

  function getFormattedDateTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `'${day}/${month}/${year}`;

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    return { date: dateStr, time: timeStr, fullYear: year };
  }

  function generateFallbackUserId() {
    const { device, browser } = getDeviceAndBrowser();
    const { date, fullYear } = getFormattedDateTime();
    const randomSeed = Math.random().toString(36).substring(2);

    const rawSeed = `${device}${browser}${date}${fullYear}${randomSeed}`;
    let hash = 0;
    for (let i = 0; i < rawSeed.length; i++) {
      hash = (Math.imul(31, hash) + rawSeed.charCodeAt(i)) >>> 0;
    }

    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let shortCode = "";
    while (shortCode.length < 5) {
      shortCode += chars[hash % chars.length];
      hash = Math.floor(hash / chars.length) ^ (Math.random() * 1000 | 0);
    }

    return shortCode.slice(0, 5);
  }

  function cleanUserId(input) {
    return input.trim().replace(/[^\p{L}\p{N}_-]/gu, "");
  }

  function sendTelemetry(userId) {
    const idEl = document.getElementById("display-user-id");
    if (idEl) idEl.textContent = userId;

    const { date, time } = getFormattedDateTime();
    const screenRes = `${window.screen.width}x${window.screen.height}`;

    const payload = {
      spreadsheetId: TELEMETRY_SPREADSHEET_ID,
      userId: userId,
      date: date,
      time: time,
      screen: screenRes,
      platform: navigator.platform || "Unknown",
      userAgent: navigator.userAgent
    };

    console.group("Telemetry Tracker");
    console.log("User ID:", payload.userId);
    console.log("Visit Date:", payload.date);
    console.log("Visit Time:", payload.time);
    console.log("Screen Dimension:", payload.screen);
    console.log("Payload:", payload);
    console.groupEnd();

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: "text/plain" });
      navigator.sendBeacon(APPS_SCRIPT_URL, blob);
    } else {
      fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload)
      }).catch(err => console.warn("Tracker fetch failed silently:", err));
    }
  }

  function checkFirstTimeUser() {
    const storedId = localStorage.getItem(STORAGE_USER_ID_KEY);
    const modal = document.getElementById("first-time-modal");
    const form = document.getElementById("first-time-form");
    const input = document.getElementById("first-time-name-input");
    const skipBtn = document.getElementById("skip-first-time-btn");
    const errEl = document.getElementById("first-time-error");

    if (storedId) {
      sendTelemetry(storedId);
      return;
    }

    if (modal) {
      modal.classList.remove("hidden");
      setTimeout(() => input?.focus(), 150);
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const rawVal = input.value.trim();
        const cleaned = cleanUserId(rawVal);

        if (!cleaned) {
          if (errEl) errEl.classList.remove("hidden");
          input.focus();
          return;
        }

        if (errEl) errEl.classList.add("hidden");
        localStorage.setItem(STORAGE_USER_ID_KEY, cleaned);
        modal.classList.add("hidden");
        sendTelemetry(cleaned);
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener("click", () => {
        const autoId = generateFallbackUserId();
        localStorage.setItem(STORAGE_USER_ID_KEY, autoId);
        modal.classList.add("hidden");
        sendTelemetry(autoId);
      });
    }
  }

  function setupRenameModal() {
    const userIdBtn = document.getElementById("user-id-btn");
    const modal = document.getElementById("rename-modal");
    const input = document.getElementById("rename-input");
    const cancelBtn = document.getElementById("cancel-rename-btn");
    const saveBtn = document.getElementById("save-rename-btn");
    const idEl = document.getElementById("display-user-id");

    if (!userIdBtn || !modal || !input) return;

    userIdBtn.addEventListener("click", () => {
      input.value = localStorage.getItem(STORAGE_USER_ID_KEY) || (idEl ? idEl.textContent : "");
      modal.classList.remove("hidden");
      input.focus();
    });

    cancelBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
    });

    saveBtn.addEventListener("click", () => {
      const newName = cleanUserId(input.value);
      if (newName) {
        localStorage.setItem(STORAGE_USER_ID_KEY, newName);
        if (idEl) idEl.textContent = newName;
        modal.classList.add("hidden");
        sendTelemetry(newName);
      }
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });
  }

  checkFirstTimeUser();
  setupRenameModal();
})();