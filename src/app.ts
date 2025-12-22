import "express-async-errors";
import express, { Application } from "express";
import { config } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/auth";
import { rateLimiter } from "./middleware/rateLimiter";

// Import routes
import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import orderRoutes from "./routes/orderRoutes";
import walletRoutes from "./routes/walletRoutes";
import userRoutes from "./routes/userRoutes";

// Create Express app
const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Apply rate limiting to all routes
app.use(rateLimiter.middleware());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/wallet", walletRoutes);
app.use("/users", userRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
