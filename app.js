require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./config/db");

db.query("SELECT 1")
  .then(() => console.log("DB Connected"))
  .catch((err) => console.error(err));

const app = express();
const PORT = process.env.PORT || 3000;

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// routes
const indexRoutes = require("./routes/index.routes");
app.use("/", indexRoutes);

// server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
