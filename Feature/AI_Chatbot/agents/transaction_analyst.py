"""
Transaction Analyst Agent
Analyzes transactions, totals by category/date, largest transactions, recurring patterns
"""

import logging
from typing import Dict, Any
from .shared import UserContext, QueryOptions, AgentResponse, FileSearchClient

logger = logging.getLogger(__name__)


class TransactionAnalystAgent:
    """Agent specialized in transaction analysis"""
    
    def __init__(self, file_search_client: FileSearchClient):
        self.client = file_search_client
        self.name = "TransactionAnalyst"
        logger.info(f"Initialized {self.name}")
    
    def analyze(self, user_context: UserContext, query: str, options: QueryOptions = None) -> AgentResponse:
        """
        Analyze transactions based on query
        
        Args:
            user_context: User context
            query: Natural language query about transactions
            options: Query options
        
        Returns:
            AgentResponse with analysis
        """
        logger.info(f"[{self.name}] Analyzing: {query}")
        
        # Enhance query for transaction-specific analysis
        if user_context.language == "vi":
            enhanced_query = f"""Phân tích giao dịch - TRẢ LỜI NGẮN GỌN.

Câu hỏi: {query}

Trả lời theo format:
• Tổng: $XX.XX
• Chi tiết quan trọng (nếu cần): ngày/tháng và số tiền
• 1-2 nhận xét ngắn (nếu có điểm đáng chú ý)

Tháng {user_context.active_month}. Dùng file CSV/summary. TIẾNG VIỆT. NGẮN GỌN.
"""
        else:
            enhanced_query = f"""You are a financial transaction analyst. 

User query: {query}

Please analyze the transaction data and provide:
1. Specific transaction amounts and dates
2. Category breakdowns if relevant
3. Clear totals and summaries
4. Any patterns or notable transactions

Focus on transactions from {user_context.active_month} unless otherwise specified.
Use the transactions CSV file and summary markdown for accurate data.
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
                        "query_type": "transaction_analysis",
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
