const express = require("express");
const db = require("../config/db");
const { isLoggedIn, allowRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/student/exams",
  isLoggedIn,
  allowRoles("STUDENT"),
  async (req, res) => {
    const studentId = req.session.user.id;

    const [exams] = await db.query(
      `SELECT e.id, e.title, e.exam_date, e.session
       FROM exam_seats es
       JOIN exams e ON es.exam_id = e.id
       WHERE es.student_id = ?`,
      [studentId]
    );

    res.render("student/exams", { exams });
  }
);

router.get(
  "/student/exams/:examId",
  isLoggedIn,
  allowRoles("STUDENT"),
  async (req, res) => {
    const { examId } = req.params;
    const studentId = req.session.user.id;

    const [[seat]] = await db.query(
      `SELECT e.title, e.exam_date, e.session,
              c.name AS classroom,
              b.bench_number
       FROM exam_seats es
       JOIN exams e ON es.exam_id = e.id
       JOIN classrooms c ON es.classroom_id = c.id
       JOIN benches b ON es.bench_id = b.id
       WHERE es.exam_id = ?
       AND es.student_id = ?`,
      [examId, studentId]
    );

    if (!seat) {
      return res.status(403).send("Seat not allocated yet");
    }

    res.render("student/exam-detail", { seat });
  }
);

module.exports = router;
