const axios = require("axios");

const FASTAPI_URL = "http://127.0.0.1:8000";

const forwardRequest = async (endpoint, data = {}, method = "POST", token = null) => {
  try {
    const headers = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios({
      method,
      url: `${FASTAPI_URL}${endpoint}`,
      data,
      headers,
    });

    return response.data;
  } catch (error) {
    console.error(`[fastapiService] ${method} ${endpoint} failed:`, error.message);
    throw error;
  }
};

module.exports = { forwardRequest };