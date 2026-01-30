console.log("✅ Task Planner JS Loaded");

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
const darkToggle = document.getElementById("darkModeToggle");

// ---------- STORAGE ----------
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ---------- DAILY AUTO SHIFT (FIXED) ----------
function handleNewDay() {
  const todayDate = new Date().toDateString();
  const lastOpenDate = localStorage.getItem("lastOpenDate");

  if (lastOpenDate === todayDate) return;

  tasks = tasks.map(task => {
    if (task.category === "today" && !task.completed) {
      return { ...task, category: "tomorrow" };
    }
    if (task.category === "tomorrow") {
      return { ...task, category: "today" };
    }
    return task;
  });

  saveTasks();
  localStorage.setItem("lastOpenDate", todayDate);
}

// Run on load
handleNewDay();

// ---------- NOTIFICATIONS ----------
function showNotification(msg, type = "success", time = 3000) {
  const n = document.createElement("div");
  n.className = `notification ${type}`;
  n.innerText = msg;
  notificationContainer.appendChild(n);

  setTimeout(() => n.classList.add("show"), 10);
  setTimeout(() => {
    n.classList.remove("show");
    setTimeout(() => n.remove(), 300);
  }, time);
}

// ---------- ADD TASK ----------
addTaskBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  if (!text) return showNotification("Enter a task!", "error");

  tasks.push({
    id: Date.now(),
    title: text,
    category: categorySelect.value,
    completed: false
  });

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
  else if (activeFilter !== "all")
    filtered = tasks.filter(t => t.category === activeFilter);

  emptyState.style.display = filtered.length ? "none" : "block";

  filtered.forEach(task => {
    const li = document.createElement("li");
    li.className = "task-item";

    li.innerHTML = `
      <div class="task-left">
        <input type="checkbox" ${task.completed ? "checked" : ""}>
        <span class="${task.completed ? "completed" : ""}">
          ${task.title || task.text}
        </span>
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
let wrapData = JSON.parse(localStorage.getItem("wrapData")) || {
  streak: 0,
  lastDate: null
};

wrapBtn.addEventListener("click", () => {
  const today = new Date().toDateString();
  const todayTasks = tasks.filter(t => t.category === "today");
  const doneToday = todayTasks.filter(t => t.completed).length;

  if (wrapData.lastDate !== today) {
    wrapData.streak++;
    wrapData.lastDate = today;
  }

  localStorage.setItem("wrapData", JSON.stringify(wrapData));

  streakEl.innerText = wrapData.streak + " days";
  efficiencyEl.innerText = todayTasks.length
    ? Math.round((doneToday / todayTasks.length) * 100) + "%"
    : "0%";

  wrapModal.classList.remove("hidden");
});

closeWrap.addEventListener("click", () => wrapModal.classList.add("hidden"));

// ---------- SOFT REMINDER ----------
function checkSoftReminder() {
  const today = new Date().toDateString();
  if (new Date().getHours() < 19) return;
  if (localStorage.getItem("lastReminder") === today) return;

  if (!tasks.some(t => t.category === "today" && t.completed)) {
    softReminder.innerText = "You haven’t completed any tasks today 💪";
    softReminder.classList.remove("hidden");
    localStorage.setItem("lastReminder", today);
  }
}

checkSoftReminder();
setInterval(checkSoftReminder, 60 * 60 * 1000);

// ---------- MIDNIGHT AUTO REFRESH ----------
function scheduleMidnightRefresh() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  setTimeout(() => {
    handleNewDay();
    renderTasks();
    showNotification("New day started 🌅");
    scheduleMidnightRefresh();
  }, midnight - now);
}

scheduleMidnightRefresh();

// ---------- TAB RETURN FIX ----------
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    handleNewDay();
    renderTasks();
  }
});

// ---------- DARK MODE ----------
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
