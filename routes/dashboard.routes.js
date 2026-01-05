const express = require("express");
const { isLoggedIn, allowRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/dashboard/global-admin",
  isLoggedIn,
  allowRoles("GLOBAL_ADMIN"),
  (req, res) => {
    res.render("dashboards/global-admin");
  }
);

router.get(
  "/dashboard/local-admin",
  isLoggedIn,
  allowRoles("LOCAL_ADMIN"),
  (req, res) => {
    res.render("dashboards/local-admin");
  }
);

// router.get("/dashboard/staff", isLoggedIn, allowRoles("STAFF"), (req, res) => {
//   res.render("dashboards/staff");
// });

router.get(
  "/dashboard/student",
  isLoggedIn,
  allowRoles("STUDENT"),
  (req, res) => {
    res.render("dashboards/student");
  }
);

module.exports = router;
