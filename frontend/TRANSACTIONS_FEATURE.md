# Transaction List Feature - E2-S4

## Summary

Built a complete Transaction List screen with server-side pagination, filters, and responsive design. The feature includes:

- ✅ Beautiful, modern UI with light/dark mode support
- ✅ Server-side pagination with URL synchronization
- ✅ Advanced filtering (search, type, category, amount range, date range, sorting)
- ✅ Responsive design (table view on desktop, card view on mobile)
- ✅ MSW mock handlers for development without backend
- ✅ TypeScript type-safe implementation
- ✅ Accessible components with ARIA labels

## Files Created/Modified

### Types
- **src/types/transactions.ts** - TypeScript interfaces for Transaction, TxType, TxCategory, TxAccount, TxListResponse, TxFilters

### API Layer
- **src/api/transactions.ts** - fetchTransactions function with envelope unwrapping

### UI Components (shadcn/ui)
- **src/ui/table.tsx** - Table components (Table, TableHeader, TableBody, TableRow, TableCell, etc.)
- **src/ui/select.tsx** - Select dropdown component with Radix UI
- **src/ui/badge.tsx** - Badge component for labels
- **src/ui/skeleton.tsx** - Loading skeleton component
- **src/ui/separator.tsx** - Separator component
- **src/ui/alert.tsx** - Alert component for error messages
- **src/ui/index.ts** - Updated to export all new components

### Transaction Components
- **src/components/transactions/TransactionFilterBar.tsx** - Sticky filter bar with debounced search (300ms), type/category/sort selects, amount range, date range, reset button
- **src/components/transactions/TransactionTable.tsx** - Desktop table view with formatted dates, type badges, category pills, amounts with color coding
- **src/components/transactions/TransactionCardItem.tsx** - Mobile card view with emphasis on amount, compact layout
- **src/components/transactions/PaginationBar.tsx** - Pagination with prev/next, page numbers, page size selector (10/20/50)
- **src/components/transactions/TransactionSkeleton.tsx** - Loading state with skeleton rows for both desktop and mobile
- **src/components/transactions/EmptyState.tsx** - Empty state with icon, message, and CTA button

### Pages
- **src/pages/Transactions.tsx** - Main page with URL sync, React Query integration, responsive layout switching

### Utilities
- **src/lib/formatters.ts** - Currency formatting (VND support), date formatting, type badge helpers

### Router
- **src/app/router.tsx** - Added /transactions route

### Mock Data
- **src/mocks/handlers.ts** - Added GET /api/transactions handler with:
  - 237 generated transactions
  - Full filter support (search, type, category, amount range, date range)
  - Sorting (txDate, amount, asc/desc)
  - Pagination logic

## Features

### Filtering
- **Search**: Debounced 300ms, searches in note, category name, account name
- **Type**: All / Income / Expense / Transfer
- **Category**: All / Food / Transport / Shopping / Bills / Salary / Other
- **Sort**: Newest / Oldest / Amount ↑ / Amount ↓
- **Amount Range**: Min and Max inputs (VND)
- **Date Range**: Start and End date pickers
- **Reset Filters**: Clear all filters button (shown when any filter is active)

### Pagination
- Page navigation: Prev/Next buttons + numbered pages
- Smart page number display with ellipsis for large page counts
- Page size selector: 10, 20, 50 items per page
- Shows "Showing X to Y of Z results"
- Preserves filters when changing pages

### URL Synchronization
All filters are synchronized with URL query parameters:
- `?page=1&limit=10&sort=txDate:desc`
- `?search=coffee&type=EXPENSE&category=cat_food`
- `?min=50000&max=500000&start=2025-01-01&end=2025-12-31`

This makes the page shareable and bookmark-able.

### Responsive Design

**Desktop (md+)**:
- Full table view with 6 columns (Date, Type, Category, Note, Account, Amount)
- Sticky filter bar at top
- Hover effects on table rows
- Row height: 48px (h-12)

**Mobile (<md)**:
- Card-based layout
- Vertical stacking of information
- Large, prominent amount display
- Compact date and type badge at top
- Touch-friendly spacing

### Styling Details

**Colors**:
- Primary: blue-600 (#2563eb)
- Income: emerald-50 text emerald-700
- Expense: rose-50 text rose-700
- Transfer: slate-100 text slate-700
- Amounts: red-600 (negative) / green-600 (positive)

**Components**:
- Cards: rounded-2xl, shadow-sm, ring-1
- Buttons: rounded-md, focus-visible rings
- Inputs: h-10, border-input
- Table: border-b rows, hover:bg-muted/50

### Accessibility

- Semantic HTML (proper table markup)
- ARIA labels on controls
- `aria-controls="transactions-table"` on filters
- `aria-label` on pagination buttons
- `aria-current="page"` on active page
- Keyboard navigable
- Color contrast compliant

### Loading States

- Full-page skeleton during initial load
- 10 skeleton rows matching the page limit
- Both desktop table and mobile card skeletons
- Filters disabled during loading

### Error Handling

- Alert component with error icon
- Error message from API
- Retry button
- Fallback messages for unknown errors

### Empty State

- Friendly icon (💳)
- Clear message
- CTA button to add transaction
- Centered layout

## API Contract

### Request
```
GET /api/transactions?page=1&limit=10&search=coffee&type=EXPENSE&category=cat_food&min=50000&max=500000&start=2025-01-01&end=2025-12-31&sort=txDate:desc
```

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "tx_1",
        "txDate": "2025-10-10T08:00:00Z",
        "type": "EXPENSE",
        "category": {
          "id": "cat_food",
          "name": "Food",
          "color": "#F97316"
        },
        "note": "Coffee at Starbucks",
        "amount": -45000,
        "currency": "VND",
        "account": {
          "id": "acc_cash",
          "name": "Cash"
        }
      }
    ],
    "page": 1,
    "limit": 10,
    "total": 237
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Failed to fetch transactions",
    "code": "FETCH_ERROR"
  }
}
```

## Testing with MSW

The feature works out of the box with MSW mocks:

1. MSW generates 237 fake transactions
2. All filters work correctly
3. Pagination calculates properly
4. Sorting works on date and amount
5. Search filters across note, category, and account

## How to Use

### Development
```bash
cd frontend
npm run dev
# Navigate to http://localhost:5173/transactions
```

### With Real Backend
Set `VITE_API_BASE_URL` in `.env`:
```
VITE_API_BASE_URL=http://localhost:8080
```

### Test Scenarios

1. **Default View**: Visit `/transactions` → Shows page 1, 10 items, newest first
2. **Search**: Type "coffee" → Filters after 300ms, resets to page 1
3. **Type Filter**: Select "EXPENSE" → Shows only expenses
4. **Amount Range**: Set 0 to 100000 → Shows items in range
5. **Date Range**: Select this month → Filters by date
6. **Pagination**: Click page 2 → Loads next page, preserves filters
7. **Page Size**: Change to 20 → Shows 20 items per page
8. **Mobile**: Resize to mobile → Switches to card view
9. **Dark Mode**: Toggle theme → Colors adapt correctly

## Dependencies Installed
```json
{
  "@radix-ui/react-select": "latest",
  "@radix-ui/react-separator": "latest"
}
```

## Acceptance Criteria

✅ **AC1**: Visiting `/transactions` shows first 10 items, newest first, URL: `?page=1&limit=10&sort=txDate:desc`

✅ **AC2**: Typing in Search updates URL after 300ms and refetches list

✅ **AC3**: Changing Type=EXPENSE + Category=Food + Amount 0..100000 + Date this month filters correctly

✅ **AC4**: Pagination works; total pages = ceil(total/limit); navigating preserves filters

✅ **AC5**: Error from BE shows alert and does not crash; Retry works

✅ **AC6**: Mobile view (≤ md) uses card layout; desktop uses table

✅ **AC7**: With MSW on, list renders fake data and all filters/pagination behave

✅ **AC8**: Dark mode looks good (no unreadable text)

## Performance Optimizations

- Debounced search (300ms) to reduce API calls
- React Query for efficient data fetching and caching
- URL params prevent unnecessary refetches
- Memoized filter parsing from URL
- Responsive design with CSS media queries (no JS)

## Future Enhancements

- Click row to open detail drawer
- Export transactions to CSV
- Bulk actions (delete, categorize)
- Real-time updates with websockets
- Infinite scroll option
- Advanced date presets (This week, Last month, etc.)
- Category color picker
- Multi-select for categories

## Technical Notes

- React Query v5 syntax (no keepPreviousData)
- TypeScript strict mode enabled
- Tailwind CSS for styling
- Lucide React for icons
- Radix UI for accessible components
- MSW for API mocking
- Vite for fast builds
