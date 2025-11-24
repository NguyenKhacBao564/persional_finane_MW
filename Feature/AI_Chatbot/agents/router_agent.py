"""
Router Agent - Orchestrates query routing to specialist agents
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

from .shared import UserContext, QueryOptions, AgentResponse, FileSearchClient
from .transaction_analyst import TransactionAnalystAgent
from .budget_advisor import BudgetAdvisorAgent
from .spending_insights import SpendingInsightsAgent
from .goal_tracker import GoalTrackerAgent

logger = logging.getLogger(__name__)


class RouterAgent:
    """
    Main orchestrator that routes queries to appropriate specialist agents
    """
    
    def __init__(self, file_search_client: FileSearchClient):
        self.client = file_search_client
        self.name = "Router"
        
        # Initialize specialist agents
        self.transaction_analyst = TransactionAnalystAgent(file_search_client)
        self.budget_advisor = BudgetAdvisorAgent(file_search_client)
        self.spending_insights = SpendingInsightsAgent(file_search_client)
        self.goal_tracker = GoalTrackerAgent(file_search_client)
        
        logger.info(f"Initialized {self.name} with 4 specialist agents")
    
    def route_query(
        self,
        user_context: UserContext,
        query: str,
        options: Optional[QueryOptions] = None
    ) -> AgentResponse:
        """
        Route query to appropriate agent based on intent
        
        Args:
            user_context: User context
            query: User's natural language query
            options: Query options
        
        Returns:
            AgentResponse from selected agent
        """
        if options is None:
            options = QueryOptions()
        
        logger.info(f"[{self.name}] Routing query: {query}")
        
        # Classify intent
        agent = self._classify_intent(query)
        
        logger.info(f"[{self.name}] Selected agent: {agent.name}")
        
        # Route to appropriate agent
        try:
            if isinstance(agent, BudgetAdvisorAgent):
                return agent.advise(user_context, query, options)
            elif isinstance(agent, GoalTrackerAgent):
                return agent.track(user_context, query, options)
            elif isinstance(agent, SpendingInsightsAgent):
                return agent.analyze(user_context, query, options)
            else:  # TransactionAnalystAgent (default)
                return agent.analyze(user_context, query, options)
        
        except Exception as e:
            logger.error(f"[{self.name}] Routing error: {e}")
            return AgentResponse(
                success=False,
                agent=self.name,
                response="",
                error=f"Failed to route query: {str(e)}"
            )
    
    def _classify_intent(self, query: str) -> Any:
        """
        Classify user intent and select appropriate agent
        
        Uses keyword matching for fast, reliable routing
        Supports both Vietnamese and English
        """
        query_lower = query.lower()
        
        # Budget-related keywords (Vietnamese + English)
        budget_keywords = [
            # English
            'budget', 'over', 'under', 'left', 'remaining',
            'budget limit', 'overspending', 'burn rate',
            'how much can i spend', 'monthly budget',
            # Vietnamese
            'ngân sách', 'vượt', 'dưới', 'còn lại', 'còn',
            'giới hạn ngân sách', 'chi tiêu quá', 'tốc độ chi',
            'tôi có thể chi', 'ngân sách tháng', 'chi quá',
            'vượt ngân sách', 'trong ngân sách'
        ]
        
        if any(keyword in query_lower for keyword in budget_keywords):
            return self.budget_advisor
        
        # Goal-related keywords (Vietnamese + English)
        goal_keywords = [
            # English
            'goal', 'save', 'saving', 'target', 'emergency fund',
            'contribution', 'on track', 'achieve', 'progress toward',
            # Vietnamese
            'mục tiêu', 'tiết kiệm', 'dự trữ', 'quỹ khẩn cấp',
            'quỹ dự phòng', 'đóng góp', 'đúng hướng', 'đạt được',
            'tiến độ', 'quỹ dự trữ', 'kế hoạch tiết kiệm',
            'tiết kiệm tháng', 'tiết kiệm hàng tháng'
        ]
        
        if any(keyword in query_lower for keyword in goal_keywords):
            return self.goal_tracker
        
        # Insights/trends keywords (Vietnamese + English)
        insights_keywords = [
            # English
            'trend', 'pattern', 'compare', 'last month', 'this month vs',
            'month over month', 'spending habits', 'insight',
            'why did', 'how come', 'unusual', 'anomaly',
            # Vietnamese
            'xu hướng', 'mẫu hình', 'so sánh', 'tháng trước',
            'tháng này vs', 'tháng này so với', 'thói quen chi tiêu',
            'nhận xét', 'tại sao', 'làm sao', 'bất thường',
            'khác thường', 'phân tích', 'chi tiết'
        ]
        
        if any(keyword in query_lower for keyword in insights_keywords):
            return self.spending_insights
        
        # Default to transaction analyst for specific queries
        # (transactions, amounts, categories, dates, etc.)
        return self.transaction_analyst
