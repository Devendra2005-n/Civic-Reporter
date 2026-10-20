import fetch from "node-fetch";

const data = {
  name: "Manish Patil",
  email: "patilmanish113607@gmail.com",
  password: "Manish@123",
  role: "SUPER_ADMIN", // I will give you Super Admin role
  state: "Maharashtra",
  district: "Kolhapur",
  city: "Kolhapur"
};

fetch('http://localhost:5000/api/authority/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
  .then(res => res.json())
  .then(data => console.log("Response:", data))
  .catch(err => console.error("Error:", err));
