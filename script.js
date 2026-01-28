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

// ---------- LOCAL STORAGE HELPERS ----------
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

let wrapData = JSON.parse(localStorage.getItem("wrapData")) || {
  streak: 0,
  lastDate: null
};

// ---------- CARRY OVER TODAY → TOMORROW ----------
function carryOverTasks() {
  tasks = tasks.map(task => {
    if (task.category === "today" && !task.completed) {
      return { ...task, category: "tomorrow" };
    }
    return task;
  });
  saveTasks();
}

// ---------- NEW DAY CHECK ----------
if (lastOpenDate !== todayDate) {
  carryOverTasks();
  localStorage.setItem("lastOpenDate", todayDate);
}

// ---------- NOTIFICATIONS ----------
function showNotification(message, type = "success", duration = 3000) {
  const notif = document.createElement("div");
  notif.className = `notification ${type}`;
  notif.innerText = message;
  notificationContainer.appendChild(notif);

  setTimeout(() => notif.classList.add("show"), 10);

  setTimeout(() => {
    notif.classList.remove("show");
    setTimeout(() => notif.remove(), 500);
  }, duration);
}

// ---------- ADD TASK ----------
addTaskBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  const category = categorySelect.value;

  if (text === "") return showNotification("Please enter a task!", "error");

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

  showNotification(`Task "${task.title}" added!`);
});

// Quick Add with Enter key
taskInput.addEventListener("keydown", e => {
  if (e.key === "Enter") addTaskBtn.click();
});

// ---------- TOGGLE TASK ----------
function toggleTask(id) {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();

  const task = tasks.find(t => t.id === id);
  showNotification(
    `Task "${task.title}" marked as ${task.completed ? "completed" : "incomplete"}`,
    "info"
  );
}

// ---------- DELETE TASK ----------
function deleteTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return;

  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();

  showNotification(`Task "${task.title}" deleted!`, "error");
}

// ---------- FILTER TABS ----------
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeFilter = tab.dataset.type;
    renderTasks();
  });
});

// ---------- RENDER TASKS ----------
function renderTasks() {
  taskList.innerHTML = "";

  let filteredTasks = tasks;
  if (activeFilter === "completed") filteredTasks = tasks.filter(t => t.completed);
  else if (activeFilter !== "all") filteredTasks = tasks.filter(t => t.category === activeFilter);

  // Empty state
  if (filteredTasks.length === 0) {
    emptyState.style.display = "block";
    emptyState.innerText =
      activeFilter === "completed" ? "No completed tasks yet ✅" : "No tasks here 🎉";
  } else {
    emptyState.style.display = "none";
  }

  // Task list
  filteredTasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.innerHTML = `
      <div class="task-left">
        <input type="checkbox" ${task.completed ? "checked" : ""} />
        <span class="${task.completed ? "completed" : ""}">${task.title}</span>
      </div>
      <button class="delete-btn">✕</button>
    `;

    li.querySelector("input[type='checkbox']").addEventListener("change", () => toggleTask(task.id));
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
  focusPercent.innerText = total === 0 ? "0%" : Math.round((done / total) * 100) + "%";
}

// ---------- WRAP MY DAY ----------
wrapBtn.addEventListener("click", () => {
  const today = new Date().toDateString();

  const todayTasks = tasks.filter(t => t.category === "today");
  const doneToday = todayTasks.filter(t => t.completed).length;
  const efficiency = todayTasks.length === 0 ? 0 : Math.round((doneToday / todayTasks.length) * 100);

  if (wrapData.lastDate !== today) {
    wrapData.streak += 1;
    wrapData.lastDate = today;
  }

  localStorage.setItem("wrapData", JSON.stringify(wrapData));

  streakEl.innerText = wrapData.streak + " days";
  efficiencyEl.innerText = efficiency + "%";

  wrapModal.classList.remove("hidden");
});

closeWrap.addEventListener("click", () => wrapModal.classList.add("hidden"));

// ---------- SOFT REMINDER ----------
function checkSoftReminder() {
  const now = new Date();
  if (now.getHours() < 19) return;

  const today = new Date().toDateString();
  if (localStorage.getItem("lastReminder") === today) return;

  const completedToday = tasks.filter(t => t.category === "today" && t.completed);
  if (completedToday.length === 0) {
    softReminder.innerText = "Hey! You haven’t completed any tasks today. Stay on track! 💪";
    softReminder.classList.remove("hidden");
    localStorage.setItem("lastReminder", today);
  }
}

// Run reminders
checkSoftReminder();
setInterval(checkSoftReminder, 60 * 60 * 1000);

// ---------- INIT ----------
renderTasks();
