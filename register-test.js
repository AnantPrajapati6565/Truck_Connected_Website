const http = require("http");

const payload = JSON.stringify({
  fullName: "Test User",
  email: "testuser9@example.com",
  mobile: "9999999997",
  password: "secret123",
  businessType: "SHIPPER",
});

const req = http.request(
  {
    host: "localhost",
    port: 5000,
    path: "/api/v1/auth/register",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  },
  (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log("status", res.statusCode);
      console.log(data);
    });
  },
);

req.on("error", (err) => {
  console.error(err);
  process.exit(1);
});

req.write(payload);
req.end();
