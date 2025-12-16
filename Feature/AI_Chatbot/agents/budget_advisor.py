"""
Budget Advisor Agent
Tracks budget utilization, burn rate, projections
"""

import logging
from typing import Dict, Any
from .shared import UserContext, QueryOptions, AgentResponse, FileSearchClient

logger = logging.getLogger(__name__)


class BudgetAdvisorAgent:
    """Agent specialized in budget tracking and advice"""
    
    def __init__(self, file_search_client: FileSearchClient):
        self.client = file_search_client
        self.name = "BudgetAdvisor"
        logger.info(f"Initialized {self.name}")
    
    def advise(self, user_context: UserContext, query: str, options: QueryOptions = None) -> AgentResponse:
        """
        Provide budget advice based on query
        
        Args:
            user_context: User context
            query: Natural language query about budgets
            options: Query options
        
        Returns:
            AgentResponse with advice
        """
        logger.info(f"[{self.name}] Advising: {query}")
        
        # Enhance query for budget-specific analysis
        if user_context.language == "vi":
            enhanced_query = f"""Phân tích ngân sách - TRẢ LỜI NGẮN GỌN.

Câu hỏi: {query}

Format trả lời:
• Ngân sách: $XX / Đã dùng: $XX (XX%)
• Còn lại: $XX
• Đánh giá 1 câu (tốt/cần cẩn thận/vượt)

Tháng {user_context.active_month}. Dùng budgets.json + CSV. TIẾNG VIỆT. TÓM TẮT.
"""
        else:
            enhanced_query = f"""You are a financial budget advisor.

User query: {query}

Please analyze the budget data and provide:
1. Current budget allocations from budgets.json
2. Actual spending from transactions for {user_context.active_month}
3. Budget utilization percentages
4. Burn rate and month-end projections if relevant
5. Recommendations for staying on budget

Use budgets.json for budget amounts and transactions CSV for actual spending.
Be specific with numbers and percentages.
"""
        
        try:
            result = self.client.query(
                user_context=user_context,
                query_text=enhanced_query,
                options=options
            )
            
            if result['success']:
                return AgentResponse(
                    success=True,
                    agent=self.name,
                    response=result['result'],
                    confidence=0.9,
                    metadata={
                        "query_type": "budget_analysis",
                        "stores_queried": result.get('stores', [])
                    }
                )
            else:
                return AgentResponse(
                    success=False,
                    agent=self.name,
                    response="",
                    error=result.get('error', 'Unknown error')
                )
        
        except Exception as e:
            logger.error(f"[{self.name}] Error: {e}")
            return AgentResponse(
                success=False,
                agent=self.name,
                response="",
                error=str(e)
            )
