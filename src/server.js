require("dotenv").config();
const http = require("http");
const express = require("express");
const { engine } = require("express-handlebars");
const path = require("path");
const connectDB = require("./config/database");
const { initWebSocket } = require("./config/websocket");

const app = express();
const server = http.createServer(app);

// Conectar MongoDB
connectDB();

// Inicializar WebSocket sobre el mismo servidor HTTP
initWebSocket(server);

// ======= Handlebars =======
app.engine(
  "handlebars",
  engine({
    layoutsDir: path.join(__dirname, "views/layouts"),
    partialsDir: path.join(__dirname, "views/partials"),
    defaultLayout: "main",
    helpers: {
      gt: (a, b) => a > b,
      eq: (a, b) => a === b,
      json: (obj) => JSON.stringify(obj),
    },
  }),
);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// ======= Middlewares =======
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ======= Rutas de Vistas (Handlebars) =======
app.use("/", require("./routes/views"));

// ======= Rutas API REST =======
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/carts", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));

// Health check
app.get("/api/health", (req, res) => {
  const { getConnectedClients } = require("./config/websocket");
  res.json({
    success: true,
    message: "🛒 Shopping Cart API funcionando.",
    wsClients: getConnectedClients(),
    timestamp: new Date(),
  });
});

// 404
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res
      .status(404)
      .json({
        success: false,
        message: `Ruta ${req.originalUrl} no encontrada.`,
      });
  }
  res.status(404).send("<h1>404 — Página no encontrada</h1>");
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ success: false, message: "Error interno del servidor." });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
  console.log(`🖼️  Vistas Handlebars en http://localhost:${PORT}/`);
  console.log(`🔌 WebSocket activo en ws://localhost:${PORT}`);
  console.log(`📋 API REST en http://localhost:${PORT}/api/health`);
});
