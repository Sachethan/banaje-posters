// beta-check.js
(async function () {
  const SPREADSHEET_ID = "1mk6GCR7vm26YmegLsu1nLU0MDmvL8kJV6c7SpmrQmYc";
  const SHEET_NAME = "Version";
  const STORAGE_USER_ID_KEY = "ssc_app_user_id";
  const TARGET_BETA_URL = "index-beta.html";

  // Prevent redirect loops if already on the beta page
  if (window.location.pathname.endsWith("index-beta.html")) {
    return;
  }

  try {
    // Range B2:B3 fetches B2 (Beta active flag) and B3 (Excluded users)
    const tqUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&range=B2:B3&headers=0&tqx=out:json&_t=${Date.now()}`;
    const res = await fetch(tqUrl, { cache: "no-store" });
    if (!res.ok) return;

    const text = await res.text();
    const startIdx = text.indexOf("{");
    const endIdx = text.lastIndexOf("}");
    if (startIdx === -1 || endIdx === -1) return;

    const data = JSON.parse(text.substring(startIdx, endIdx + 1));
    const rows = data.table?.rows || [];

    // Helper to read formatted or raw value from a row
    const getCellValue = (rowIndex) => {
      const cell = rows[rowIndex]?.c?.[0];
      if (!cell) return "";
      const val = cell.v !== undefined && cell.v !== null ? cell.v : (cell.f || "");
      return String(val).trim();
    };

    const betaFlag = getCellValue(0).toLowerCase();      // Row 0 = B2
    const excludedUsersRaw = getCellValue(1);           // Row 1 = B3

    // 1. If B2 is not "yes", stay on current page
    if (betaFlag !== "yes") {
      return;
    }

    // 2. Read local user ID
    const currentUserId = (localStorage.getItem(STORAGE_USER_ID_KEY) || "").trim().toLowerCase();

    // 3. Parse excluded users list (split by semicolon: "user 1; user 2; user 3")
    if (excludedUsersRaw && currentUserId) {
      const excludedList = excludedUsersRaw
        .split(";")
        .map(u => u.trim().toLowerCase())
        .filter(Boolean);

      // If the current user matches any user in B3, do NOT redirect
      if (excludedList.includes(currentUserId)) {
        return;
      }
    }

    // 4. Redirect to beta page
    window.location.replace(TARGET_BETA_URL);
  } catch (err) {
    console.warn("[Beta-Check] Check failed silently:", err);
  }
})();
