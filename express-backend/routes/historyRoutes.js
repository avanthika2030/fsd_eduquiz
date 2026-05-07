const express = require("express");
const router = express.Router();
const axios = require("axios");

const FASTAPI_URL = "http://127.0.0.1:8000";

router.post("/save", async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    const response = await axios.post(
      `${FASTAPI_URL}/save-history`,
      req.body,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Save failed" });
  }
});

router.get("/:email", async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    const response = await axios.get(
      `${FASTAPI_URL}/history/${req.params.email}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Fetch failed" });
  }
});

module.exports = router;