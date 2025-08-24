// ========================
// Quotes App with Sync + Conflict Handling
// ========================

let quotes = [];
let lastViewedQuoteIndex = null;

// Load quotes from localStorage on init
function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  quotes = storedQuotes ? JSON.parse(storedQuotes) : [
    { text: "The only way to do great work is to love what you do.", category: "Motivation" },
    { text: "In the middle of every difficulty lies opportunity.", category: "Inspiration" }
  ];
  saveQuotes();
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ========================
// Quote Display
// ========================
function displayRandomQuote() {
  if (quotes.length === 0) return;
  const index = Math.floor(Math.random() * quotes.length);
  const quote = quotes[index];
  document.getElementById("quoteDisplay").innerHTML = `<p>${quote.text}</p><small>— ${quote.category}</small>`;
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
  lastViewedQuoteIndex = index;
}

// ========================
// Add Quote Form
// ========================
function createAddQuoteForm() {
  const formContainer = document.getElementById("addQuoteForm");
  formContainer.innerHTML = `
    <h3>Add a New Quote</h3>
    <input type="text" id="newQuoteText" placeholder="Enter quote text" />
    <input type="text" id="newQuoteCategory" placeholder="Enter category" />
    <button onclick="addQuote()">Add Quote</button>
  `;
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) {
    alert("Please provide both text and category.");
    return;
  }
  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  alert("Quote added successfully!");
}

// ========================
// Category Filtering
// ========================
function populateCategories() {
  const filter = document.getElementById("categoryFilter");
  const categories = ["all", ...new Set(quotes.map(q => q.category))];

  filter.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join("");

  const savedCategory = localStorage.getItem("selectedCategory");
  if (savedCategory && categories.includes(savedCategory)) {
    filter.value = savedCategory;
  }
}

function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);

  const filtered = selectedCategory === "all" ? quotes : quotes.filter(q => q.category === selectedCategory);
  if (filtered.length === 0) {
    document.getElementById("quoteDisplay").innerHTML = "<p>No quotes in this category.</p>";
  } else {
    const index = Math.floor(Math.random() * filtered.length);
    const quote = filtered[index];
    document.getElementById("quoteDisplay").innerHTML = `<p>${quote.text}</p><small>— ${quote.category}</small>`;
  }
}

// ========================
// JSON Import/Export
// ========================
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();

  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format.");
      }
    } catch (err) {
      alert("Error reading file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// ========================
// Sync & Conflict Handling
// ========================
async function syncWithServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const serverData = await response.json();

    // Simulate server quotes
    const serverQuotes = serverData.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));

    // Check for conflicts
    const conflicts = serverQuotes.filter(sq => quotes.some(lq => lq.text === sq.text));
    if (conflicts.length > 0) {
      showConflictResolver(conflicts);
    } else {
      quotes.push(...serverQuotes);
      saveQuotes();
      showNotification("Quotes synced with server.");
    }
  } catch (err) {
    showNotification("Error syncing with server.");
  }
}

function showNotification(message) {
  document.getElementById("notification").textContent = message;
}

function showConflictResolver(conflicts) {
  const container = document.getElementById("conflictResolverContainer");
  container.innerHTML = "<h3>Conflict Detected</h3>";

  conflicts.forEach(conflict => {
    const div = document.createElement("div");
    div.innerHTML = `
      <p>${conflict.text}</p>
      <button onclick="resolveConflict(${JSON.stringify(conflict).replace(/"/g, '&quot;')}, 'keepLocal')">Keep Local</button>
      <button onclick="resolveConflict(${JSON.stringify(conflict).replace(/"/g, '&quot;')}, 'useServer')">Use Server</button>
    `;
    container.appendChild(div);
  });
}

function resolveConflict(conflict, choice) {
  if (choice === "useServer") {
    quotes = quotes.filter(q => q.text !== conflict.text);
    quotes.push(conflict);
  }
  saveQuotes();
  document.getElementById("conflictResolverContainer").innerHTML = "";
  showNotification("Conflict resolved.");
}

// ========================
// Init
// ========================
document.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
  createAddQuoteForm();
  populateCategories();

  // Restore last viewed quote if available
  const lastQuote = sessionStorage.getItem("lastViewedQuote");
  if (lastQuote) {
    const quote = JSON.parse(lastQuote);
    document.getElementById("quoteDisplay").innerHTML = `<p>${quote.text}</p><small>— ${quote.category}</small>`;
  }

  document.getElementById("newQuoteBtn").addEventListener("click", displayRandomQuote);

  // Periodic sync (every 30 seconds)
  setInterval(syncWithServer, 30000);
});
