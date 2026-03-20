const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");

dotenv.config();

const port = Number(process.env.PORT || 3000);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:8080";
const databaseUrl = process.env.DATABASE_URL || "postgres://chatapp:chatapp@localhost:5432/chatapp";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    methods: ["GET", "POST"]
  }
});

const pool = new Pool({
  connectionString: databaseUrl
});

// Track which users are online in each room.
const activeUsersByRoom = new Map();

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    // Healthcheck: confirm the database answer works.
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (_error) {
    res.status(500).json({ ok: false, error: "database not ready" });
  }
});

app.get("/api/rooms/:room/messages", async (req, res) => {
  const room = normalizeRoom(req.params.room);
  const result = await pool.query(
    `SELECT username, room_name AS room, message_text AS text, created_at
     FROM messages
     WHERE room_name = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [room]
  );

  res.json(result.rows.reverse());
});

app.get("/api/rooms/:room/active-users", (req, res) => {
  const room = normalizeRoom(req.params.room);
  res.json(getActiveUsers(room));
});

io.on("connection", (socket) => {
  socket.data.username = "Gast";
  socket.data.room = null;

  socket.on("set-username", async (payload, callback) => {
    try {
      const username = normalizeUsername(payload?.username);
      socket.data.username = username;
      await saveUser(username);

      if (socket.data.room) {
        addActiveUser(socket.id, socket.data.room, username);
        io.to(socket.data.room).emit("active-users", getActiveUsers(socket.data.room));
      }

      callback?.({ ok: true, username });
    } catch (_error) {
      callback?.({ ok: false, error: "Benutzername konnte nicht gespeichert werden." });
    }
  });

  socket.on("join-room", async (payload, callback) => {
    try {
      const room = normalizeRoom(payload?.room);
      const username = normalizeUsername(payload?.username || socket.data.username);
      const oldRoom = socket.data.room;

      socket.data.username = username;
      await saveUser(username);

      if (oldRoom) {
        socket.leave(oldRoom);
        removeActiveUser(socket.id, oldRoom);
        io.to(oldRoom).emit("active-users", getActiveUsers(oldRoom));
      }

      socket.join(room);
      socket.data.room = room;
      addActiveUser(socket.id, room, username);

      const messages = await getRecentMessages(room);
      socket.emit("chat-history", messages);
      io.to(room).emit("active-users", getActiveUsers(room));
      io.to(room).emit("system-message", {
        text: `${username} ist dem Raum beigetreten.`,
        createdAt: new Date().toISOString()
      });

      callback?.({ ok: true, room, username, messages, activeUsers: getActiveUsers(room) });
    } catch (_error) {
      callback?.({ ok: false, error: "Raum konnte nicht betreten werden." });
    }
  });

  socket.on("send-message", async (payload, callback) => {
    try {
      const room = normalizeRoom(payload?.room || socket.data.room);
      const username = normalizeUsername(payload?.username || socket.data.username);
      const text = normalizeMessage(payload?.text);

      if (!room) {
        callback?.({ ok: false, error: "Du bist noch in keinem Raum." });
        return;
      }

      const message = await saveMessage({ room, username, text });
      io.to(room).emit("new-message", message);
      callback?.({ ok: true });
    } catch (_error) {
      callback?.({ ok: false, error: "Nachricht konnte nicht gesendet werden." });
    }
  });

  socket.on("disconnect", () => {
    const room = socket.data.room;
    if (!room) {
      return;
    }

    removeActiveUser(socket.id, room);
    io.to(room).emit("active-users", getActiveUsers(room));
    io.to(room).emit("system-message", {
      text: `${socket.data.username} hat den Raum verlassen.`,
      createdAt: new Date().toISOString()
    });
  });
});

async function start() {
  await waitForDatabase();
  await createTables();
  server.listen(port, () => {
    console.log(`Server l�uft auf Port ${port}`);
  });
}

async function waitForDatabase() {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (_error) {
      console.log(`Warte auf Datenbank... Versuch ${attempt}`);
      await delay(2000);
    }
  }

  throw new Error("Datenbank ist nicht erreichbar.");
}

async function createTables() {
  // Create tables on startup if they do not exist yet.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(30) UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      room_name VARCHAR(50) NOT NULL,
      username VARCHAR(30) NOT NULL,
      message_text TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function saveUser(username) {
  await pool.query(
    `INSERT INTO users (username)
     VALUES ($1)
     ON CONFLICT (username) DO NOTHING`,
    [username]
  );
}

async function saveMessage({ room, username, text }) {
  // Store one chat message and return the saved row.
  const result = await pool.query(
    `INSERT INTO messages (room_name, username, message_text)
     VALUES ($1, $2, $3)
     RETURNING username, room_name AS room, message_text AS text, created_at`,
    [room, username, text]
  );

  return result.rows[0];
}

async function getRecentMessages(room) {
  const result = await pool.query(
    `SELECT username, room_name AS room, message_text AS text, created_at
     FROM messages
     WHERE room_name = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [room]
  );

  return result.rows.reverse();
}

function addActiveUser(socketId, room, username) {
  if (!activeUsersByRoom.has(room)) {
    activeUsersByRoom.set(room, new Map());
  }

  activeUsersByRoom.get(room).set(socketId, username);
}

function removeActiveUser(socketId, room) {
  const roomUsers = activeUsersByRoom.get(room);
  if (!roomUsers) {
    return;
  }

  roomUsers.delete(socketId);
  if (roomUsers.size === 0) {
    activeUsersByRoom.delete(room);
  }
}

function getActiveUsers(room) {
  const roomUsers = activeUsersByRoom.get(room);
  if (!roomUsers) {
    return [];
  }

  return Array.from(new Set(roomUsers.values())).sort();
}

function normalizeUsername(value) {
  return String(value || "Gast").trim().slice(0, 30) || "Gast";
}

function normalizeRoom(value) {
  return String(value || "allgemein").trim().slice(0, 50) || "allgemein";
}

function normalizeMessage(value) {
  const text = String(value || "").trim().slice(0, 500);
  if (!text) {
    throw new Error("empty message");
  }
  return text;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
