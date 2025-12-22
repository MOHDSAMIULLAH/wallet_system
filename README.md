# Wallet Transaction System

A robust backend system for managing client wallets and orders with atomic transactions, built with Node.js, Express, TypeScript, and Drizzle ORM.

## 🎯 Features

- **Wallet Management**: Credit/debit operations with transaction logging
- **Order Processing**: Create orders with automatic wallet deduction
- **Atomic Operations**: Database transactions ensure data consistency
- **External Integration**: Fulfillment API integration with retry mechanism
- **Error Handling**: Comprehensive error handling and validation
- **Rate Limiting**: Protection against abuse
- **Audit Trail**: Complete ledger of all transactions

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Validation**: Zod

### Database Schema

```
users
├── id (PK)
├── client_id (unique)
├── name
├── email
└── timestamps

wallets
├── id (PK)
├── user_id (FK → users.id, unique)
├── balance (DECIMAL 15,2)
└── timestamps

orders
├── id (PK)
├── order_id (unique)
├── user_id (FK → users.id)
├── amount (DECIMAL 15,2)
├── status (PENDING/COMPLETED/FAILED)
├── fulfillment_id
└── timestamps

ledger_entries
├── id (PK)
├── user_id (FK → users.id)
├── transaction_type (CREDIT/DEBIT/ORDER_DEDUCTION)
├── amount
├── balance_before
├── balance_after
├── reference_id
├── description
└── created_at
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. **Clone and navigate to the project**
```bash
cd assignment
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/wallet_system
PORT=3000
NODE_ENV=development
FULFILLMENT_API_URL=https://jsonplaceholder.typicode.com/posts
ADMIN_API_KEY=your-secure-admin-api-key-here
```

4. **Setup Database**

Create PostgreSQL database:
```bash
createdb wallet_system
```

Generate and run migrations:
```bash
npm run db:generate
npm run db:push
```

5. **Start the server**

Development mode (with hot reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## 📡 API Documentation

### Admin Endpoints

#### 1. Credit Wallet
```bash
POST /admin/wallet/credit
Authorization: Bearer <ADMIN_API_KEY>
Content-Type: application/json

{
  "client_id": "CLIENT123",
  "amount": 1000.50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet credited successfully",
  "data": {
    "clientId": "CLIENT123",
    "previousBalance": 0,
    "newBalance": 1000.50,
    "amountCredited": 1000.50
  }
}
```

#### 2. Debit Wallet
```bash
POST /admin/wallet/debit
Authorization: Bearer <ADMIN_API_KEY>
Content-Type: application/json

{
  "client_id": "CLIENT123",
  "amount": 250.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet debited successfully",
  "data": {
    "clientId": "CLIENT123",
    "previousBalance": 1000.50,
    "newBalance": 750.50,
    "amountDebited": 250.00
  }
}
```

### Client Endpoints

#### 3. Create Order
```bash
POST /orders
client-id: CLIENT123
Content-Type: application/json

{
  "amount": 99.99
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "ORD-1703251234567-a1b2c3d4",
    "amount": 99.99,
    "status": "COMPLETED",
    "fulfillmentId": "101",
    "createdAt": "2024-12-22T10:30:45.123Z"
  }
}
```

#### 4. Get Order Details
```bash
GET /orders/{order_id}
client-id: CLIENT123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "ORD-1703251234567-a1b2c3d4",
    "amount": 99.99,
    "status": "COMPLETED",
    "fulfillmentId": "101",
    "createdAt": "2024-12-22T10:30:45.123Z",
    "updatedAt": "2024-12-22T10:30:46.789Z"
  }
}
```

#### 5. Get Wallet Balance
```bash
GET /wallet/balance
client-id: CLIENT123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientId": "CLIENT123",
    "balance": 650.51,
    "lastUpdated": "2024-12-22T10:30:46.789Z"
  }
}
```

### Error Responses

```json
{
  "success": false,
  "error": "Insufficient wallet balance for order"
}
```

Status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (invalid API key)
- `404` - Not Found (resource not found)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `502` - Bad Gateway (fulfillment API error)
- `503` - Service Unavailable (external service down)

## 🧪 Testing

### Using cURL

**1. Credit wallet:**
```bash
curl -X POST http://localhost:3000/admin/wallet/credit \
  -H "Authorization: Bearer your-secure-admin-api-key" \
  -H "Content-Type: application/json" \
  -d '{"client_id": "TEST_CLIENT", "amount": 1000}'
```

**2. Check balance:**
```bash
curl http://localhost:3000/wallet/balance \
  -H "client-id: TEST_CLIENT"
```

**3. Create order:**
```bash
curl -X POST http://localhost:3000/orders \
  -H "client-id: TEST_CLIENT" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50.00}'
```

**4. Get order details:**
```bash
curl http://localhost:3000/orders/ORD-1703251234567-a1b2c3d4 \
  -H "client-id: TEST_CLIENT"
```

### Using Postman

Import the following collection or create requests manually with the endpoints above.

## 🔒 Security Features

1. **Admin Authentication**: Bearer token authentication for admin endpoints
2. **Rate Limiting**: 100 requests per minute per IP
3. **Input Validation**: Zod schema validation for all inputs
4. **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
5. **Error Masking**: Generic error messages in production

## 🎯 Design Decisions

### 1. Atomic Transactions
- **Problem**: Wallet deduction and order creation must be atomic
- **Solution**: Database transactions with row-level locking (`FOR UPDATE`)
- **Benefit**: Prevents race conditions and ensures consistency

### 2. Ledger System
- **Problem**: Need audit trail of all wallet operations
- **Solution**: Immutable ledger entries for every transaction
- **Benefit**: Complete history with before/after balances

### 3. Order Status Flow
```
PENDING → wallet deduction → fulfillment API → COMPLETED
   ↓                              ↓
   └────── Any failure ──────────→ FAILED
```

### 4. Fulfillment API Error Handling
- **Retry mechanism**: 3 attempts with exponential backoff
- **Timeout**: 5 seconds per request
- **Failure handling**: Order marked as FAILED, wallet already deducted

### 5. Auto-user Creation
- Users are automatically created on first transaction
- Simplifies client onboarding
- Wallet created automatically with user

## 📊 Scalability Considerations

### Current Implementation
- In-memory rate limiting
- Single database connection pool
- Synchronous order processing

### Production Recommendations

1. **Horizontal Scaling**
   - Use Redis for distributed rate limiting
   - Session management with Redis
   - Load balancer (nginx/HAProxy)

2. **Database Optimization**
   - Read replicas for balance queries
   - Connection pooling (already implemented)
   - Database indexes (already implemented)

3. **Async Processing**
   - Message queue (RabbitMQ/Redis) for fulfillment
   - Webhook callbacks for order status
   - Background job processing

4. **Monitoring**
   - APM (Application Performance Monitoring)
   - Database query logging
   - Error tracking (Sentry)

5. **Caching**
   - Redis cache for frequently accessed data
   - Cache invalidation strategy

## 🐛 Error Handling

### Edge Cases Handled

1. **Insufficient Balance**: Order creation fails before deduction
2. **Concurrent Transactions**: Row-level locking prevents conflicts
3. **Fulfillment API Failure**: Order marked as FAILED, supports retry
4. **Invalid Amounts**: Validation for positive numbers, max 2 decimals
5. **Duplicate Requests**: Unique order IDs prevent duplicates
6. **Database Connection Loss**: Graceful error handling
7. **Rate Limiting**: 429 response when limit exceeded

### Transaction Safety

All wallet operations are wrapped in database transactions:
```typescript
await db.transaction(async (tx) => {
  // Lock wallet row
  // Check balance
  // Update balance
  // Create ledger entry
  // All or nothing
});
```

## 📁 Project Structure

```
assignment/
├── src/
│   ├── config/
│   │   └── index.ts              # Configuration management
│   ├── db/
│   │   ├── schema/
│   │   │   ├── users.ts          # User schema
│   │   │   ├── wallets.ts        # Wallet schema
│   │   │   ├── orders.ts         # Order schema
│   │   │   ├── ledger.ts         # Ledger schema
│   │   │   └── index.ts          # Schema exports
│   │   └── index.ts              # Database connection
│   ├── services/
│   │   ├── walletService.ts      # Wallet business logic
│   │   ├── orderService.ts       # Order business logic
│   │   └── fulfillmentService.ts # External API integration
│   ├── controllers/
│   │   ├── adminController.ts    # Admin endpoints
│   │   ├── orderController.ts    # Order endpoints
│   │   └── walletController.ts   # Wallet endpoints
│   ├── routes/
│   │   ├── adminRoutes.ts        # Admin routes
│   │   ├── orderRoutes.ts        # Order routes
│   │   └── walletRoutes.ts       # Wallet routes
│   ├── middleware/
│   │   ├── auth.ts               # Authentication
│   │   ├── errorHandler.ts       # Error handling
│   │   └── rateLimiter.ts        # Rate limiting
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # Server entry point
├── drizzle/                      # Migrations
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── .env.example
└── README.md
```

## 🎓 AI Prompts Used

The following prompts were used to develop this system:

1. **Initial Setup**
   - "Create a TypeScript project structure with Express and Drizzle ORM for a wallet transaction system"
   - "Design database schema for users, wallets, orders, and transaction ledger with proper relationships"

2. **Core Features**
   - "Implement atomic wallet deduction with row-level locking in Drizzle ORM"
   - "Create a service to handle external fulfillment API calls with retry logic"
   - "Implement comprehensive error handling middleware for Express"

3. **Advanced Features**
   - "Add rate limiting middleware with in-memory storage"
   - "Create audit trail system with ledger entries tracking before/after balances"
   - "Implement graceful shutdown with database connection cleanup"

## 📝 License

MIT

## 👨‍💻 Author

Created as part of Backend Developer assignment

---

**Note**: This is a demo system. For production use, implement additional security measures, comprehensive testing, and monitoring.
