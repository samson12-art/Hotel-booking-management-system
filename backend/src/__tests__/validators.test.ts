import { registerSchema, loginSchema, hotelSchema, roomSchema, bookingSchema, paymentSchema, reviewSchema, couponSchema } from "../utils/validators";

describe("Validators", () => {
  describe("registerSchema", () => {
    it("should validate a correct registration", () => {
      const result = registerSchema.parse({
        email: "test@example.com",
        password: "Password123",
        firstName: "John",
        lastName: "Doe",
      });
      expect(result.email).toBe("test@example.com");
    });

    it("should reject invalid email", () => {
      expect(() => registerSchema.parse({ email: "invalid" })).toThrow();
    });

    it("should reject weak password", () => {
      expect(() =>
        registerSchema.parse({
          email: "test@example.com",
          password: "weak",
          firstName: "John",
          lastName: "Doe",
        })
      ).toThrow();
    });
  });

  describe("loginSchema", () => {
    it("should validate correct login", () => {
      const result = loginSchema.parse({ email: "a@b.com", password: "x" });
      expect(result.email).toBe("a@b.com");
    });

    it("should reject missing password", () => {
      expect(() => loginSchema.parse({ email: "a@b.com" })).toThrow();
    });
  });

  describe("hotelSchema", () => {
    it("should validate correct hotel data", () => {
      const result = hotelSchema.parse({
        name: "Test Hotel",
        description: "A nice place to stay with great amenities",
        address: "123 Main St",
        cityId: "00000000-0000-0000-0000-000000000001",
        countryId: "00000000-0000-0000-0000-000000000002",
        starRating: 4,
        phoneNumber: "+1234567890",
        email: "hotel@test.com",
      });
      expect(result.name).toBe("Test Hotel");
    });

    it("should reject invalid star rating", () => {
      expect(() =>
        hotelSchema.parse({
          name: "Test Hotel",
          description: "Great place",
          address: "123 Main St",
          cityId: "00000000-0000-0000-0000-000000000001",
          countryId: "00000000-0000-0000-0000-000000000002",
          starRating: 6,
          phoneNumber: "+1234567890",
          email: "hotel@test.com",
        })
      ).toThrow();
    });
  });

  describe("roomSchema", () => {
    it("should validate correct room data", () => {
      const result = roomSchema.parse({
        roomNumber: "101",
        type: "STANDARD",
        capacity: 2,
        beds: 1,
        price: 100,
      });
      expect(result.roomNumber).toBe("101");
    });

    it("should reject invalid room type", () => {
      expect(() =>
        roomSchema.parse({
          roomNumber: "101",
          type: "INVALID",
          capacity: 2,
          beds: 1,
          price: 100,
        })
      ).toThrow();
    });
  });

  describe("paymentSchema", () => {
    it("should validate correct payment", () => {
      const result = paymentSchema.parse({
        bookingId: "00000000-0000-0000-0000-000000000001",
        method: "CREDIT_CARD",
      });
      expect(result.method).toBe("CREDIT_CARD");
    });
  });

  describe("reviewSchema", () => {
    it("should validate correct review", () => {
      const result = reviewSchema.parse({ rating: 4, comment: "Great stay!" });
      expect(result.rating).toBe(4);
    });

    it("should reject rating out of range", () => {
      expect(() => reviewSchema.parse({ rating: 6 })).toThrow();
    });
  });

  describe("couponSchema", () => {
    it("should validate correct coupon", () => {
      const result = couponSchema.parse({
        code: "WELCOME20",
        discountPercent: 20,
        validFrom: "2025-01-01",
        validUntil: "2025-12-31",
      });
      expect(result.code).toBe("WELCOME20");
    });
  });
});
