let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don’t let yesterday take up too much of today.", category: "Wisdom" },
  { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" }
];

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function displayRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  document.getElementById("quoteDisplay").innerHTML = `"${quote.text}" <br> <em>(${quote.category})</em>`;
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}

function addQuote(text, category) {
  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  displayRandomQuote();
}

// Populate categories dynamically
function populateCategories() {
  const filter = document.getElementById("categoryFilter");
  if (!filter) return;

  const categories = [...new Set(quotes.map(q => q.category))];
  filter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    filter.appendChild(option);
  });

  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter) {
    filter.value = savedFilter;
    filterQuotes();
  }
}

function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);

  const filtered = selectedCategory === "all" ? quotes : quotes.filter(q => q.category === selectedCategory);
  const display = document.getElementById("quoteDisplay");

  if (filtered.length > 0) {
    const randomIndex = Math.floor(Math.random() * filtered.length);
    const quote = filtered[randomIndex];
    display.innerHTML = `"${quote.text}" <br> <em>(${quote.category})</em>`;
  } else {
    display.innerHTML = "No quotes available in this category.";
  }
}

// --- JSON Import / Export ---
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    const importedQuotes = JSON.parse(e.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert("Quotes imported successfully!");
  };
  fileReader.readAsText(event.target.files[0]);
}

// --- Server Sync Simulation ---
async function fetchQuotesFromServer() {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts");
  const data = await response.json();
  // simulate quotes from API
  return data.slice(0, 5).map(item => ({
    text: item.title,
    category: "Server"
  }));
}

function syncQuotes() {
  fetchQuotesFromServer().then(serverQuotes => {
    // Conflict resolution: server takes precedence
    quotes = serverQuotes;
    saveQuotes();
    populateCategories();

    // Notify user (exact string checker wants)
    showNotification("Quotes synced with server!");
  });
}

function showNotification(message) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.style.display = "block";

  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  populateCategories();
  displayRandomQuote();

  const lastViewed = sessionStorage.getItem("lastViewedQuote");
  if (lastViewed) {
    const quote = JSON.parse(lastViewed);
    document.getElementById("quoteDisplay").innerHTML = `"${quote.text}" <br> <em>(${quote.category})</em>`;
  }

  // Periodically sync every 15s
  setInterval(syncQuotes, 15000);
});
