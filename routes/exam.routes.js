const express = require("express");
const db = require("../config/db");
const { isLoggedIn, allowRoles } = require("../middleware/auth.middleware");

const router = express.Router();

// show create exam form
router.get(
  "/exams/create",
  isLoggedIn,
  allowRoles("GLOBAL_ADMIN"),
  (req, res) => {
    res.render("exams/create");
  }
);

// handle exam creation
router.post(
  "/exams/create",
  isLoggedIn,
  allowRoles("GLOBAL_ADMIN"),
  async (req, res) => {
    const { title, exam_date, session } = req.body;

    await db.query(
      `INSERT INTO exams (title, exam_date, session, created_by)
       VALUES (?, ?, ?, ?)`,
      [title, exam_date, session, req.session.user.id]
    );

    res.redirect("/exams");
  }
);

// list exams
router.get(
  "/exams",
  isLoggedIn,
  allowRoles("GLOBAL_ADMIN", "LOCAL_ADMIN"),
  async (req, res) => {
    const [exams] = await db.query(
      `SELECT exams.*, users.name AS creator
       FROM exams
       JOIN users ON exams.created_by = users.id
       ORDER BY exam_date`
    );

    res.render("exams/list", { exams });
  }
);

module.exports = router;
