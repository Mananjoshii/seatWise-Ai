const express = require("express");
const db = require("../config/db");
const { isLoggedIn, allowRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/admin/exams/:examId/attendance",
  isLoggedIn,
  allowRoles("GLOBAL_ADMIN", "LOCAL_ADMIN"),
  async (req, res) => {
    const { examId } = req.params;

    const [records] = await db.query(
      `SELECT 
        c.name AS classroom,
        b.bench_number,
        u.name AS student,
        ea.status
        FROM exam_attendance ea
        JOIN users u ON ea.student_id = u.id
        JOIN exam_seats es 
        ON es.exam_id = ea.exam_id 
        AND es.student_id = ea.student_id
        JOIN benches b ON b.id = es.bench_id
        JOIN classrooms c ON es.classroom_id = c.id
        WHERE ea.exam_id = ?
        ORDER BY c.name, b.bench_number`,
      [examId]
    );

    res.render("attendance", { records });
  }
);

module.exports = router;
