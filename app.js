require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./config/db");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "benchwala_secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// routes
const indexRoutes = require("./routes/index.routes");
app.use("/", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/", authRoutes);

const dashboardRoutes = require("./routes/dashboard.routes");
app.use("/", dashboardRoutes);

const examRoutes = require("./routes/exam.routes");
app.use("/", examRoutes);

// server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
