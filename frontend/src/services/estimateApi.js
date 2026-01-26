import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

export async function requestEstimate(payload) {
  const res = await axios.post(`${API_BASE_URL}/api/estimates/`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
}
