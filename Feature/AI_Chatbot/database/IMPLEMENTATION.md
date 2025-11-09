# Database Auto-Sync Implementation

## Tổng quan

Hệ thống tự động đồng bộ dữ liệu từ PostgreSQL database sang JSON file để AI Chatbot có thể sử dụng.

## Files đã tạo/chỉnh sửa

### 1. Core Service
**File:** `backend/src/services/databaseSync.ts`

Chức năng:
- `syncToJsonFile()` - Sync toàn bộ database sang JSON
- `readJsonFile()` - Đọc snapshot hiện tại
- Fetch tất cả data từ 6 models: User, Transaction, Category, Budget, Goal, AIInsight
- Include relations (categories, budgets, sourceTransaction)
- Write to `Feature/AI_Chatbot/database/database.json`

### 2. Prisma Middleware
**File:** `backend/src/config/prisma.ts`

Đã thêm:
- Middleware để auto-trigger sync
- Danh sách `SYNC_MODELS`: User, Transaction, Category, Budget, Goal, AIInsight
- Danh sách `SYNC_ACTIONS`: create, update, delete, createMany, updateMany, deleteMany
- Background sync (non-blocking)

### 3. API Module
**File:** `backend/src/modules/sync/index.ts`

Endpoints:
- `GET /api/sync/status` - Lấy thông tin sync (public)
  - Trả về: lastUpdated, counts của từng model
- `POST /api/sync/trigger` - Trigger sync thủ công (requires auth)

**File:** `backend/src/routes/index.ts`
- Đã thêm route `/api/sync` vào main router

### 4. Scripts
**File:** `backend/sync-initial.ts`
- Script để sync lần đầu hoặc sync thủ công
- Có thể chạy: `npm run db:sync`

**File:** `backend/demo-auto-sync.ts`
- Demo script để test auto-sync
- Tạo category → verify sync → xóa category → verify sync

### 5. Configuration
**File:** `backend/package.json`
- Đã thêm script: `"db:sync": "tsx sync-initial.ts"`

**File:** `backend/CLAUDE.md`
- Đã document Database Auto-Sync section
- Thêm module `sync` vào danh sách modules

### 6. Output File
**File:** `Feature/AI_Chatbot/database/database.json`
- Auto-generated, chứa snapshot của database
- Structure:
  ```json
  {
    "lastUpdated": "ISO timestamp",
    "users": [...],
    "transactions": [...],
    "categories": [...],
    "budgets": [...],
    "goals": [...],
    "aiInsights": [...]
  }
  ```

### 7. Documentation
**File:** `Feature/AI_Chatbot/database/README.md`
- Hướng dẫn sử dụng chi tiết
- API documentation
- Code examples

## Cách hoạt động

### Auto-Sync Flow
```
1. User tạo/update/delete record
   ↓
2. Prisma executes query
   ↓
3. Prisma middleware intercepts
   ↓
4. Check if model in SYNC_MODELS && action in SYNC_ACTIONS
   ↓
5. Trigger syncToJsonFile() in background
   ↓
6. Fetch all data from database
   ↓
7. Write to database.json
   ↓
8. Return to user (không đợi sync hoàn tất)
```

### Manual Sync Options

**Option 1: NPM Script**
```bash
cd backend
npm run db:sync
```

**Option 2: API Call (requires auth)**
```bash
curl -X POST http://localhost:4000/api/sync/trigger \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Option 3: Direct Script**
```bash
cd backend
npx tsx sync-initial.ts
```

## Testing

### Test Auto-Sync
```bash
cd backend
npx tsx demo-auto-sync.ts
```

Output mẫu:
```
🎬 Starting auto-sync demo...
📊 Step 1: Reading initial JSON file...
   ✓ Current categories count: 16

➕ Step 2: Creating test category...
   ✓ Created category: Auto-Sync Test Category

⏳ Step 3: Waiting for auto-sync to complete...
   ✓ Wait complete

🔍 Step 4: Verifying sync...
   ✅ Auto-sync SUCCESSFUL!

✅ Step 5: Test category found in JSON file
🧹 Step 6: Cleaning up...
✅ Deletion sync SUCCESSFUL!

🎉 Demo completed!
   - Auto-sync is WORKING ✅
```

### Test API
```bash
# Check status
curl http://localhost:4000/api/sync/status

# Response
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

## Performance Considerations

1. **Background Execution**
   - Sync chạy sau khi response đã trả về user
   - Không block main operations
   - Error trong sync không affect request

2. **File Size**
   - Current: ~208 lines cho 16 categories + 3 transactions
   - Nếu database lớn → cân nhắc:
     - Pagination
     - Filtering (chỉ sync recent data)
     - Compression

3. **Sync Frequency**
   - Mỗi operation trigger một lần sync
   - Có thể optimize với debouncing/throttling nếu cần

## Security

⚠️ **File `database.json` chứa dữ liệu nhạy cảm:**
- User emails, passwords (hashed)
- Transaction amounts
- Personal financial data

**Recommendations:**
- ❌ KHÔNG commit vào git
- ✅ Đã add vào .gitignore (nếu cần)
- ✅ Chỉ AI Chatbot local access
- ✅ Endpoint `/sync/trigger` requires authentication

## Troubleshooting

### Sync không hoạt động?
1. Check server logs: `console.log` trong middleware
2. Verify models trong `SYNC_MODELS`
3. Check file permissions: `Feature/AI_Chatbot/database/`
4. Manual sync: `npm run db:sync`

### File bị corrupt?
```bash
# Delete và re-sync
rm Feature/AI_Chatbot/database/database.json
npm run db:sync
```

### Cần disable auto-sync?
Comment out middleware trong `src/config/prisma.ts`:
```typescript
// prisma.$use(async (params, next) => {
//   ...
// });
```

## Next Steps

Để AI Chatbot sử dụng:
```javascript
// Load database snapshot
const fs = require('fs/promises');
const dbSnapshot = JSON.parse(
  await fs.readFile('./database/database.json', 'utf-8')
);

// Query data
const user = dbSnapshot.users.find(u => u.email === 'user@example.com');
const userTransactions = dbSnapshot.transactions.filter(
  t => t.userId === user.id
);

// Analytics
const totalIncome = userTransactions
  .filter(t => t.type === 'INCOME')
  .reduce((sum, t) => sum + t.amount, 0);
```

## Kết luận

✅ Hệ thống auto-sync đã hoạt động ổn định
✅ Tested với create/update/delete operations
✅ API endpoints sẵn sàng
✅ Documentation đầy đủ
✅ Ready for AI Chatbot integration
