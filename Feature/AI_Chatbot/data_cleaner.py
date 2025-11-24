"""
Data Cleaner for Personal Finance Chatbot
Cleans and exports database.json to Gemini File Search compatible format.
"""

import json
import os
import csv
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional, Set
from collections import defaultdict
import hashlib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_cleaner.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class DataCleaner:
    """Cleans and prepares financial data for Gemini File Search"""
    
    def __init__(self, input_file: str, output_dir: str):
        self.input_file = input_file
        self.output_dir = Path(output_dir)
        self.users_map = {}
        self.categories_map = {}
        self.stats = {
            'users': 0,
            'transactions': {'total': 0, 'duplicates': 0, 'cleaned': 0},
            'budgets': {'total': 0, 'duplicates': 0, 'cleaned': 0},
            'goals': {'total': 0, 'duplicates': 0, 'cleaned': 0},
            'categories': 0
        }
        
        logger.info(f"Initialized DataCleaner: input={input_file}, output={output_dir}")
    
    def load_data(self) -> Dict[str, Any]:
        """Load and validate input JSON"""
        logger.info(f"Loading data from {self.input_file}")
        
        try:
            with open(self.input_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            logger.info(f"Loaded {len(data.get('users', []))} users")
            logger.info(f"Loaded {len(data.get('transactions', []))} transactions")
            logger.info(f"Loaded {len(data.get('categories', []))} categories")
            logger.info(f"Loaded {len(data.get('budgets', []))} budgets")
            logger.info(f"Loaded {len(data.get('goals', []))} goals")
            
            return data
        except Exception as e:
            logger.error(f"Failed to load data: {e}")
            raise
    
    def build_lookup_maps(self, data: Dict[str, Any]):
        """Build lookup maps for users and categories"""
        logger.info("Building lookup maps...")
        
        # Map users
        for user in data.get('users', []):
            self.users_map[user['id']] = {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'createdAt': user['createdAt']
            }
        self.stats['users'] = len(self.users_map)
        logger.info(f"Mapped {self.stats['users']} users")
        
        # Map categories
        for cat in data.get('categories', []):
            self.categories_map[cat['id']] = {
                'id': cat['id'],
                'name': cat['name'],
                'type': cat['type'],
                'color': cat.get('color')
            }
        self.stats['categories'] = len(self.categories_map)
        logger.info(f"Mapped {self.stats['categories']} categories")
    
    def normalize_transaction(self, tx: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Normalize and enrich a single transaction"""
        try:
            # Parse amount
            amount = float(tx['amount'])
            
            # Get category info
            category_id = tx.get('categoryId')
            if category_id and category_id in self.categories_map:
                cat = self.categories_map[category_id]
                category_name = cat['name']
                category_type = cat['type']
            else:
                category_name = "Uncategorized"
                category_type = "UNKNOWN"
            
            # Calculate signed amount (INCOME positive, EXPENSE negative)
            if category_type == "INCOME":
                signed_amount = amount
            elif category_type == "EXPENSE":
                signed_amount = -amount
            else:
                signed_amount = 0.0
            
            # Parse dates
            occurred_at = tx['occurredAt']
            occurred_dt = datetime.fromisoformat(occurred_at.replace('Z', '+00:00'))
            occurred_date = occurred_dt.strftime('%Y-%m-%d')
            month = occurred_dt.strftime('%Y-%m')
            day_of_week = occurred_dt.strftime('%A')
            
            # Calculate if recent
            now = datetime.now(timezone.utc)
            days_diff = (now - occurred_dt).days
            is_recent_30d = days_diff <= 30
            is_current_month = month == now.strftime('%Y-%m')
            
            return {
                'tx_id': tx['id'],
                'user_id': tx['userId'],
                'occurred_at': occurred_at,
                'occurred_date': occurred_date,
                'month': month,
                'day_of_week': day_of_week,
                'amount': f"{amount:.2f}",
                'signed_amount': f"{signed_amount:.2f}",
                'currency': tx.get('currency', 'USD').upper(),
                'category_id': category_id or '',
                'category_name': category_name,
                'category_type': category_type,
                'description': tx.get('description', '').strip(),
                'created_at': tx['createdAt'],
                'updated_at': tx['updatedAt'],
                'is_recent_30d': is_recent_30d,
                'is_current_month': is_current_month,
                'duplicate_of': ''
            }
        except Exception as e:
            logger.warning(f"Failed to normalize transaction {tx.get('id')}: {e}")
            return None
    
    def deduplicate_transactions(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicate transactions based on composite key"""
        logger.info("Deduplicating transactions...")
        
        seen = {}
        duplicates = []
        cleaned = []
        
        for tx in transactions:
            # Create composite key
            key = (
                tx['user_id'],
                tx['occurred_date'],
                tx['amount'],
                tx['category_id'],
                tx['description'].lower()
            )
            
            key_hash = hashlib.md5(str(key).encode()).hexdigest()
            
            if key_hash in seen:
                # Duplicate found - keep the newer one
                existing = seen[key_hash]
                existing_dt = datetime.fromisoformat(existing['updated_at'].replace('Z', '+00:00'))
                current_dt = datetime.fromisoformat(tx['updated_at'].replace('Z', '+00:00'))
                
                if current_dt > existing_dt:
                    # Current is newer, mark existing as duplicate
                    logger.debug(f"Duplicate found: keeping {tx['tx_id']}, marking {existing['tx_id']} as duplicate")
                    existing['duplicate_of'] = tx['tx_id']
                    duplicates.append(existing)
                    seen[key_hash] = tx
                else:
                    # Existing is newer, mark current as duplicate
                    logger.debug(f"Duplicate found: keeping {existing['tx_id']}, marking {tx['tx_id']} as duplicate")
                    tx['duplicate_of'] = existing['tx_id']
                    duplicates.append(tx)
            else:
                seen[key_hash] = tx
        
        cleaned = list(seen.values())
        
        logger.info(f"Transactions: {len(transactions)} total, {len(duplicates)} duplicates, {len(cleaned)} unique")
        self.stats['transactions']['total'] = len(transactions)
        self.stats['transactions']['duplicates'] = len(duplicates)
        self.stats['transactions']['cleaned'] = len(cleaned)
        
        return cleaned
    
    def deduplicate_budgets(self, budgets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicate budgets based on userId, categoryId, period"""
        logger.info("Deduplicating budgets...")
        
        seen = {}
        cleaned = []
        
        for budget in budgets:
            key = (budget['userId'], budget['categoryId'], budget['period'])
            
            if key in seen:
                # Keep the latest
                existing = seen[key]
                existing_dt = datetime.fromisoformat(existing['updatedAt'].replace('Z', '+00:00'))
                current_dt = datetime.fromisoformat(budget['updatedAt'].replace('Z', '+00:00'))
                
                if current_dt > existing_dt:
                    logger.debug(f"Budget duplicate: keeping newer {budget['id']}")
                    seen[key] = budget
            else:
                seen[key] = budget
        
        cleaned = list(seen.values())
        
        logger.info(f"Budgets: {len(budgets)} total, {len(budgets) - len(cleaned)} duplicates, {len(cleaned)} unique")
        self.stats['budgets']['total'] = len(budgets)
        self.stats['budgets']['duplicates'] = len(budgets) - len(cleaned)
        self.stats['budgets']['cleaned'] = len(cleaned)
        
        return cleaned
    
    def deduplicate_goals(self, goals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicate goals based on userId, title, targetAmount, targetDate"""
        logger.info("Deduplicating goals...")
        
        seen = {}
        cleaned = []
        
        for goal in goals:
            key = (goal['userId'], goal['title'], goal['targetAmount'], goal['targetDate'])
            
            if key in seen:
                # Keep the latest
                existing = seen[key]
                existing_dt = datetime.fromisoformat(existing['updatedAt'].replace('Z', '+00:00'))
                current_dt = datetime.fromisoformat(goal['updatedAt'].replace('Z', '+00:00'))
                
                if current_dt > existing_dt:
                    logger.debug(f"Goal duplicate: keeping newer {goal['id']}")
                    seen[key] = goal
            else:
                seen[key] = goal
        
        cleaned = list(seen.values())
        
        logger.info(f"Goals: {len(goals)} total, {len(goals) - len(cleaned)} duplicates, {len(cleaned)} unique")
        self.stats['goals']['total'] = len(goals)
        self.stats['goals']['duplicates'] = len(goals) - len(cleaned)
        self.stats['goals']['cleaned'] = len(cleaned)
        
        return cleaned
    
    def enrich_budget(self, budget: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich budget with category details"""
        category_id = budget['categoryId']
        if category_id in self.categories_map:
            cat = self.categories_map[category_id]
            return {
                'budget_id': budget['id'],
                'user_id': budget['userId'],
                'category_id': category_id,
                'category_name': cat['name'],
                'category_type': cat['type'],
                'amount': f"{float(budget['amount']):.2f}",
                'period': budget['period'],
                'updated_at': budget['updatedAt']
            }
        return None
    
    def enrich_goal(self, goal: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich goal with calculated fields"""
        target_amount = float(goal['targetAmount'])
        progress = float(goal['progress'])
        target_date = datetime.fromisoformat(goal['targetDate'].replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        
        months_diff = (target_date.year - now.year) * 12 + (target_date.month - now.month)
        months_to_target = max(0, months_diff)
        
        remaining = max(0, target_amount - progress)
        required_monthly = remaining / months_to_target if months_to_target > 0 else 0
        
        return {
            'goal_id': goal['id'],
            'user_id': goal['userId'],
            'title': goal['title'],
            'target_amount': f"{target_amount:.2f}",
            'target_date': goal['targetDate'],
            'progress': f"{progress:.2f}",
            'months_to_target': months_to_target,
            'required_monthly_contribution': f"{required_monthly:.2f}",
            'updated_at': goal['updatedAt']
        }
    
    def export_user_data(self, user_id: str, transactions: List[Dict], budgets: List[Dict], goals: List[Dict]):
        """Export data for a single user"""
        user = self.users_map[user_id]
        user_dir = self.output_dir / f"store_user_{user_id}"
        user_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Exporting data for user {user['name']} ({user_id})")
        
        # 1. Export user profile
        profile = {
            'user_id': user_id,
            'name': user['name'],
            'email': user['email'],
            'created_at': user['createdAt'],
            'currency_preference': 'USD'
        }
        
        profile_path = user_dir / 'user_profile.json'
        with open(profile_path, 'w', encoding='utf-8') as f:
            json.dump(profile, f, indent=2, ensure_ascii=False)
        logger.debug(f"Exported {profile_path}")
        
        # 2. Export transactions by month
        tx_by_month = defaultdict(list)
        for tx in transactions:
            if tx['user_id'] == user_id:
                tx_by_month[tx['month']].append(tx)
        
        for month, month_txs in tx_by_month.items():
            csv_path = user_dir / f"transactions_{month}.csv"
            
            fieldnames = [
                'tx_id', 'occurred_at', 'occurred_date', 'month', 'day_of_week',
                'amount', 'signed_amount', 'currency', 'category_id', 'category_name',
                'category_type', 'description', 'created_at', 'updated_at',
                'is_recent_30d', 'is_current_month', 'duplicate_of', 'user_id'
            ]
            
            with open(csv_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for tx in sorted(month_txs, key=lambda x: x['occurred_at']):
                    writer.writerow(tx)
            
            logger.debug(f"Exported {len(month_txs)} transactions to {csv_path}")
        
        # 3. Export budgets
        user_budgets = [b for b in budgets if b['user_id'] == user_id]
        if user_budgets:
            budgets_path = user_dir / 'budgets.json'
            with open(budgets_path, 'w', encoding='utf-8') as f:
                json.dump(user_budgets, f, indent=2, ensure_ascii=False)
            logger.debug(f"Exported {len(user_budgets)} budgets to {budgets_path}")
        
        # 4. Export goals
        user_goals = [g for g in goals if g['user_id'] == user_id]
        if user_goals:
            goals_path = user_dir / 'goals.json'
            with open(goals_path, 'w', encoding='utf-8') as f:
                json.dump(user_goals, f, indent=2, ensure_ascii=False)
            logger.debug(f"Exported {len(user_goals)} goals to {goals_path}")
        
        # 5. Generate monthly summaries
        for month, month_txs in tx_by_month.items():
            self.generate_summary(user, month, month_txs, user_budgets, user_dir)
        
        logger.info(f"Completed export for user {user['name']}: {len(tx_by_month)} months, {len(user_budgets)} budgets, {len(user_goals)} goals")
    
    def generate_summary(self, user: Dict, month: str, transactions: List[Dict], budgets: List[Dict], user_dir: Path):
        """Generate natural language summary for a month"""
        total_income = sum(float(tx['signed_amount']) for tx in transactions if float(tx['signed_amount']) > 0)
        total_expense = sum(abs(float(tx['signed_amount'])) for tx in transactions if float(tx['signed_amount']) < 0)
        
        # Top categories
        category_spending = defaultdict(float)
        for tx in transactions:
            if float(tx['signed_amount']) < 0:
                category_spending[tx['category_name']] += abs(float(tx['signed_amount']))
        
        top_categories = sorted(category_spending.items(), key=lambda x: x[1], reverse=True)[:3]
        
        summary_lines = [
            f"# Financial Summary - {month}",
            f"[user: {user['id']}][month: {month}]",
            "",
            f"**User**: {user['name']}",
            f"**Period**: {month}",
            "",
            f"## Overview",
            f"- Total Income: ${total_income:.2f}",
            f"- Total Expenses: ${total_expense:.2f}",
            f"- Net: ${total_income - total_expense:.2f}",
            f"- Transaction Count: {len(transactions)}",
            "",
            f"## Top Spending Categories"
        ]
        
        for i, (cat, amount) in enumerate(top_categories, 1):
            summary_lines.append(f"{i}. {cat}: ${amount:.2f}")
        
        if budgets:
            summary_lines.append("")
            summary_lines.append("## Budget Status")
            for budget in budgets:
                cat_name = budget['category_name']
                budget_amt = float(budget['amount'])
                spent = category_spending.get(cat_name, 0)
                pct = (spent / budget_amt * 100) if budget_amt > 0 else 0
                summary_lines.append(f"- {cat_name}: ${spent:.2f} / ${budget_amt:.2f} ({pct:.1f}%)")
        
        summary_path = user_dir / f"summary_{month}.md"
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(summary_lines))
        
        logger.debug(f"Generated summary: {summary_path}")
    
    def export_knowledge_store(self):
        """Export global knowledge base files"""
        knowledge_dir = self.output_dir / 'store_knowledge'
        knowledge_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info("Exporting knowledge store...")
        
        # 1. Categories reference
        categories_list = list(self.categories_map.values())
        categories_path = knowledge_dir / 'categories_reference.json'
        with open(categories_path, 'w', encoding='utf-8') as f:
            json.dump(categories_list, f, indent=2, ensure_ascii=False)
        logger.debug(f"Exported {categories_path}")
        
        # 2. Finance glossary
        glossary = """# Personal Finance Glossary

## Core Concepts

**Transaction**: A financial event representing money flowing in (INCOME), out (EXPENSE), or between accounts (TRANSFER).

**Category**: A classification for transactions (e.g., Food & Dining, Transportation, Salary).

**Budget**: A planned spending limit for a specific category over a period (MONTHLY, WEEKLY, YEARLY).

**Goal**: A financial target with a target amount and date (e.g., Emergency Fund: $10,000 by 2026-12-31).

**Income**: Money received (salary, freelance, etc.) - positive signed_amount.

**Expense**: Money spent (shopping, dining, etc.) - negative signed_amount.

**Savings Rate**: (Total Income - Total Expenses) / Total Income × 100%.

## Data Fields

**signed_amount**: Positive for INCOME, negative for EXPENSE, zero for TRANSFER.
**occurred_date**: The actual date when the transaction happened (YYYY-MM-DD).
**category_type**: INCOME, EXPENSE, TRANSFER, or UNKNOWN.
"""
        
        glossary_path = knowledge_dir / 'finance_glossary.md'
        with open(glossary_path, 'w', encoding='utf-8') as f:
            f.write(glossary)
        logger.debug(f"Exported {glossary_path}")
        
        # 3. Retrieval guidelines
        guidelines = """# Retrieval Guidelines for AI Agents

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
"""
        
        guidelines_path = knowledge_dir / 'retrieval_guidelines.md'
        with open(guidelines_path, 'w', encoding='utf-8') as f:
            f.write(guidelines)
        logger.debug(f"Exported {guidelines_path}")
        
        logger.info(f"Knowledge store exported to {knowledge_dir}")
    
    def run(self):
        """Execute the full data cleaning pipeline"""
        logger.info("=" * 60)
        logger.info("Starting data cleaning pipeline")
        logger.info("=" * 60)
        
        # Load data
        data = self.load_data()
        
        # Build lookup maps
        self.build_lookup_maps(data)
        
        # Normalize transactions
        logger.info("Normalizing transactions...")
        normalized_txs = []
        for tx in data.get('transactions', []):
            normalized = self.normalize_transaction(tx)
            if normalized:
                normalized_txs.append(normalized)
        
        # Deduplicate
        cleaned_txs = self.deduplicate_transactions(normalized_txs)
        cleaned_budgets_raw = self.deduplicate_budgets(data.get('budgets', []))
        cleaned_goals_raw = self.deduplicate_goals(data.get('goals', []))
        
        # Enrich budgets and goals
        logger.info("Enriching budgets and goals...")
        cleaned_budgets = [self.enrich_budget(b) for b in cleaned_budgets_raw]
        cleaned_budgets = [b for b in cleaned_budgets if b is not None]
        
        cleaned_goals = [self.enrich_goal(g) for g in cleaned_goals_raw]
        
        # Export per-user data
        logger.info("Exporting per-user data...")
        for user_id in self.users_map.keys():
            self.export_user_data(user_id, cleaned_txs, cleaned_budgets, cleaned_goals)
        
        # Export knowledge store
        self.export_knowledge_store()
        
        # Print final stats
        logger.info("=" * 60)
        logger.info("Data cleaning completed successfully!")
        logger.info("=" * 60)
        logger.info(f"Users: {self.stats['users']}")
        logger.info(f"Categories: {self.stats['categories']}")
        logger.info(f"Transactions: {self.stats['transactions']['cleaned']} unique ({self.stats['transactions']['duplicates']} duplicates removed)")
        logger.info(f"Budgets: {self.stats['budgets']['cleaned']} unique ({self.stats['budgets']['duplicates']} duplicates removed)")
        logger.info(f"Goals: {self.stats['goals']['cleaned']} unique ({self.stats['goals']['duplicates']} duplicates removed)")
        logger.info(f"Output directory: {self.output_dir}")
        logger.info("=" * 60)


def main():
    """Main entry point"""
    input_file = 'database/database.json'
    output_dir = 'cleaned_data'
    
    cleaner = DataCleaner(input_file, output_dir)
    cleaner.run()


if __name__ == '__main__':
    main()
