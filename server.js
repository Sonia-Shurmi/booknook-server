
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const bookRoutes = require("./routes/bookRoutes");
const borrowRoutes = require("./routes/borrowRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());

// Server health check (does not depend on MongoDB)
app.get("/", (req, res) => {
  res.status(200).send("BookNook Server is Running!");
});

// Initialize MongoDB once and reuse it
let dbInitialization;

const initializeDB = () => {
  if (!dbInitialization) {
    dbInitialization = (async () => {
      const db = await connectDB();

      await db.collection("borrows").createIndex(
        { bookId: 1, userEmail: 1 },
        {
          unique: true,
          partialFilterExpression: { status: "active" },
          name: "unique_active_borrow_per_user",
        }
      );

      app.locals.db = db;

      console.log("MongoDB and borrow indexes initialized!");

      return db;
    })().catch((error) => {
      dbInitialization = null;
      throw error;
    });
  }

  return dbInitialization;
};

// Ensure database initialization before handling API requests
app.use(async (req, res, next) => {
  try {
    await initializeDB();
    next();
  } catch (error) {
    console.error("Database initialization failed:", error.message);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

app.use("/books", bookRoutes);
app.use("/borrows", borrowRoutes);

// Export Express app for Vercel
module.exports = app;

// Start a local server only during local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`BookNook server is running on port ${PORT}`);
  });
}
