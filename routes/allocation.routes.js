const express = require("express");
const multer = require("multer");
const bcrypt = require("bcrypt");
const csv = require("csv-parser");
const fs = require("fs");
const db = require("../config/db");
const { isLoggedIn, allowRoles } = require("../middleware/auth.middleware");

const router = express.Router();

/* ---------- FILE UPLOAD SETUP ---------- */

const uploadStudents = multer({ dest: "uploads/students/" });
const uploadClassrooms = multer({ dest: "uploads/classrooms/" });

/* ---------- UPLOAD CLASSROOMS ---------- */
router.post(
  "/exams/:examId/upload-classrooms",
  isLoggedIn,
  allowRoles("LOCAL_ADMIN"),
  uploadClassrooms.single("file"),
  async (req, res) => {
    const { examId } = req.params;
    const deptId = req.session.user.department_id;

    const classrooms = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => classrooms.push(row))
      .on("end", async () => {
        for (let room of classrooms) {
          const [result] = await db.query(
            `INSERT INTO classrooms (name, total_benches, department_id)
             VALUES (?, ?, ?)`,
            [room.classroom_name, room.total_benches, deptId]
          );

          const classroomId = result.insertId;

          await db.query(
            `INSERT INTO exam_classrooms (exam_id, department_id, classroom_id)
             VALUES (?, ?, ?)`,
            [examId, deptId, classroomId]
          );

          const benches = [];
          for (let i = 1; i <= room.total_benches; i++) {
            benches.push([classroomId, i]);
          }

          await db.query(
            `INSERT INTO benches (classroom_id, bench_number)
             VALUES ?`,
            [benches]
          );
        }

        fs.unlinkSync(req.file.path);
        res.redirect(`/exams/${examId}`);
      });
  }
);

/* ---------- UPLOAD STUDENTS + AUTO ALLOCATE ---------- */
router.post(
  "/exams/:examId/upload-students",
  isLoggedIn,
  allowRoles("LOCAL_ADMIN"),
  uploadStudents.single("file"),
  async (req, res) => {
    const { examId } = req.params;
    const deptId = req.session.user.department_id;

    const students = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => students.push(row))
      .on("end", async () => {
        try {
          // 1️⃣ Fetch available benches
          const [benches] = await db.query(
            `SELECT b.id, ec.classroom_id
             FROM benches b
             JOIN exam_classrooms ec ON b.classroom_id = ec.classroom_id
             WHERE ec.exam_id = ?
             AND ec.department_id = ?
             AND ec.seats_frozen = FALSE
             ORDER BY ec.classroom_id, b.id`,
            [examId, deptId]
          );

          if (students.length > benches.length) {
            return res.send("❌ Not enough benches");
          }

          // 2️⃣ Create users if not exist
          for (const student of students) {
            const email = `${student.student_id}@student.rvce.edu`;

            const [[existing]] = await db.query(
              `SELECT id FROM users WHERE email = ?`,
              [email]
            );

            if (!existing) {
              const hashedPassword = await bcrypt.hash(student.student_id, 10);

              const [result] = await db.query(
                `INSERT INTO users (name, email, password, role_id, department_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                  student.name,
                  email,
                  hashedPassword,
                  4, // STUDENT role_id
                  deptId,
                ]
              );

              student.user_id = result.insertId;
            } else {
              student.user_id = existing.id;
            }
          }

          // 3️⃣ Allocate benches using user_id
          for (let i = 0; i < students.length; i++) {
            await db.query(
              `INSERT INTO exam_seats (exam_id, classroom_id, bench_id, student_id)
               VALUES (?, ?, ?, ?)`,
              [
                examId,
                benches[i].classroom_id,
                benches[i].id,
                students[i].user_id,
              ]
            );
          }

          // 4️⃣ Auto-freeze seats
          await db.query(
            `UPDATE exam_classrooms
             SET seats_frozen = TRUE
             WHERE exam_id = ? AND department_id = ?`,
            [examId, deptId]
          );

          fs.unlinkSync(req.file.path);
          res.redirect(`/exams/${examId}`);
        } catch (err) {
          console.error(err);
          res.status(500).send("Allocation failed");
        }
      });
  }
);
module.exports = router;
