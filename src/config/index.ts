import * as dotenv from "dotenv";

dotenv.config();

export const config = {
  database: {
    url: process.env.DATABASE_URL || "",
  },
  server: {
    port: parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
  },
  fulfillmentApi: {
    url: process.env.FULFILLMENT_API_URL || "https://jsonplaceholder.typicode.com/posts",
    timeout: parseInt(process.env.FULFILLMENT_API_TIMEOUT || "5000", 10),
  },
  admin: {
    apiKey: process.env.ADMIN_API_KEY || "your-secure-admin-api-key",
  },
};
