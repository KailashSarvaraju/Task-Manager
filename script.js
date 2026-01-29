// ---------- DATE CHECK ----------
const todayDate = new Date().toDateString();
const lastOpenDate = localStorage.getItem("lastOpenDate");

// ---------- DATA ----------
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let activeFilter = "all";

// ---------- ELEMENTS ----------
const taskInput = document.getElementById("taskInput");
const categorySelect = document.getElementById("categorySelect");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");

const totalCount = document.getElementById("totalCount");
const doneCount = document.getElementById("doneCount");
const focusPercent = document.getElementById("focusPercent");

const tabs = document.querySelectorAll(".tab");

const wrapBtn = document.getElementById("wrapDayBtn");
const wrapModal = document.getElementById("wrapModal");
const closeWrap = document.getElementById("closeWrap");
const streakEl = document.getElementById("streak");
const efficiencyEl = document.getElementById("efficiency");

const softReminder = document.getElementById("softReminder");
const notificationContainer = document.getElementById("notificationContainer");

// ---------- STORAGE ----------
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ---------- DAILY AUTO SHIFT (🔥 MAIN FIX) ----------
function handleNewDay() {
  if (lastOpenDate === todayDate) return;

  tasks = tasks.map(task => {
    // Yesterday TODAY → TOMORROW (if not completed)
    if (task.category === "today" && !task.completed) {
      return { ...task, category: "tomorrow" };
    }

    // Yesterday TOMORROW → TODAY
    if (task.category === "tomorrow") {
      return { ...task, category: "today" };
    }

    return task;
  });

  saveTasks();
  localStorage.setItem("lastOpenDate", todayDate);
}

// 🚀 RUN ON LOAD
handleNewDay();

// ---------- NOTIFICATIONS ----------
function showNotification(message, type = "success", duration = 3000) {
  const notif = document.createElement("div");
  notif.className = `notification ${type}`;
  notif.innerText = message;
  notificationContainer.appendChild(notif);

  setTimeout(() => notif.classList.add("show"), 10);

  setTimeout(() => {
    notif.classList.remove("show");
    setTimeout(() => notif.remove(), 400);
  }, duration);
}

// ---------- ADD TASK ----------
addTaskBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  const category = categorySelect.value;

  if (!text) {
    showNotification("Please enter a task!", "error");
    return;
  }

  const task = {
    id: Date.now(),
    title: text,
    category,
    completed: false
  };

  tasks.push(task);
  saveTasks();
  taskInput.value = "";
  renderTasks();

  showNotification("Task added ✅");
});

taskInput.addEventListener("keydown", e => {
  if (e.key === "Enter") addTaskBtn.click();
});

// ---------- TOGGLE ----------
function toggleTask(id) {
  tasks = tasks.map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  saveTasks();
  renderTasks();
}

// ---------- DELETE ----------
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
  showNotification("Task deleted 🗑️", "error");
}

// ---------- FILTERS ----------
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeFilter = tab.dataset.type;
    renderTasks();
  });
});

// ---------- RENDER ----------
function renderTasks() {
  taskList.innerHTML = "";

  let filtered = tasks;
  if (activeFilter === "completed") filtered = tasks.filter(t => t.completed);
  else if (activeFilter !== "all") filtered = tasks.filter(t => t.category === activeFilter);

  emptyState.style.display = filtered.length ? "none" : "block";

  filtered.forEach(task => {
    const li = document.createElement("li");
    li.className = "task-item";

    li.innerHTML = `
      <div class="task-left">
        <input type="checkbox" ${task.completed ? "checked" : ""} />
        <span class="${task.completed ? "completed" : ""}">${task.title}</span>
      </div>
      <button class="delete-btn">🗑️</button>
    `;

    li.querySelector("input").addEventListener("change", () => toggleTask(task.id));
    li.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id));

    taskList.appendChild(li);
  });

  updateStats();
}

// ---------- STATS ----------
function updateStats() {
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;

  totalCount.innerText = total;
  doneCount.innerText = done;
  focusPercent.innerText = total ? Math.round((done / total) * 100) + "%" : "0%";
}

// ---------- WRAP DAY ----------
let wrapData = JSON.parse(localStorage.getItem("wrapData")) || { streak: 0, lastDate: null };

wrapBtn.addEventListener("click", () => {
  const todayTasks = tasks.filter(t => t.category === "today");
  const doneToday = todayTasks.filter(t => t.completed).length;
  const efficiency = todayTasks.length
    ? Math.round((doneToday / todayTasks.length) * 100)
    : 0;

  if (wrapData.lastDate !== todayDate) {
    wrapData.streak++;
    wrapData.lastDate = todayDate;
  }

  localStorage.setItem("wrapData", JSON.stringify(wrapData));

  streakEl.innerText = wrapData.streak + " days";
  efficiencyEl.innerText = efficiency + "%";

  wrapModal.classList.remove("hidden");
});

closeWrap.addEventListener("click", () => wrapModal.classList.add("hidden"));

// ---------- SOFT REMINDER ----------
function checkSoftReminder() {
  if (new Date().getHours() < 19) return;
  if (localStorage.getItem("lastReminder") === todayDate) return;

  const doneToday = tasks.some(t => t.category === "today" && t.completed);
  if (!doneToday) {
    softReminder.innerText = "You haven’t completed any tasks today 💪";
    softReminder.classList.remove("hidden");
    localStorage.setItem("lastReminder", todayDate);
  }
}

checkSoftReminder();
setInterval(checkSoftReminder, 60 * 60 * 1000);

// ---------- DARK MODE ----------
const darkToggle = document.getElementById("darkModeToggle");

if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark");
  darkToggle.textContent = "☀️";
}

darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const enabled = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", enabled ? "enabled" : "disabled");
  darkToggle.textContent = enabled ? "☀️" : "🌙";
});

// ---------- INIT ----------
renderTasks();
// ---------- MIDNIGHT AUTO REFRESH ----------
function scheduleMidnightRefresh() {
  const now = new Date();
  const midnight = new Date();

  midnight.setHours(24, 0, 0, 0); // next midnight
  const timeUntilMidnight = midnight - now;

  setTimeout(() => {
    handleNewDay();   // reuse your daily logic
    renderTasks();   // refresh UI
    showNotification("New day started 🌅");
// optional but safest

    // Schedule again for next day
    scheduleMidnightRefresh();
  }, timeUntilMidnight);
}

// Start midnight watcher
scheduleMidnightRefresh();
