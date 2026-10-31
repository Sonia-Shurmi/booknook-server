const express = require("express");
const cors = require("cors");
const bookRoutes = require("./routes/bookRoutes");
const borrowRoutes = require("./routes/borrowRoutes");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

app.use(cors());
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

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`BookNook server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
  }
};

startServer();