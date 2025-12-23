# Wallet Transaction System

A robust backend system for managing client wallets and orders with atomic transactions, built with Node.js, Express, TypeScript, and Drizzle ORM.

## 🎯 Features

- **User Authentication**: JWT-based authentication with secure login/register
- **User Management**: Complete CRUD operations for user accounts
- **Role-Based Access Control**: Admin and regular user roles with permissions
- **Wallet Management**: Credit/debit operations with transaction logging
- **Order Processing**: Create and track orders with automatic wallet deduction
- **Order History**: Retrieve all orders for a client with sorting by creation date
- **Atomic Operations**: Database transactions ensure data consistency
- **External Integration**: Fulfillment API integration with retry mechanism
- **Error Handling**: Comprehensive error handling and validation
- **Rate Limiting**: Protection against abuse
- **Audit Trail**: Complete ledger of all transactions
- **Password Security**: Bcrypt hashing for secure password storage
- **Health Monitoring**: Health check endpoint for system status

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
├── email (unique)
├── password (hashed)
├── is_admin (boolean)
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
JWT_SECRET=your-jwt-secret-change-in-production
JWT_EXPIRES_IN=7d
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

### Health Check Endpoint

#### Health Check
```bash
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2025-12-23T10:30:45.123Z"
}
```

### Authentication Endpoints

#### 1. Register User
```bash
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "isAdmin": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "clientId": "client_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "isAdmin": false
    }
  }
}
```

#### 2. Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "clientId": "client_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "isAdmin": false
    }
  }
}
```

#### 3. Get Profile
```bash
GET /auth/profile
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "clientId": "client_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "isAdmin": false
    }
  }
}
```

### User Management Endpoints

#### 4. Create User (Manual)
```bash
POST /users/create
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "client_id": "CUSTOM_CLIENT_ID",
  "is_admin": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 2,
    "clientId": "CUSTOM_CLIENT_ID",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "isAdmin": false
  }
}
```

#### 5. Get All Users
```bash
GET /users?limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "clientId": "CLIENT123",
      "name": "John Doe",
      "email": "john@example.com",
      "isAdmin": false
    }
  ]
}
```

#### 6. Get User by Client ID
```bash
GET /users/CLIENT123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "clientId": "CLIENT123",
    "name": "John Doe",
    "email": "john@example.com",
    "wallet": {
      "balance": "1000.50"
    }
  }
}
```

#### 7. Update User
```bash
PATCH /users/CLIENT123
Authorization: Bearer <JWT_TOKEN_WITH_ADMIN_ROLE>
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.new@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "clientId": "CLIENT123",
    "name": "John Updated",
    "email": "john.new@example.com"
  }
}
```

#### 8. Delete User
```bash
DELETE /users/CLIENT123
Authorization: Bearer <JWT_TOKEN_WITH_ADMIN_ROLE>
```

**Response:**
```json
{
  "success": true,
  "message": "User and associated data deleted successfully"
}
```

### Admin Endpoints

#### 9. Credit Wallet
```bash
POST /admin/wallet/credit
Authorization: Bearer <JWT_TOKEN_WITH_ADMIN_ROLE>
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

#### 10. Debit Wallet
```bash
POST /admin/wallet/debit
Authorization: Bearer <JWT_TOKEN_WITH_ADMIN_ROLE>
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

#### 11. Create Order
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

#### 12. Get All Orders for Client
```bash
GET /orders
client-id: CLIENT123
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "orderId": "ORD-1703251234567-a1b2c3d4",
      "amount": 99.99,
      "status": "COMPLETED",
      "fulfillmentId": "101",
      "createdAt": "2025-12-23T10:30:45.123Z"
    },
    {
      "orderId": "ORD-1703251234568-b2c3d4e5",
      "amount": 49.99,
      "status": "COMPLETED",
      "fulfillmentId": "102",
      "createdAt": "2025-12-23T09:15:30.456Z"
    }
  ]
}
```

#### 13. Get Order Details
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
    "createdAt": "2025-12-23T10:30:45.123Z",
    "updatedAt": "2025-12-23T10:30:46.789Z"
  }
}
```

#### 14. Get Wallet Balance
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
    "lastUpdated": "2025-12-23T10:30:46.789Z"
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
- `200` - OK (successful request)
- `201` - Created (resource created successfully)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid JWT token)
- `403` - Forbidden (insufficient permissions - admin role required)
- `404` - Not Found (resource not found)
- `409` - Conflict (duplicate resource, e.g., email already exists)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `502` - Bad Gateway (fulfillment API error)
- `503` - Service Unavailable (external service down)

## 🧪 Testing

### Complete cURL Command Reference

Below are all the cURL commands corresponding to the Postman collection:

#### Authentication Endpoints

**Register User:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "isAdmin": true
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```
> **Note:** Save the JWT token from the response to use in subsequent authenticated requests.

**Get Profile:**
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### User Management Endpoints

**Get All Users:**
```bash
curl -X GET http://localhost:3000/users
```

**Create User:**
```bash
curl -X POST http://localhost:3000/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "name": "Jane Smith"
  }'
```

**Get User by Client ID:**
```bash
curl -X GET http://localhost:3000/users/YOUR_CLIENT_ID
```

**Update User (Admin only):**
```bash
curl -X PATCH http://localhost:3000/users/YOUR_CLIENT_ID \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "email": "updated@example.com",
    "isAdmin": true
  }'
```

**Delete User (Admin only):**
```bash
curl -X DELETE http://localhost:3000/users/YOUR_CLIENT_ID \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

#### Wallet Endpoints

**Get Wallet Balance:**
```bash
curl -X GET http://localhost:3000/wallet/balance \
  -H "client-id: YOUR_CLIENT_ID"
```

#### Order Endpoints

**Create Order:**
```bash
curl -X POST http://localhost:3000/orders \
  -H "client-id: YOUR_CLIENT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.00
  }'
```

**Get All Orders for Client:**
```bash
curl -X GET http://localhost:3000/orders \
  -H "client-id: YOUR_CLIENT_ID"
```

**Get Order Details:**
```bash
curl -X GET http://localhost:3000/orders/YOUR_ORDER_ID \
  -H "client-id: YOUR_CLIENT_ID"
```

#### Admin Endpoints

**Credit Wallet (Admin only):**
```bash
curl -X POST http://localhost:3000/admin/wallet/credit \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "amount": 5500.00
  }'
```

**Debit Wallet (Admin only):**
```bash
curl -X POST http://localhost:3000/admin/wallet/debit \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "amount": 25.00
  }'
```

#### System Endpoints

**Health Check:**
```bash
curl -X GET http://localhost:3000/health
```

### Quick Testing Workflow

**1. Register a new admin user:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123",
    "isAdmin": true
  }'
```

**2. Login as admin as admin:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
# Save the JWT token from response for admin operations
```

**3. Get profile:**
```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**4. Credit wallet (Admin only - requires JWT with admin role):**
```bash
curl -X POST http://localhost:3000/admin/wallet/credit \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"client_id": "TEST_CLIENT", "amount": 1000}'
```

**5. Check balance:**
```bash
curl http://localhost:3000/wallet/balance \
  -H "client-id: TEST_CLIENT"
```

**6. Create order:**
```bash
curl -X POST http://localhost:3000/orders \
  -H "client-id: TEST_CLIENT" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50.00}'
```

**7. Get all orders for client:**
```bash
curl http://localhost:3000/orders \
  -H "client-id: TEST_CLIENT"
```

**8. Get order details:**
```bash
curl http://localhost:3000/orders/ORD-1703251234567-a1b2c3d4 \
  -H "client-id: TEST_CLIENT"
```

**9. Get all users:**
```bash
curl http://localhost:3000/users?limit=10
```

**10. Get user by client ID:**
```bash
curl http://localhost:3000/users/TEST_CLIENT
```

**11. Update user (Admin only):**
```bash
curl -X PATCH http://localhost:3000/users/TEST_CLIENT \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "email": "updated@example.com"
  }'
```

**12. Delete user (Admin only):**
```bash
curl -X DELETE http://localhost:3000/users/TEST_CLIENT \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**13. Debit wallet (Admin only):**
```bash
curl -X POST http://localhost:3000/admin/wallet/debit \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"client_id": "TEST_CLIENT", "amount": 250.00}'
```

**14. Health check:**
```bash
curl http://localhost:3000/health
```

### Using Postman

The project includes a complete Postman collection file: `Wallet System API.postman_collection.json`

**Import Instructions:**
1. Open Postman
2. Click "Import" button
3. Select the `Wallet System API.postman_collection.json` file
4. The collection will be imported with all endpoints organized in folders

**Collection Features:**
- Pre-configured endpoints for all API operations
- Environment variables for `baseUrl`, `token`, and `clientId`
- Automatic token extraction after login/register
- Organized into folders: Auth, Users, Wallet, Orders, Admin, and Health Check

**Quick Start with Postman:**
1. Import the collection
2. Set the `baseUrl` variable to `http://localhost:3000` (default)
3. Run "Register User" or "Login" to get a JWT token (saved automatically)
4. Use the token for authenticated endpoints
5. The `clientId` is automatically saved from registration/login responses

**Exporting cURL from Postman:**
- Click the three dots (...) next to any request
- Select "Code snippet"
- Choose "cURL" from the dropdown
- Copy the generated cURL command

## 🔒 Security Features

1. **JWT Authentication**: Secure token-based authentication for user sessions
2. **Password Hashing**: Bcrypt hashing with salt for secure password storage
3. **Role-Based Access Control**: Admin endpoints protected by JWT authentication with admin role verification
4. **Unified Authentication**: All protected routes use JWT tokens (no separate API keys)
5. **Rate Limiting**: 100 requests per minute per IP
6. **Input Validation**: Zod schema validation for all inputs
7. **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
8. **Error Masking**: Generic error messages in production
9. **Email Uniqueness**: Prevents duplicate accounts
10. **Token Expiration**: JWT tokens expire after configured duration

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
- Users can be created via registration endpoint or manually
- Wallet created automatically with each new user
- JWT token issued upon registration for immediate authentication

### 6. Authentication Flow
```
Registration → User Created → Wallet Created → JWT Issued
Login → Credentials Verified → JWT Issued
Protected Routes → JWT Verified → User Data Attached to Request
```

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
8. **Duplicate Email Registration**: 409 Conflict response
9. **Invalid Credentials**: Secure error messages without exposing details
10. **Expired JWT Tokens**: 401 Unauthorized with clear message
11. **Missing Authorization**: Proper 401/403 responses
12. **User Deletion Cascade**: Properly handles deletion of user with associated data

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
│   │   │   ├── users.ts          # User schema with auth
│   │   │   ├── wallets.ts        # Wallet schema
│   │   │   ├── orders.ts         # Order schema
│   │   │   ├── ledger.ts         # Ledger schema
│   │   │   └── index.ts          # Schema exports
│   │   └── index.ts              # Database connection
│   ├── services/
│   │   ├── userService.ts        # User business logic
│   │   ├── walletService.ts      # Wallet business logic
│   │   ├── orderService.ts       # Order business logic
│   │   └── fulfillmentService.ts # External API integration
│   ├── controllers/
│   │   ├── authController.ts     # Authentication endpoints
│   │   ├── userController.ts     # User management endpoints
│   │   ├── adminController.ts    # Admin endpoints
│   │   ├── orderController.ts    # Order endpoints
│   │   └── walletController.ts   # Wallet endpoints
│   ├── routes/
│   │   ├── authRoutes.ts         # Auth routes
│   │   ├── userRoutes.ts         # User routes
│   │   ├── adminRoutes.ts        # Admin routes
│   │   ├── orderRoutes.ts        # Order routes
│   │   └── walletRoutes.ts       # Wallet routes
│   ├── middleware/
│   │   ├── auth.ts               # Authentication & authorization
│   │   ├── errorHandler.ts       # Error handling
│   │   └── rateLimiter.ts        # Rate limiting
│   ├── utils/
│   │   ├── jwt.ts                # JWT utilities
│   │   ├── password.ts           # Password hashing utilities
│   │   └── httpError.ts          # Error utilities
│   ├── types/
│   │   ├── index.ts              # TypeScript types
│   │   └── express.d.ts          # Express type extensions
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
   - "Add endpoint to retrieve all orders for a client with proper filtering"

3. **Authentication & Security**
   - "Add JWT-based authentication with login and register endpoints"
   - "Implement password hashing using bcrypt with proper security practices"
   - "Create role-based access control with admin and user permissions"
   - "Add authentication middleware for protecting routes"

4. **User Management**
   - "Create CRUD endpoints for user management with proper authorization"
   - "Implement user service layer with database operations"
   - "Add validation for user creation and updates"

5. **Advanced Features**
   - "Add rate limiting middleware with in-memory storage"
   - "Create audit trail system with ledger entries tracking before/after balances"
   - "Implement graceful shutdown with database connection cleanup"

## 📝 License

MIT

## 👨‍💻 Author

Created as part of Backend Developer assignment

---

**Note**: This is a demo system. For production use, implement additional security measures, comprehensive testing, and monitoring.
