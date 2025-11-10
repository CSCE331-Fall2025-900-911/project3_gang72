// /src/services/api.js
const API_URL = "http://localhost:3000"; // your backend

export async function getEmployees() {
  const res = await fetch(`${API_URL}/api/employees`);
  if (!res.ok) throw new Error("Failed to fetch employees");
  return res.json();
}
