const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads folder if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

// Middleware
app.use(cors());
app.use(express.static("public")); // ✅ Serve frontend files
app.use("/uploads", express.static(uploadsDir)); // ✅ Serve uploaded files

// Multer setup for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// File upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send("No file uploaded");

  const fileUrl = `/uploads/${file.filename}`;
  io.emit("file", { url: fileUrl, type: file.mimetype }); // Broadcast to all clients
  res.send({ status: "ok", url: fileUrl });
});

// Socket.IO messaging
io.on("connection", (socket) => {
  console.log("✅ New user connected");

  socket.on("chat", (msg) => {
    io.emit("chat", msg); // Broadcast chat to all users
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
