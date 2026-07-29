import request from "supertest";
import app from "../app";

describe("Auth API", () => {
  describe("POST /api/v1/auth/register", () => {
    it("should validate required fields", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject short password", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "test@test.com",
        password: "123",
        firstName: "Test",
        lastName: "User",
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should reject missing credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({});
      expect(res.status).toBe(400);
    });

    it("should reject invalid email", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "notanemail",
        password: "Password123",
      });
      expect(res.status).toBe(400);
    });
  });
});

describe("Health Check", () => {
  it("should return API info", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("Hotel Booking");
  });
});
