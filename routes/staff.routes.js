const express = require("express");
const db = require("../config/db");
const { isLoggedIn, allowRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/dashboard/staff",
  isLoggedIn,
  allowRoles("STAFF"),
  async (req, res) => {
    try {
      const staffId = req.session.user.id;

      const [assignments] = await db.query(
        `SELECT e.id AS exam_id,
            c.id AS classroom_id,
            e.title,
            e.exam_date,
            e.session,
            c.name AS classroom
            FROM exam_staff es
            JOIN exams e ON es.exam_id = e.id
            JOIN classrooms c ON es.classroom_id = c.id
            WHERE es.staff_id = ?`,
        [staffId]
      );
      console.log("Assignments:", assignments);

      res.render("dashboards/staff", { assignments });
    } catch (err) {
      console.error(err);
      res.render("dashboards/staff", { assignments: [] });
    }
  }
);

router.get(
  "/staff/exams/:examId/classrooms/:classroomId/attendance",
  isLoggedIn,
  allowRoles("STAFF"),
  async (req, res) => {
    const { examId, classroomId } = req.params;
    const staffId = req.session.user.id;

    // verify staff assignment
    const [[assigned]] = await db.query(
      `SELECT 1 FROM exam_staff
       WHERE exam_id = ? AND classroom_id = ? AND staff_id = ?`,
      [examId, classroomId, staffId]
    );

    if (!assigned) {
      return res.status(403).send("Unauthorized");
    }

    // fetch students bench-wise
    const [students] = await db.query(
      `SELECT u.id, u.name, b.bench_number
       FROM exam_seats es
       JOIN users u ON es.student_id = u.id
       JOIN benches b ON es.bench_id = b.id
       WHERE es.exam_id = ? AND es.classroom_id = ?
       ORDER BY b.bench_number`,
      [examId, classroomId]
    );

    res.render("dashboards/attendence", {
      examId,
      classroomId,
      students,
    });
  }
);

router.post(
  "/staff/exams/:examId/classrooms/:classroomId/attendance",
  isLoggedIn,
  allowRoles("STAFF"),
  async (req, res) => {
    const { examId, classroomId } = req.params;
    const staffId = req.session.user.id;
    const attendance = req.body; // student_id : PRESENT/ABSENT

    // verify staff assignment
    const [[assigned]] = await db.query(
      `SELECT 1 FROM exam_staff
       WHERE exam_id = ? AND classroom_id = ? AND staff_id = ?`,
      [examId, classroomId, staffId]
    );

    if (!assigned) {
      return res.status(403).send("Unauthorized");
    }

    for (const studentId in attendance) {
      await db.query(
        `INSERT INTO exam_attendance (exam_id, classroom_id, student_id, status)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [examId, classroomId, studentId, attendance[studentId]]
      );
    }

    res.redirect("/dashboard/staff");
  }
);

module.exports = router;
