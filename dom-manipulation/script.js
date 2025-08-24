// Quotes array with objects containing text and category
let quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Success is not the key to happiness. Happiness is the key to success.", category: "Success" },
  { text: "In the middle of every difficulty lies opportunity.", category: "Wisdom" }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");

// Function to display a random quote
function showRandomQuote() {
  if (!Array.isArray(quotes) || quotes.length === 0) {
    quoteDisplay.innerHTML = "<em>No quotes available. Please add one!</em>";
    return;
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const { text, category } = quotes[randomIndex];
  quoteDisplay.innerHTML = `<p><strong>${category}</strong>: “${text}”</p>`;
}

// Function to add a new quote
function addQuote() {
  const quoteText = document.getElementById("newQuoteText").value.trim();
  const quoteCategory = document.getElementById("newQuoteCategory").value.trim();

  if (quoteText === "" || quoteCategory === "") {
    alert("Please fill in both fields!");
    return;
  }

  // Add new quote to array
  quotes.push({ text: quoteText, category: quoteCategory });

  // Update DOM immediately with new quote
  quoteDisplay.innerHTML = `<p><strong>${quoteCategory}</strong>: “${quoteText}”</p>`;

  // Clear input fields
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

// Function to dynamically create the Add Quote form
function createAddQuoteForm() {
  const formContainer = document.getElementById("formContainer");

  // Input for quote text
  const textInput = document.createElement("input");
  textInput.id = "newQuoteText";
  textInput.type = "text";
  textInput.placeholder = "Enter a new quote";

  // Input for category
  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  // Button to add quote
  const addButton = document.createElement("button");
  addButton.id = "addQuoteBtn";
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", addQuote);

  // Append to form container
  formContainer.appendChild(textInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);
}

// Event listener for showing random quotes
newQuoteBtn.addEventListener("click", showRandomQuote);

// Build form dynamically on page load
createAddQuoteForm();

// Show one quote on load
showRandomQuote();
