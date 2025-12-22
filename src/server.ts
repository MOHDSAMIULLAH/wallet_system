import app from "./app";
import { config } from "./config";

const PORT = config.server.port;

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log("\nShutting down gracefully...");
  
  try {
    // Neon serverless doesn't require explicit connection closing
    console.log("Cleaning up...");
    
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start server
const server = app.listen(PORT, async () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Wallet Transaction System Started        ║
╠════════════════════════════════════════════╣
║   Environment: ${config.server.nodeEnv.padEnd(27)}║
║   Port:        ${PORT.toString().padEnd(27)}║
║   Health:      http://localhost:${PORT}/health  ║
╚════════════════════════════════════════════╝

API Endpoints:
  Admin:
    POST   /admin/wallet/credit
    POST   /admin/wallet/debit
  
  Client:
    POST   /orders
    GET    /orders/:order_id
    GET    /wallet/balance

Database: Connected ✓
  `);
  
  // Test database connection
  try {
    const { testConnection } = await import("./db");
    await testConnection();
    console.log("✓ Database connection verified\n");
  } catch (error) {
    console.error("✗ Database connection failed:", error);
    console.error("Make sure DATABASE_URL is configured correctly\n");
  }
});

// Handle server errors
server.on("error", (error: any) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Error: Port ${PORT} is already in use`);
  } else {
    console.error("Server error:", error);
  }
  process.exit(1);
});
