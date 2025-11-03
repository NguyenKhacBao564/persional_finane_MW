# API Documentation - Categories & Transactions

## Categories API

All category endpoints require authentication (Bearer token).

### GET /api/categories
Get all categories with optional filtering.

**Query Parameters:**
- `type` (optional): Filter by category type (INCOME, EXPENSE, TRANSFER)

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Salary",
      "type": "INCOME",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /api/categories/:id
Get a specific category by ID with usage statistics.

**Response:**
```json
{
  "category": {
    "id": "uuid",
    "name": "Salary",
    "type": "INCOME",
    "_count": {
      "transactions": 5,
      "budgets": 1
    }
  }
}
```

### POST /api/categories
Create a new category.

**Request Body:**
```json
{
  "name": "Groceries",
  "type": "EXPENSE"
}
```

**Response:**
```json
{
  "category": {
    "id": "uuid",
    "name": "Groceries",
    "type": "EXPENSE",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### PUT /api/categories/:id
Update a category.

**Request Body:**
```json
{
  "name": "Food & Groceries",
  "type": "EXPENSE"
}
```

### DELETE /api/categories/:id
Delete a category. Will fail if category has associated transactions or budgets.

**Response:**
```json
{
  "message": "Category deleted successfully"
}
```

---

## Transactions API

All transaction endpoints require authentication (Bearer token).

### GET /api/transactions
Get all transactions with filtering and pagination (Task 20).

**Query Parameters:**
- `categoryId` (optional): Filter by category ID
- `startDate` (optional): Filter transactions from this date (ISO 8601)
- `endDate` (optional): Filter transactions until this date (ISO 8601)
- `keyword` (optional): Search in transaction descriptions
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Items per page

**Example:**
```
GET /api/transactions?startDate=2025-01-01&endDate=2025-01-31&keyword=coffee&page=1&limit=20
```

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "userId": "uuid",
      "categoryId": "uuid",
      "amount": "150.00",
      "currency": "USD",
      "description": "Monthly salary",
      "occurredAt": "2025-01-15T00:00:00.000Z",
      "category": {
        "id": "uuid",
        "name": "Salary",
        "type": "INCOME"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### GET /api/transactions/:id
Get a specific transaction by ID.

**Response:**
```json
{
  "transaction": {
    "id": "uuid",
    "userId": "uuid",
    "amount": "150.00",
    "category": { ... },
    "aiInsights": [ ... ]
  }
}
```

### POST /api/transactions
Create a new transaction.

**Request Body:**
```json
{
  "amount": 150.50,
  "categoryId": "uuid",
  "description": "Monthly salary",
  "occurredAt": "2025-01-15T10:30:00Z",
  "currency": "USD"
}
```

**Required fields:** `amount`, `occurredAt`

### PUT /api/transactions/:id
Update a transaction.

**Request Body:**
```json
{
  "amount": 155.00,
  "description": "Updated description",
  "categoryId": "uuid"
}
```

### DELETE /api/transactions/:id
Delete a transaction.

**Response:**
```json
{
  "message": "Transaction deleted successfully"
}
```

---

## CSV Upload API (Task 24)

### POST /api/transactions/upload-csv
Upload a CSV file to bulk import transactions.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: CSV file

**CSV Format:**
The CSV file must have the following columns (case-insensitive):
- `amount` (required): Transaction amount (positive for income, negative for expense)
- `date` (required): Transaction date (ISO 8601 format or any valid date string)
- `category` (optional): Category name (will be matched with existing categories)
- `description` (optional): Transaction description
- `currency` (optional): Currency code (default: USD)

**Example CSV:**
```csv
amount,date,category,description,currency
150.00,2025-01-15,Salary,Monthly salary,USD
-45.50,2025-01-16,Groceries,Supermarket shopping,USD
-12.99,2025-01-17,Entertainment,Netflix subscription,USD
```

**Response:**
```json
{
  "message": "CSV processing completed",
  "results": {
    "success": 3,
    "failed": 0,
    "errors": []
  }
}
```

**Error Response (if some rows fail):**
```json
{
  "message": "CSV processing completed",
  "results": {
    "success": 2,
    "failed": 1,
    "errors": [
      {
        "row": 3,
        "error": "Invalid date format"
      }
    ]
  }
}
```

---

## Testing with cURL

### Create a category:
```bash
curl -X POST http://localhost:4000/api/categories \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Salary","type":"INCOME"}'
```

### Create a transaction:
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.50,
    "description": "Monthly salary",
    "occurredAt": "2025-01-15T10:00:00Z"
  }'
```

### Filter transactions:
```bash
curl "http://localhost:4000/api/transactions?startDate=2025-01-01&endDate=2025-01-31&keyword=salary" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Upload CSV:
```bash
curl -X POST http://localhost:4000/api/transactions/upload-csv \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@sample-transactions.csv"
```

---

## Notes

1. All endpoints require authentication except the auth endpoints
2. Date filtering uses ISO 8601 format
3. Keyword search is case-insensitive
4. Pagination defaults: page=1, limit=50
5. CSV upload processes all rows and reports success/failure for each
6. Categories are matched by name (case-insensitive) during CSV import
7. User can only access their own transactions
