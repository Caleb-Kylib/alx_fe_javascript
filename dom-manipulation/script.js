/**********************
 * Storage + Bootstrapping
 **********************/
let quotes = [];
const LS_QUOTES_KEY = "quotes";
const LS_SELECTED_CATEGORY = "selectedCategory";
const LS_AUTO_SYNC = "autoSyncEnabled";
const SS_LAST_QUOTE = "lastQuote";

function saveQuotes() {
  localStorage.setItem(LS_QUOTES_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  const saved = localStorage.getItem(LS_QUOTES_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Normalize to include metadata for syncing
      quotes = parsed.map(q => ({
        id: q.id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: q.text,
        category: q.category,
        source: q.source || "local",   // "local" or "server"
        synced: q.synced ?? (q.source === "server"),
        updatedAt: q.updatedAt || Date.now(),
        serverId: q.serverId || null
      }));
    } catch {
      quotes = [];
    }
  } else {
    // Seed data
    quotes = [
      { id: `local-${Date.now()}-a`, text: "The best way to get started is to quit talking and begin doing.", category: "Motivation", source: "local", synced: false, updatedAt: Date.now(), serverId: null },
      { id: `local-${Date.now()}-b`, text: "Success is not the key to happiness. Happiness is the key to success.", category: "Success", source: "local", synced: false, updatedAt: Date.now(), serverId: null },
      { id: `local-${Date.now()}-c`, text: "In the middle of every difficulty lies opportunity.", category: "Wisdom", source: "local", synced: false, updatedAt: Date.now(), serverId: null }
    ];
    saveQuotes();
  }
}
loadQuotes();

/**********************
 * DOM Elements
 **********************/
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const formContainer = document.getElementById("formContainer");

const syncNowBtn = document.getElementById("syncNowBtn");
const autoSyncToggle = document.getElementById("autoSyncToggle");
const syncStatus = document.getElementById("syncStatus");
const conflictArea = document.getElementById("conflictArea");
const conflictList = document.getElementById("conflictList");
const applyResolutionsBtn = document.getElementById("applyResolutionsBtn");

/**********************
 * Utilities
 **********************/
function showStatus(msg) {
  const ts = new Date().toLocaleTimeString();
  syncStatus.textContent = `[${ts}] ${msg}`;
}

function uniqueCategories() {
  return [...new Set(quotes.map(q => q.category))].sort();
}

/**********************
 * Core UI from Tasks 0–2
 **********************/
function populateCategories() {
  const cats = uniqueCategories();
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  cats.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
  const savedCat = localStorage.getItem(LS_SELECTED_CATEGORY) || "all";
  categoryFilter.value = savedCat;
}

function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem(LS_SELECTED_CATEGORY, selected);
  showRandomQuote();
}

function showRandomQuote() {
  const selected = categoryFilter.value;
  let pool = quotes;
  if (selected !== "all") {
    pool = quotes.filter(q => q.category === selected);
  }
  if (pool.length === 0) {
    quoteDisplay.innerHTML = "<em>No quotes available for this category.</em>";
    return;
  }
  const q = pool[Math.floor(Math.random() * pool.length)];
  quoteDisplay.innerHTML = `<p><strong>${q.category}</strong>: “${q.text}”</p>`;
  sessionStorage.setItem(SS_LAST_QUOTE, JSON.stringify(q));
}

function createAddQuoteForm() {
  formContainer.innerHTML = "";
  const textInput = document.createElement("input");
  textInput.id = "newQuoteText";
  textInput.type = "text";
  textInput.placeholder = "Enter a new quote";

  const catInput = document.createElement("input");
  catInput.id = "newQuoteCategory";
  catInput.type = "text";
  catInput.placeholder = "Enter quote category";

  const addBtn = document.createElement("button");
  addBtn.id = "addQuoteBtn";
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", addQuote);

  formContainer.appendChild(textInput);
  formContainer.appendChild(catInput);
  formContainer.appendChild(addBtn);
}

function addQuote() {
  const textEl = document.getElementById("newQuoteText");
  const catEl = document.getElementById("newQuoteCategory");
  const text = (textEl.value || "").trim();
  const category = (catEl.value || "").trim();

  if (!text || !category) {
    alert("Please fill in both fields!");
    return;
  }

  const newQ = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    text,
    category,
    source: "local",
    synced: false,
    updatedAt: Date.now(),
    serverId: null
  };
  quotes.push(newQ);
  saveQuotes();
  populateCategories();
  showRandomQuote();

  textEl.value = "";
  catEl.value = "";
}

/**********************
 * Import / Export (Task 1)
 **********************/
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes.map(({id, text, category, source, synced, updatedAt, serverId}) => ({id, text, category, source, synced, updatedAt, serverId})), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error("JSON must be an array");
      const normalized = data.map(o => ({
        id: o.id || `local-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
        text: o.text,
        category: o.category || "Imported",
        source: o.source || "local",
        synced: !!o.synced,
        updatedAt: o.updatedAt || Date.now(),
        serverId: o.serverId || null
      })).filter(o => o.text && o.category);
      quotes.push(...normalized);
      saveQuotes();
      populateCategories();
      showRandomQuote();
      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Failed to import JSON.");
    }
  };
  const file = event.target.files[0];
  if (file) fileReader.readAsText(file);
}

/**********************
 * Server Sync (Task 3)
 * - Simulate server with JSONPlaceholder
 * - Server data precedence by default
 **********************/
let autoSyncTimer = null;

// Simulate GET: fetch server "quotes"
async function fetchServerQuotes() {
  // We’ll map JSONPlaceholder posts to quotes
  const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=10");
  const posts = await res.json();
  // Map to quote shape; category simulated from userId to make filters interesting
  const mapped = posts.map(p => ({
    id: `server-${p.id}`,           // stable ID for conflict checks
    text: String(p.title || p.body).trim(),
    category: `ServerCat-${p.userId || 1}`,
    source: "server",
    synced: true,
    updatedAt: Date.now(),          // simulate freshness
    serverId: p.id
  })).filter(q => q.text);
  return mapped;
}

// Simulate POST: push unsynced local quotes to server
async function pushLocalQuotesToServer() {
  const unsynced = quotes.filter(q => q.source === "local" && !q.synced);
  if (unsynced.length === 0) return 0;

  let pushed = 0;
  for (const q of unsynced) {
    try {
      const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: q.text, body: q.category, userId: 1 })
      });
      const data = await res.json();
      // Mark as synced; assign a faux server id
      q.synced = true;
      q.serverId = data.id;
      q.updatedAt = Date.now();
      pushed++;
    } catch (e) {
      // leave as unsynced; continue
    }
  }
  if (pushed > 0) saveQuotes();
  return pushed;
}

// Merge logic with conflict detection
function mergeServerQuotes(serverQuotes) {
  // Conflicts defined as: same text (case-insensitive) exists locally but with different category
  const localByText = new Map();
  quotes.forEach(q => localByText.set(q.text.toLowerCase(), q));

  const conflicts = [];
  for (const s of serverQuotes) {
    const key = s.text.toLowerCase();
    const local = localByText.get(key);

    if (!local) {
      // New from server → add
      quotes.push(s);
      continue;
    }

    // If text matches but category differs → conflict
    if (local.category !== s.category) {
      // Default rule: server wins (but allow manual override)
      conflicts.push({ text: s.text, localCategory: local.category, serverCategory: s.category, localId: local.id, serverObj: s });
      // Apply default server-wins immediately; store local as backup for potential restore
      local._backup = { ...local };
      local.category = s.category;
      local.source = "server";
      local.synced = true;
      local.updatedAt = Date.now();
      local.serverId = s.serverId ?? s.id?.split("server-")[1] ?? null;
    } else {
      // Same data → ensure marked as synced/server
      local.source = "server";
      local.synced = true;
      if (!local.serverId) local.serverId = s.serverId ?? null;
    }
  }
  saveQuotes();
  return conflicts;
}

function renderConflicts(conflicts) {
  if (!conflicts.length) {
    conflictArea.style.display = "none";
    conflictList.innerHTML = "";
    return;
  }
  conflictArea.style.display = "block";
  conflictList.innerHTML = "";
  conflicts.forEach((c, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "conflict";
    wrap.innerHTML = `
      <h4>${idx + 1}. “${c.text}”</h4>
      <label><input type="radio" name="conf_${idx}" value="server" checked /> Keep <strong>Server</strong> category: <code>${c.serverCategory}</code></label><br/>
      <label><input type="radio" name="conf_${idx}" value="local" /> Keep <strong>Local</strong> category: <code>${c.localCategory}</code></label>
      <input type="hidden" id="conf_local_${idx}" value="${c.localId}">
      <textarea id="conf_server_${idx}" style="display:none;"></textarea>
    `;
    // store the serverObj for later in a dataset via hidden JSON
    wrap.querySelector(`#conf_server_${idx}`).textContent = JSON.stringify(c.serverObj);
    conflictList.appendChild(wrap);
  });

  applyResolutionsBtn.onclick = () => {
    const items = conflictList.querySelectorAll(".conflict");
    items.forEach((item, idx) => {
      const choice = item.querySelector(`input[name="conf_${idx}"]:checked`).value;
      const localId = item.querySelector(`#conf_local_${idx}`).value;
      const serverObj = JSON.parse(item.querySelector(`#conf_server_${idx}`).textContent);
      const local = quotes.find(q => q.id === localId);
      if (!local) return;

      if (choice === "local") {
        // Restore backup if present; otherwise keep local as-is
        if (local._backup) {
          Object.assign(local, { ...local._backup });
          delete local._backup;
        }
        local.synced = false;  // mark as needing push since it diverges from server
        local.source = "local";
        local.updatedAt = Date.now();
      } else {
        // Ensure server version applied
        local.category = serverObj.category;
        local.source = "server";
        local.synced = true;
        local.updatedAt = Date.now();
        local.serverId = serverObj.serverId ?? serverObj.id?.split("server-")[1] ?? null;
        if (local._backup) delete local._backup;
      }
    });
    saveQuotes();
    renderConflicts([]); // hide conflicts
    populateCategories();
    showRandomQuote();
    showStatus("Conflicts resolved.");
  };
}

async function syncNow() {
  try {
    showStatus("Sync in progress...");
    const pushed = await pushLocalQuotesToServer();
    const serverQuotes = await fetchServerQuotes();
    const conflicts = mergeServerQuotes(serverQuotes);
    renderConflicts(conflicts);
    populateCategories();
    showRandomQuote();
    showStatus(`Sync complete. Pushed ${pushed} local item(s). ${conflicts.length ? conflicts.length + " conflict(s) detected." : "No conflicts."}`);
  } catch (e) {
    showStatus("Sync failed. Check network.");
  }
}

function setAutoSync(enabled) {
  if (enabled) {
    if (autoSyncTimer) clearInterval(autoSyncTimer);
    autoSyncTimer = setInterval(syncNow, 30000); // 30s
    localStorage.setItem(LS_AUTO_SYNC, "1");
  } else {
    if (autoSyncTimer) clearInterval(autoSyncTimer);
    autoSyncTimer = null;
    localStorage.setItem(LS_AUTO_SYNC, "0");
  }
}

/**********************
 * Event Listeners & Init
 **********************/
newQuoteBtn.addEventListener("click", showRandomQuote);
exportBtn.addEventListener("click", exportToJsonFile);
importFile.addEventListener("change", importFromJsonFile);
syncNowBtn.addEventListener("click", syncNow);
autoSyncToggle.addEventListener("change", (e) => setAutoSync(e.target.checked));

createAddQuoteForm();
populateCategories();

// Restore last quote if present, else show one
const last = sessionStorage.getItem(SS_LAST_QUOTE);
if (last) {
  const q = JSON.parse(last);
  quoteDisplay.innerHTML = `<p><strong>${q.category}</strong>: “${q.text}”</p>`;
} else {
  showRandomQuote();
}

// Restore auto sync toggle
const autoSyncSaved = localStorage.getItem(LS_AUTO_SYNC) === "1";
autoSyncToggle.checked = autoSyncSaved;
setAutoSync(autoSyncSaved);
