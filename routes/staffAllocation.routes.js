const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const bcrypt = require("bcrypt");
const db = require("../config/db");
const { isLoggedIn, allowRoles } = require("../middleware/auth.middleware");

const router = express.Router();
const uploadStaff = multer({ dest: "uploads/staff/" });

router.post(
  "/exams/:examId/upload-staff",
  isLoggedIn,
  allowRoles("LOCAL_ADMIN"),
  uploadStaff.single("file"),
  async (req, res) => {
    const { examId } = req.params;
    const deptId = req.session.user.department_id;

    const staffList = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => staffList.push(row))
      .on("end", async () => {
        try {
          // 1. Get classrooms for this exam & department
          const [classrooms] = await db.query(
            `SELECT classroom_id
             FROM exam_classrooms
             WHERE exam_id = ?
             AND department_id = ?`,
            [examId, deptId]
          );

          if (staffList.length < classrooms.length) {
            return res.send("❌ Not enough staff for classrooms");
          }

          // 2. Insert staff into users if not exists
          for (const staff of staffList) {
            const [[existing]] = await db.query(
              `SELECT id FROM users WHERE email = ?`,
              [staff.email]
            );

            if (!existing) {
              const hashedPassword = await bcrypt.hash(staff.staff_id, 10);

              const [result] = await db.query(
                `INSERT INTO users (name, email, password, role_id, department_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                  staff.name,
                  staff.email,
                  hashedPassword,
                  3, // STAFF role
                  deptId,
                ]
              );

              staff.user_id = result.insertId;
            } else {
              staff.user_id = existing.id;
            }
          }

          // 3. Allocate staff to classrooms
          for (let i = 0; i < classrooms.length; i++) {
            await db.query(
              `INSERT INTO exam_staff (exam_id, classroom_id, staff_id)
               VALUES (?, ?, ?)`,
              [examId, classrooms[i].classroom_id, staffList[i].user_id]
            );
          }

          fs.unlinkSync(req.file.path);
          res.redirect(`/exams/${examId}`);
        } catch (err) {
          console.error(err);
          res.status(500).send("Staff allocation failed");
        }
      });
  }
);

module.exports = router;
