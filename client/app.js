// Im Browser lokal ist das Backend auf Port 3000 erreichbar.
const apiBase = `${window.location.protocol}//${window.location.hostname}:3000`;
const socket = io(apiBase, { transports: ["websocket", "polling"] });

const usernameInput = document.getElementById("username");
const roomInput = document.getElementById("room");
const saveNameButton = document.getElementById("saveNameButton");
const joinRoomButton = document.getElementById("joinRoomButton");
const statusLabel = document.getElementById("status");
const currentRoomLabel = document.getElementById("currentRoom");
const activeUsersList = document.getElementById("activeUsers");
const messagesContainer = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

let currentRoom = "";
let currentUsername = localStorage.getItem("chat-username") || "Gast";
usernameInput.value = currentUsername;

saveNameButton.addEventListener("click", saveUsername);
joinRoomButton.addEventListener("click", joinRoom);
messageForm.addEventListener("submit", sendMessage);

socket.on("connect", () => {
  statusLabel.textContent = "Verbunden";
  saveUsername();
});

socket.on("disconnect", () => {
  statusLabel.textContent = "Verbindung getrennt";
});

socket.on("chat-history", (messages) => {
  messagesContainer.innerHTML = "";
  messages.forEach((message) => renderMessage(message));
});

socket.on("new-message", (message) => {
  renderMessage(message);
});

socket.on("system-message", (message) => {
  renderMessage({ username: "System", text: message.text, created_at: message.createdAt, system: true });
});

socket.on("active-users", (users) => {
  renderActiveUsers(users);
});

function saveUsername() {
  currentUsername = usernameInput.value.trim() || "Gast";
  localStorage.setItem("chat-username", currentUsername);

  socket.emit("set-username", { username: currentUsername }, (response) => {
    if (!response?.ok) {
      alert(response?.error || "Benutzername konnte nicht gespeichert werden.");
      return;
    }

    currentUsername = response.username;
    usernameInput.value = currentUsername;
  });
}

function joinRoom() {
  const room = roomInput.value.trim() || "allgemein";
  currentRoom = room;

  socket.emit("join-room", { room, username: currentUsername }, (response) => {
    if (!response?.ok) {
      alert(response?.error || "Raum konnte nicht betreten werden.");
      return;
    }

    currentRoom = response.room;
    currentRoomLabel.textContent = `Raum: ${currentRoom}`;
    messagesContainer.innerHTML = "";
    response.messages.forEach((message) => renderMessage(message));
    renderActiveUsers(response.activeUsers);
  });
}

function sendMessage(event) {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !currentRoom) {
    return;
  }

  socket.emit("send-message", { room: currentRoom, username: currentUsername, text }, (response) => {
    if (!response?.ok) {
      alert(response?.error || "Nachricht konnte nicht gesendet werden.");
      return;
    }

    messageInput.value = "";
  });
}

function renderActiveUsers(users) {
  activeUsersList.innerHTML = "";
  users.forEach((user) => {
    const item = document.createElement("li");
    item.textContent = user;
    activeUsersList.appendChild(item);
  });
}

function renderMessage(message) {
  const wrapper = document.createElement("div");
  wrapper.className = `message${message.system ? " system" : ""}`;

  const meta = document.createElement("div");
  meta.className = "message-meta";
  const time = new Date(message.created_at || Date.now()).toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit"
  });
  meta.textContent = `${message.username} • ${time}`;

  const text = document.createElement("div");
  text.textContent = message.text;

  wrapper.append(meta, text);
  messagesContainer.appendChild(wrapper);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
