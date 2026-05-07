const express = require("express");
const router = express.Router();
const { forwardRequest } = require("../services/fastapiService");

router.post("/generate", async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    const data = await forwardRequest("/generate-quiz", req.body, "POST", token);
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Quiz generation failed" });
  }
});

module.exports = router;