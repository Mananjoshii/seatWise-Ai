const express = require("express");
const db = require("../config/db");
const { isLoggedIn, allowRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/exams/:examId/classrooms/:classroomId",
  isLoggedIn,
  allowRoles("LOCAL_ADMIN"),
  async (req, res) => {
    const { examId, classroomId } = req.params;
    const deptId = req.session.user.department_id;

    // ensure classroom belongs to this exam + department
    const [[mapping]] = await db.query(
      `SELECT ec.seats_frozen, c.name
       FROM exam_classrooms ec
       JOIN classrooms c ON ec.classroom_id = c.id
       WHERE ec.exam_id = ? AND ec.classroom_id = ? AND ec.department_id = ?`,
      [examId, classroomId, deptId]
    );

    if (!mapping) return res.status(403).send("Invalid access");

    // students of department
    const [students] = await db.query(
      `SELECT id, name FROM users
       WHERE role_id = 4 AND department_id = ?`,
      [deptId]
    );

    // benches of classroom
    const [benches] = await db.query(
      `SELECT id, bench_number FROM benches
       WHERE classroom_id = ?`,
      [classroomId]
    );

    res.render("exams/classroom-allocation", {
      examId,
      classroomId,
      classroomName: mapping.name,
      seatsFrozen: mapping.seats_frozen,
      students,
      benches,
    });
  }
);

router.post(
  "/exams/:examId/classrooms/:classroomId/allocate",
  isLoggedIn,
  allowRoles("LOCAL_ADMIN"),
  async (req, res) => {
    const { examId, classroomId } = req.params;
    const { student_id, bench_id } = req.body;
    const deptId = req.session.user.department_id;
    console.log(classroomId);
    // 1. Check seat freeze
    const [[mapping]] = await db.query(
      `SELECT seats_frozen
       FROM exam_classrooms
       WHERE exam_id = ? AND classroom_id = ? AND department_id = ?`,
      [examId, classroomId, deptId]
    );

    if (!mapping || mapping.seats_frozen) {
      return res.status(403).send("Seats are frozen");
    }

    // 2. Validate student department
    const [[student]] = await db.query(
      `SELECT department_id FROM users
       WHERE id = ? AND role_id = 4`,
      [student_id]
    );

    if (!student || student.department_id !== deptId) {
      return res.status(400).send("Invalid student");
    }

    // 3. Allocate
    await db.query(
      `INSERT INTO exam_seats (exam_id, classroom_id, bench_id, student_id)
       VALUES (?, ?, ?, ?)`,
      [examId, classroomId, bench_id, student_id]
    );

    res.redirect(`/exams/${examId}`);
  }
);

module.exports = router;
