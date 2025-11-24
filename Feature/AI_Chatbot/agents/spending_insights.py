"""
Spending Insights Agent
Analyzes spending trends, patterns, anomalies
"""

import logging
from typing import Dict, Any
from .shared import UserContext, QueryOptions, AgentResponse, FileSearchClient

logger = logging.getLogger(__name__)


class SpendingInsightsAgent:
    """Agent specialized in spending pattern analysis"""
    
    def __init__(self, file_search_client: FileSearchClient):
        self.client = file_search_client
        self.name = "SpendingInsights"
        logger.info(f"Initialized {self.name}")
    
    def analyze(self, user_context: UserContext, query: str, options: QueryOptions = None) -> AgentResponse:
        """
        Analyze spending patterns and provide insights
        
        Args:
            user_context: User context
            query: Natural language query about spending patterns
            options: Query options
        
        Returns:
            AgentResponse with insights
        """
        logger.info(f"[{self.name}] Analyzing: {query}")
        
        # Enhance query for insights analysis
        if user_context.language == "vi":
            enhanced_query = f"""Phân tích chi tiêu - TRẢ LỜI NGẮN GỌN.

Câu hỏi: {query}

Format:
• Top 2-3 danh mục chi tiêu: tên + số tiền
• Thu nhập/Chi tiêu: $XX / $XX
• 1-2 nhận xét quan trọng

Tháng {user_context.active_month}. Dùng summary/CSV. TIẾNG VIỆT. TÓM TẮT.
"""
        else:
            enhanced_query = f"""You are a financial spending insights analyst.

User query: {query}

Please analyze spending patterns and provide:
1. Month-over-month trends if multiple months are available
2. Top spending categories
3. Any unusual or noteworthy spending patterns
4. Income vs expense balance
5. Actionable insights or recommendations

Look at transaction summaries and CSV files across available months.
Compare current month {user_context.active_month} with previous months if relevant.
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
                    confidence=0.85,
                    metadata={
                        "query_type": "spending_insights",
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
