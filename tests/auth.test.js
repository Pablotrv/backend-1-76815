const request = require("supertest");
const express = require("express");
const authRoutes = require("../src/routes/auth");
const connectDB = require("../src/config/database");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  // Cerrar conexión si es necesario
});

describe("Auth API", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
  });

  it("should login user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });
});
