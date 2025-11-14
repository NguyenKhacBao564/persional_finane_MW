# Database Auto-Sync to JSON

Hệ thống tự động đồng bộ dữ liệu từ PostgreSQL database sang file JSON để AI Chatbot có thể sử dụng.

## Cơ chế hoạt động

### 1. Tự động sync (Auto-sync)
Mỗi khi có thay đổi database (CREATE, UPDATE, DELETE) trên các model sau:
- User
- Transaction
- Category
- Budget
- Goal
- AIInsight

→ Dữ liệu sẽ tự động được sync vào file `database.json`

### 2. File output
**Location:** `Feature/AI_Chatbot/database/database.json`

**Cấu trúc:**
```json
{
  "lastUpdated": "2025-11-08T13:33:29.066Z",
  "users": [...],
  "transactions": [...],
  "categories": [...],
  "budgets": [...],
  "goals": [...],
  "aiInsights": [...]
}
```

## Cách sử dụng

### Kiểm tra trạng thái sync
```bash
curl http://localhost:4000/api/sync/status
```

Response:
```json
{
  "success": true,
  "data": {
    "lastUpdated": "2025-11-08T13:33:29.066Z",
    "counts": {
      "users": 2,
      "transactions": 3,
      "categories": 16,
      "budgets": 0,
      "goals": 0,
      "aiInsights": 0
    }
  }
}
```

### Sync thủ công (Manual sync)
```bash
# Chạy script
cd backend
npx tsx sync-initial.ts

# Hoặc gọi API (cần authentication)
curl -X POST http://localhost:4000/api/sync/trigger \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Implementation Details

### Service: `src/services/databaseSync.ts`
- `syncToJsonFile()` - Sync toàn bộ database sang JSON
- `readJsonFile()` - Đọc snapshot hiện tại

### Middleware: `src/config/prisma.ts`
Prisma middleware tự động trigger sync khi:
- Model thuộc danh sách `SYNC_MODELS`
- Action thuộc danh sách `SYNC_ACTIONS` (create, update, delete, createMany, updateMany, deleteMany)

### API Endpoints: `src/modules/sync/index.ts`
- `GET /api/sync/status` - Lấy thông tin sync (public)
- `POST /api/sync/trigger` - Trigger sync thủ công (cần auth)

## Lưu ý

1. **Performance:** Sync chạy ở background, không block request chính
2. **Error handling:** Lỗi sync được log nhưng không làm fail request
3. **File size:** Nếu database lớn, file JSON sẽ lớn theo → cân nhắc pagination/filtering
4. **Security:** File chứa dữ liệu nhạy cảm → không commit vào git

## Ví dụ sử dụng trong AI Chatbot

```javascript
// Đọc database snapshot
const fs = require('fs/promises');
const data = JSON.parse(
  await fs.readFile('./database/database.json', 'utf-8')
);

// Truy vấn dữ liệu
const userTransactions = data.transactions.filter(
  t => t.userId === 'user-id-here'
);

// Phân tích chi tiêu
const totalExpense = userTransactions
  .filter(t => t.type === 'EXPENSE')
  .reduce((sum, t) => sum + t.amount, 0);
```
