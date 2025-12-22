import axios, { AxiosError } from "axios";
import { config } from "../config";
import { FulfillmentApiRequest, FulfillmentApiResponse } from "../types";
import { createHttpError } from "../utils/httpError";

export class FulfillmentService {
  private apiUrl: string;
  private timeout: number;

  constructor() {
    this.apiUrl = config.fulfillmentApi.url;
    this.timeout = config.fulfillmentApi.timeout;
  }

  /**
   * Call external fulfillment API
   */
  async createFulfillment(
    clientId: string,
    orderId: string
  ): Promise<FulfillmentApiResponse> {
    try {
      const requestData: FulfillmentApiRequest = {
        userId: clientId,
        title: orderId,
      };

      const response = await axios.post<FulfillmentApiResponse>(
        this.apiUrl,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: this.timeout,
        }
      );

      // Validate response
      if (!response.data || !response.data.id) {
        throw createHttpError(500, "Invalid fulfillment API response");
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.code === "ECONNABORTED") {
          throw createHttpError(504, "Fulfillment API timeout");
        }
        if (axiosError.response) {
          throw createHttpError(
            502,
            `Fulfillment API error: ${axiosError.response.status}`
          );
        }
        throw createHttpError(503, "Fulfillment API unavailable");
      }
      throw createHttpError(500, "Failed to create fulfillment");
    }
  }

  /**
   * Retry mechanism for fulfillment API (optional enhancement)
   */
  async createFulfillmentWithRetry(
    clientId: string,
    orderId: string,
    maxRetries: number = 3
  ): Promise<FulfillmentApiResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.createFulfillment(clientId, orderId);
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || createHttpError(500, "Failed to create fulfillment after retries");
  }
}

export const fulfillmentService = new FulfillmentService();
