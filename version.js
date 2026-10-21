if (window.location.pathname.endsWith("index-beta.html")) {
    document.getElementById("beta")?.classList.remove("hidden");
  }

(function() {
  const VERSION_SPREADSHEET_ID = "1mk6GCR7vm26YmegLsu1nLU0MDmvL8kJV6c7SpmrQmYc";
  const VERSION_SHEET_NAME = "Version";

  const STORAGE_USER_ID_KEY = "ssc_app_user_id";
  const STORAGE_VERSION_KEY = "ssc_app_version";

  function renderAppVersion(ver) {
    const verEl = document.getElementById("display-app-version");
    if (verEl && ver) {
      verEl.textContent = ver;
    }
  }

  async function performAppUpdate(newVersionToStore) {
    console.group("🚀 SSC Application Purge & Fresh Update Process");

    // 1. Backup user ID
    const existingUserId = localStorage.getItem(STORAGE_USER_ID_KEY) || document.getElementById("display-user-id")?.textContent || "";
    console.log("Step 1: Preserving User ID ->", existingUserId);

    // 2. Unregister Service Workers
    if ('serviceWorker' in navigator) {
      console.log("Step 2: Checking and unregistering service workers...");
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          const unregistered = await registration.unregister();
          console.log(` -> Service Worker (${registration.scope}) unregistered:`, unregistered);
        }
      } catch (err) {
        console.warn(" -> Error unregistering service workers:", err);
      }
    }

    // 3. Clear CacheStorage
    if ('caches' in window) {
      console.log("Step 3: Purging browser CacheStorage...");
      try {
        const cacheKeys = await caches.keys();
        for (const key of cacheKeys) {
          const deleted = await caches.delete(key);
          console.log(` -> Deleted Cache: [${key}] - Success:`, deleted);
        }
      } catch (err) {
        console.warn(" -> Error purging CacheStorage:", err);
      }
    }

    // 4. Restore User ID & Store latest version
    console.log("Step 4: Restoring user preferences and saving new version...");
    if (existingUserId) {
      localStorage.setItem(STORAGE_USER_ID_KEY, existingUserId);
    }
    if (newVersionToStore) {
      localStorage.setItem(STORAGE_VERSION_KEY, newVersionToStore);
      console.log(" -> Updated stored version to:", newVersionToStore);
    }

    // 5. Force fresh reload
    console.log("Step 5: Forcing hard cache-bust reload...");
    console.groupEnd();

    const url = new URL(window.location.href);
    url.searchParams.set("v", Date.now().toString());
    window.location.href = url.toString();
  }

  async function fetchRemoteVersion() {
    try {
      const tqUrl = `https://docs.google.com/spreadsheets/d/${VERSION_SPREADSHEET_ID}/gviz/tq?sheet=${encodeURIComponent(VERSION_SHEET_NAME)}&range=B1&tqx=out:json&_t=${Date.now()}`;
      const res = await fetch(tqUrl, { cache: "no-store" });
      if (!res.ok) return null;
      
      const text = await res.text();
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) return null;

      const json = JSON.parse(text.substring(startIdx, endIdx + 1));
      const cell = json.table?.rows?.[0]?.c?.[0];
      if (!cell) return null;

      const rawValue = (cell.v !== undefined && cell.v !== null) ? cell.v : (cell.f || "");
      const cleanVal = String(rawValue).trim();
      return cleanVal || null;
    } catch (err) {
      console.warn("[Auto-Update] Error fetching remote version:", err);
      return null;
    }
  }

  async function checkAutoUpdate() {
    const sscBtn = document.getElementById("ssc-update-btn");
    const localVersion = localStorage.getItem(STORAGE_VERSION_KEY);

    if (localVersion) {
      renderAppVersion(localVersion);
    }

    console.log("[Auto-Update] Local stored version:", localVersion);
    const remoteVersion = await fetchRemoteVersion();
    console.log("[Auto-Update] Remote sheet version:", remoteVersion);

    if (!remoteVersion) return;

    if (!localVersion) {
      localStorage.setItem(STORAGE_VERSION_KEY, remoteVersion);
      renderAppVersion(remoteVersion);
      return;
    }

    if (localVersion !== remoteVersion) {
      console.log(`[Auto-Update] Version mismatch detected (${localVersion} -> ${remoteVersion}). Triggering auto-update.`);
      
      if (sscBtn) {
        sscBtn.textContent = "Auto Updating...";
        sscBtn.classList.add("animate-pulse", "pointer-events-none");
      }

      setTimeout(async () => {
        await performAppUpdate(remoteVersion);
      }, 600);
    } else {
      console.log("[Auto-Update] Versions match. No update needed.");
      renderAppVersion(remoteVersion);
      if (sscBtn) {
        sscBtn.textContent = "Update";
        sscBtn.classList.remove("animate-pulse", "pointer-events-none");
      }
    }
  }

  function setupSSCUpdate() {
    const sscBtn = document.getElementById("ssc-update-btn");
    const updateModal = document.getElementById("update-modal");
    const cancelBtn = document.getElementById("cancel-update-btn");
    const confirmBtn = document.getElementById("confirm-update-btn");

    if (!sscBtn || !updateModal) return;

    sscBtn.addEventListener("click", () => {
      if (sscBtn.textContent.includes("Updating")) return;
      console.log("[SSC Update] Button clicked. Prompting confirmation popup.");
      updateModal.classList.remove("hidden");
    });

    cancelBtn.addEventListener("click", () => {
      console.log("[SSC Update] User cancelled update.");
      updateModal.classList.add("hidden");
    });

    confirmBtn.addEventListener("click", async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Updating...";

      const latestVersion = await fetchRemoteVersion();
      await performAppUpdate(latestVersion || localStorage.getItem(STORAGE_VERSION_KEY));
    });

    updateModal.addEventListener("click", (e) => {
      if (e.target === updateModal) updateModal.classList.add("hidden");
    });
  }

  setupSSCUpdate();
  checkAutoUpdate();
})();
