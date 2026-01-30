import axios from "axios";

export async function requestEstimate(payload) {
  const res = await axios.post("/api/estimates/", payload);
  return res.data;
}
