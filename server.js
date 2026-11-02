
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
];

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

app.use("/books", bookRoutes);
app.use("/borrows", borrowRoutes);

app.get("/", (req, res) => {
  res.send("BookNook Server is Running!");
});

const startServer = async () => {
  try {
    const db = await connectDB();
    app.locals.db = db;

    // Create the unique index for active borrows once at startup
    await db.collection("borrows").createIndex(
      { bookId: 1, userEmail: 1 },
      {
        unique: true,
        partialFilterExpression: { status: "active" },
        name: "unique_active_borrow_per_user",
      }
    );

    console.log("Borrow indexes created successfully!");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`BookNook server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
  }
};

startServer();
