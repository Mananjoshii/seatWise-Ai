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
        `SELECT e.title, e.exam_date, e.session,
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

module.exports = router;
