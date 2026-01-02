const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../config/db");

const router = express.Router();

// login page
router.get("/login", (req, res) => {
  res.render("login");
});

// login handler
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [users] = await db.query(
    `SELECT users.*, roles.name AS role
     FROM users
     JOIN roles ON users.role_id = roles.id
     WHERE email = ?`,
    [email]
  );

  if (users.length === 0) {
    return res.send("Invalid credentials");
  }

  const user = users[0];
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.send("Invalid credentials");
  }

  req.session.user = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  res.send(`Logged in as ${user.role}`);
});

module.exports = router;
