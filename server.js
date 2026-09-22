const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const produceRoutes = require("./routes/produceRoutes");
const userRoutes = require("./routes/userRoutes");
const bidRoutes = require("./routes/bidRoutes");
const aiRoutes = require("./routes/aiRoutes");
const logisticsRoutes = require("./routes/logisticsRoutes");

const app = express();

/* =========================================================
   CORS & MIDDLEWARE
========================================================= */
app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".onrender.com")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use(express.json({ limit: "10mb" }));

/* =========================================================
   ROUTES MOUNTING
========================================================= */
app.use("/api/auth", authRoutes);
app.use("/api", authRoutes); // Supports /api/login
app.use("/api/produce", produceRoutes);
app.use("/api", userRoutes); // Supports /api/buyers and /api/farmers
app.use("/api/bids", bidRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/logistics", logisticsRoutes);

/* =========================================================
   HEALTH CHECK
========================================================= */
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "AgriDirect AI backend is running"
  });
});

/* =========================================================
   CONNECT DATABASE & START SERVER
========================================================= */
const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 AgriDirect AI server running on port ${PORT}`);
  });
});