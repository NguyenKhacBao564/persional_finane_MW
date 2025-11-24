"""
Shared types and data structures for agents
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime


@dataclass
class UserContext:
    """User context for agent queries"""
    user_id: str
    user_name: str
    store_id: str
    active_month: str  # YYYY-MM format
    currency: str = "USD"
    language: str = "vi"  # Language: 'vi' (Vietnamese) or 'en' (English)


@dataclass
class QueryOptions:
    """Options for file search queries"""
    include_knowledge_store: bool = True
    max_results: int = 10
    model: str = "gemini-2.5-flash"


@dataclass
class AgentResponse:
    """Standard response format from agents"""
    success: bool
    agent: str
    response: str
    confidence: float = 1.0
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "success": self.success,
            "agent": self.agent,
            "response": self.response,
            "confidence": self.confidence,
            "metadata": self.metadata or {},
            "error": self.error
        }
