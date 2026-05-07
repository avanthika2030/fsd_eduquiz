const express = require("express");
const router = express.Router();
const axios = require("axios");

const FASTAPI_URL = "http://127.0.0.1:8000";

router.get("/", async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    const response = await axios.get(`${FASTAPI_URL}/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Fetch failed" });
  }
});

router.put("/", async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    const response = await axios.put(
      `${FASTAPI_URL}/notes`,
      req.body,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Update failed" });
  }
});

module.exports = router;