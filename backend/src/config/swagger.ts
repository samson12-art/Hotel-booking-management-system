import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hotel Booking & Management System API",
      version: "1.0.0",
      description: "Complete API for hotel booking and management system",
      contact: {
        name: "Hotel Booking Team",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, "../routes/*.ts"), path.join(__dirname, "../types/*.ts")],
};

export const swaggerSpec = swaggerJsdoc(options);
