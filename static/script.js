// -------------- THEME TOGGLE --------------
const themeToggleBtn = document.getElementById("themeToggle");
const rootHtml = document.documentElement;

function loadTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  rootHtml.setAttribute("data-theme", saved);
}
function toggleTheme() {
  const now = rootHtml.getAttribute("data-theme") === "dark" ? "light" : "dark";
  rootHtml.setAttribute("data-theme", now);
  localStorage.setItem("theme", now);
}
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", toggleTheme);
}
loadTheme();

// -------------- CLOCK + DATE + TOGGLE FORMAT --------------
let use24Hour = JSON.parse(localStorage.getItem("use24Hour") || "false");

const toggleFormatBtn = document.getElementById("toggleFormatBtn");
const clockDisplay = document.getElementById("clockDisplay");
const dateDisplay = document.getElementById("dateDisplay");
const tzDisplay = document.getElementById("tzDisplay");

function updateClock() {
  const now = new Date();

  // Format time
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();

  // pad with leading zero
  function pad2(x) { return x.toString().padStart(2, "0"); }

  let displayStr;
  if (use24Hour) {
    displayStr = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  } else {
    let suffix = hours >= 12 ? "PM" : "AM";
    let hr12 = hours % 12;
    if (hr12 === 0) hr12 = 12;
    displayStr = `${pad2(hr12)}:${pad2(minutes)}:${pad2(seconds)} ${suffix}`;
  }
  if (clockDisplay) clockDisplay.textContent = displayStr;

  // Date string
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  if (dateDisplay) dateDisplay.textContent = dateStr;

  // TZ
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (tzDisplay) tzDisplay.textContent = tz;
}

if (toggleFormatBtn) {
  function syncToggleBtnLabel() {
    toggleFormatBtn.textContent = use24Hour ? "12h" : "24h";
  }
  syncToggleBtnLabel();
  toggleFormatBtn.addEventListener("click", () => {
    use24Hour = !use24Hour;
    localStorage.setItem("use24Hour", JSON.stringify(use24Hour));
    syncToggleBtnLabel();
    updateClock();
  });
}

// tick every second
setInterval(updateClock, 1000);
updateClock();

// -------------- STOPWATCH --------------
let stopwatchInterval = null;
let startTime = null;
let elapsedMs = 0; // keep elapsed so pause/resume works

const startStopwatchBtn = document.getElementById("startStopwatchBtn");
const resetStopwatchBtn = document.getElementById("resetStopwatchBtn");
const stopwatchDisplay = document.getElementById("stopwatchDisplay");

function renderStopwatch(ms) {
  // mm:ss.d
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 10);

  const mStr = minutes.toString().padStart(2, "0");
  const sStr = seconds.toString().padStart(2, "0");
  stopwatchDisplay.textContent = `${mStr}:${sStr}.${tenths}`;
}

function startStopwatch() {
  if (stopwatchInterval) {
    // pause
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
    const now = performance.now();
    elapsedMs += now - startTime;
    startStopwatchBtn.textContent = "Resume Stopwatch";
  } else {
    // start or resume
    startTime = performance.now();
    stopwatchInterval = setInterval(() => {
      const now = performance.now();
      const total = elapsedMs + (now - startTime);
      renderStopwatch(total);
    }, 100);
    startStopwatchBtn.textContent = "Pause Stopwatch";
  }
}

function resetStopwatch() {
  clearInterval(stopwatchInterval);
  stopwatchInterval = null;
  elapsedMs = 0;
  renderStopwatch(0);
  startStopwatchBtn.textContent = "Start Stopwatch";
}

if (startStopwatchBtn && resetStopwatchBtn) {
  startStopwatchBtn.addEventListener("click", startStopwatch);
  resetStopwatchBtn.addEventListener("click", resetStopwatch);
}
renderStopwatch(0);

// -------------- WEATHER (Open-Meteo) --------------
const weatherCityInput = document.getElementById("weatherCity");
const refreshWeatherBtn = document.getElementById("refreshWeatherBtn");

function renderWeather(data) {
  const body = document.getElementById("weatherBody");
  if (!body) return;
  body.querySelector(".weather-temp").textContent =
    data.temp !== null ? `${data.temp}°C` : "--°";
  body.querySelector(".weather-desc").textContent =
    `${data.city} — Wind ${data.wind_speed} m/s`;
  body.querySelector(".weather-extra").innerHTML =
    `<span>Humidity: ${data.humidity}%</span>`;
}

async function loadWeather() {
  const city = weatherCityInput.value.trim() || "Chennai";
  try {
    const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    const data = await res.json();
    renderWeather(data);
  } catch (err) {
    renderWeather({
      city: city,
      temp: null,
      humidity: null,
      wind_speed: null,
    });
  }
}

if (refreshWeatherBtn && weatherCityInput) {
  refreshWeatherBtn.addEventListener("click", loadWeather);
  loadWeather();
}

// -------------- QUOTE --------------
const refreshQuoteBtn = document.getElementById("refreshQuoteBtn");
const quoteText = document.getElementById("quoteText");
const quoteAuthor = document.getElementById("quoteAuthor");

async function loadQuote() {
  try {
    const res = await fetch("/api/quote");
    const data = await res.json();
    quoteText.textContent = "“" + data.content + "”";
    quoteAuthor.textContent = "— " + data.author;
  } catch (err) {
    quoteText.textContent = "“Stay steady. Keep building.”";
    quoteAuthor.textContent = "— Unknown";
  }
}

if (refreshQuoteBtn) {
  refreshQuoteBtn.addEventListener("click", loadQuote);
  loadQuote();
}

// -------------- TODO LIST (localStorage) --------------
const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");

function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem("todos") || "[]");
  } catch {
    return [];
  }
}
function saveTodos(todos) {
  localStorage.setItem("todos", JSON.stringify(todos));
}
function renderTodos() {
  const todos = loadTodos();
  todoList.innerHTML = "";
  todos.forEach((t, idx) => {
    const li = document.createElement("li");
    li.className = "todo-item";

    const left = document.createElement("div");
    left.className = "todo-left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = t.done;
    checkbox.addEventListener("change", () => {
      todos[idx].done = checkbox.checked;
      saveTodos(todos);
      renderTodos();
    });

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = t.text;
    if (t.done) text.classList.add("done");

    left.appendChild(checkbox);
    left.appendChild(text);

    const delBtn = document.createElement("button");
    delBtn.className = "btn tiny ghost";
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", () => {
      todos.splice(idx, 1);
      saveTodos(todos);
      renderTodos();
    });

    li.appendChild(left);
    li.appendChild(delBtn);
    todoList.appendChild(li);
  });
}
if (todoForm) {
  todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;
    const todos = loadTodos();
    todos.push({ text, done: false });
    saveTodos(todos);
    todoInput.value = "";
    renderTodos();
  });
  renderTodos();
}
