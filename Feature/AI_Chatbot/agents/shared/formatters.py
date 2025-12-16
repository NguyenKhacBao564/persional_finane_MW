"""
Formatting utilities for financial data
"""

from typing import List, Dict, Any
from datetime import datetime


def format_currency(amount: float, currency: str = "USD") -> str:
    """Format amount as currency"""
    if currency == "USD":
        return f"${amount:,.2f}"
    return f"{amount:,.2f} {currency}"


def format_percentage(value: float) -> str:
    """Format value as percentage"""
    return f"{value:.1f}%"


def format_date(date_str: str) -> str:
    """Format ISO date string to readable format"""
    try:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime('%B %d, %Y')
    except:
        return date_str


def format_month(month_str: str) -> str:
    """Format YYYY-MM to readable month"""
    try:
        dt = datetime.strptime(month_str, '%Y-%m')
        return dt.strftime('%B %Y')
    except:
        return month_str


def format_bullet_list(items: List[str]) -> str:
    """Format items as bullet list"""
    return "\n".join([f"• {item}" for item in items])


def format_table(headers: List[str], rows: List[List[Any]]) -> str:
    """Format data as simple text table"""
    lines = []
    
    # Header
    lines.append(" | ".join(headers))
    lines.append("-" * (len(" | ".join(headers))))
    
    # Rows
    for row in rows:
        lines.append(" | ".join([str(cell) for cell in row]))
    
    return "\n".join(lines)


def summarize_transactions(transactions: List[Dict[str, Any]], limit: int = 5) -> str:
    """Summarize transaction list"""
    if not transactions:
        return "No transactions found."
    
    lines = []
    for i, tx in enumerate(transactions[:limit], 1):
        date = format_date(tx.get('occurred_date', ''))
        amount = format_currency(abs(float(tx.get('amount', 0))))
        desc = tx.get('description', 'Unknown')
        category = tx.get('category_name', 'Uncategorized')
        
        lines.append(f"{i}. {date} - {desc} ({category}): {amount}")
    
    if len(transactions) > limit:
        lines.append(f"... and {len(transactions) - limit} more transactions")
    
    return "\n".join(lines)
