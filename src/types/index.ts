export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WalletCreditRequest {
  client_id: string;
  amount: number;
}

export interface WalletDebitRequest {
  client_id: string;
  amount: number;
}

export interface CreateOrderRequest {
  amount: number;
}

export interface FulfillmentApiRequest {
  userId: string;
  title: string;
}

export interface FulfillmentApiResponse {
  id: number;
  userId: string;
  title: string;
  body?: string;
}

export enum TransactionType {
  CREDIT = "CREDIT",
  DEBIT = "DEBIT",
  ORDER_DEDUCTION = "ORDER_DEDUCTION",
}

export enum OrderStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}
