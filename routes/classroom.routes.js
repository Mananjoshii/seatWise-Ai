const express = require("express");
const db = require("../config/db");
const { isLoggedIn, allowRoles } = require("../middleware/auth.middleware");

const router = express.Router();

// show classroom create form
router.get(
  "/classrooms/create",
  isLoggedIn,
  allowRoles("GLOBAL_ADMIN", "LOCAL_ADMIN"),
  async (req, res) => {
    let departments = [];

    if (req.session.user.role === "GLOBAL_ADMIN") {
      const [rows] = await db.query("SELECT * FROM departments");
      departments = rows;
    }

    res.render("classrooms/create", { departments });
  }
);

// handle classroom creation

router.post(
  "/classrooms/create",
  isLoggedIn,
  allowRoles("GLOBAL_ADMIN", "LOCAL_ADMIN"),
  async (req, res) => {
    const { name, floor, rows, cols, department_id } = req.body;
    const totalBenches = rows * cols;

    let deptId;

    if (req.session.user.role === "GLOBAL_ADMIN") {
      deptId = department_id;
    } else {
      deptId = req.session.user.department_id;
    }

    const [result] = await db.query(
      `INSERT INTO classrooms (name, floor, total_benches, department_id)
       VALUES (?, ?, ?, ?)`,
      [name, floor, totalBenches, deptId]
    );

    const classroomId = result.insertId;

    const benchValues = [];
    for (let i = 1; i <= totalBenches; i++) {
      benchValues.push([classroomId, i]);
    }

    await db.query(
      `INSERT INTO benches (classroom_id, bench_number)
       VALUES ?`,
      [benchValues]
    );

    res.redirect("/classrooms");
  }
);

// list classrooms
router.get(
  "/classrooms",
  isLoggedIn,
  allowRoles("GLOBAL_ADMIN", "LOCAL_ADMIN"),
  async (req, res) => {
    let classrooms;

    if (
      req.session.user.role === "LOCAL_ADMIN" &&
      !req.session.user.department_id
    ) {
      return res
        .status(400)
        .send(`${req.session.user.name} has no department assigned`);
    }

    if (req.session.user.role === "GLOBAL_ADMIN") {
      [classrooms] = await db.query(
        `SELECT classrooms.*, departments.name AS department
         FROM classrooms
         JOIN departments ON classrooms.department_id = departments.id`
      );
    } else {
      [classrooms] = await db.query(
        `SELECT classrooms.*, departments.name AS department
         FROM classrooms
         JOIN departments ON classrooms.department_id = departments.id
         WHERE classrooms.department_id = ?`,
        [req.session.user.department_id]
      );
    }

    res.render("classrooms/list", { classrooms });
  }
);

router.get("/classrooms/:c.name/delete", (req, res) => {
  const { name } = req.params;
  console.log(name);
});

module.exports = router;
