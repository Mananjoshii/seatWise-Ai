require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./config/db");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 80;

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1);

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

const classroomRoutes = require("./routes/classroom.routes");
app.use("/", classroomRoutes);

const examDepartmentRoutes = require("./routes/examDepartment.routes");
app.use("/", examDepartmentRoutes);

const examClassroomRoutes = require("./routes/examClassroom.routes");
app.use("/", examClassroomRoutes);

const seatAllocationRoutes = require("./routes/seatAllocation.routes");
app.use("/", seatAllocationRoutes);

const studentRoutes = require("./routes/student.routes");
app.use("/", studentRoutes);

const allocationRoutes = require("./routes/allocation.routes");
app.use("/", allocationRoutes);

const staffAllocationRoutes = require("./routes/staffAllocation.routes");
app.use("/", staffAllocationRoutes);

const staffRoutes = require("./routes/staff.routes");
app.use("/", staffRoutes);

const adminAttendanceRoutes = require("./routes/adminAttendance.routes");
app.use("/", adminAttendanceRoutes);

const adminBookletRoutes = require("./routes/adminBooklets.routes");
app.use("/", adminBookletRoutes);

const pagesRoutes = require("./routes/pages.routes");
app.use("/", pagesRoutes);

const aiBotRoutes = require("./routes/aiBot.routes");
app.use("/", aiBotRoutes);

// server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
