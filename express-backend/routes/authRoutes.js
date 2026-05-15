const express = require("express");
const router = express.Router();
const { forwardRequest } = require("../services/fastapiService");

router.post("/login", async (req, res) => {
  try {
    const data = await forwardRequest("/login", req.body);
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Login failed" });
  }
});


router.post("/register", async (req, res) => {
  try {
    const data = await forwardRequest("/register", req.body);
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Register failed" });
  }
});

module.exports = router;