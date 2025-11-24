"""
Goal Tracker Agent
Tracks financial goals, progress, and provides recommendations
"""

import logging
from typing import Dict, Any
from .shared import UserContext, QueryOptions, AgentResponse, FileSearchClient

logger = logging.getLogger(__name__)


class GoalTrackerAgent:
    """Agent specialized in financial goal tracking"""
    
    def __init__(self, file_search_client: FileSearchClient):
        self.client = file_search_client
        self.name = "GoalTracker"
        logger.info(f"Initialized {self.name}")
    
    def track(self, user_context: UserContext, query: str, options: QueryOptions = None) -> AgentResponse:
        """
        Track goal progress and provide recommendations
        
        Args:
            user_context: User context
            query: Natural language query about goals
            options: Query options
        
        Returns:
            AgentResponse with goal tracking info
        """
        logger.info(f"[{self.name}] Tracking: {query}")
        
        # Enhance query for goal tracking
        if user_context.language == "vi":
            enhanced_query = f"""Theo dõi mục tiêu - TRẢ LỜI NGẮN GỌN.

Câu hỏi: {query}

Format:
• Mục tiêu: [tên] - $XX,XXX
• Tiến độ: $XX,XXX (XX%)
• Cần tiết kiệm: $XXX/tháng
• Đánh giá: đúng hướng/cần cố gắng (1 câu)

Dùng goals.json. TIẾNG VIỆT. TÓM TẮT.
"""
        else:
            enhanced_query = f"""You are a financial goal tracking advisor.

User query: {query}

Please analyze goal data and provide:
1. Current goal progress from goals.json
2. Target amounts and target dates
3. Required monthly contributions (already calculated in the data)
4. Whether the user is on track based on current income/savings
5. Recommendations for achieving goals

Use goals.json for goal details and income data from transactions.
Be encouraging but realistic.
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
                        "query_type": "goal_tracking",
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
