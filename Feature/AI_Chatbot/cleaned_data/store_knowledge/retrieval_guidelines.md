# Retrieval Guidelines for AI Agents

## File Structure

Each user has a dedicated store with:
- `user_profile.json`: Name, email, preferences
- `transactions_YYYY-MM.csv`: Monthly transaction records
- `budgets.json`: Active budget allocations
- `goals.json`: Financial goals with progress
- `summary_YYYY-MM.md`: Natural language monthly overview

## Query Strategies

**For spending questions**: Read transactions CSV for the relevant month(s).

**For budget tracking**: Combine budgets.json with current month transactions.

**For goal progress**: Read goals.json and recent income/savings context.

**For trends**: Compare multiple monthly transaction CSVs and summaries.

## Data Interpretation

- Filter transactions by `category_type` to separate income from expenses.
- Use `signed_amount` for totals (already signed correctly).
- Use `occurred_date` for time-based filtering, not `created_at`.
- Check `is_current_month` flag for quick current period filtering.
- Exclude transactions where `category_type` is UNKNOWN unless explicitly asked.
