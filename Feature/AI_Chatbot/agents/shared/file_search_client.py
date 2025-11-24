"""
FileSearch client wrapper for agents
"""

import os
import logging
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
from google import genai
from google.genai import types

from .types import UserContext, QueryOptions

load_dotenv()

logger = logging.getLogger(__name__)


class FileSearchClient:
    """Wrapper for Gemini File Search operations"""
    
    def __init__(self, api_key: Optional[str] = None, knowledge_store_id: Optional[str] = None):
        """Initialize client"""
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found")
        
        self.client = genai.Client(api_key=self.api_key)
        self.knowledge_store_id = knowledge_store_id
        
        logger.info("Initialized FileSearchClient")
    
    def query(
        self,
        user_context: UserContext,
        query_text: str,
        options: Optional[QueryOptions] = None
    ) -> Dict[str, Any]:
        """
        Query user's file search store with context
        
        Args:
            user_context: User context with store_id
            query_text: Natural language query
            options: Query options
        
        Returns:
            Dictionary with search results
        """
        if options is None:
            options = QueryOptions()
        
        # Build store list
        store_ids = [user_context.store_id]
        
        if options.include_knowledge_store and self.knowledge_store_id:
            store_ids.append(self.knowledge_store_id)
        
        # Enhance query with user context
        enhanced_query = self._enhance_query(query_text, user_context)
        
        logger.info(f"Querying stores for user {user_context.user_name}: {query_text}")
        logger.debug(f"Enhanced query: {enhanced_query}")
        logger.debug(f"Store IDs: {store_ids}")
        
        try:
            response = self.client.models.generate_content(
                model=options.model,
                contents=enhanced_query,
                config=types.GenerateContentConfig(
                    tools=[
                        types.Tool(
                            file_search=types.FileSearch(
                                file_search_store_names=store_ids
                            )
                        )
                    ]
                )
            )
            
            result_text = response.text
            
            logger.info(f"Query successful: {len(result_text)} chars")
            
            return {
                "success": True,
                "result": result_text,
                "user_id": user_context.user_id,
                "stores": store_ids
            }
        
        except Exception as e:
            logger.error(f"Query failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "user_id": user_context.user_id
            }
    
    def _enhance_query(self, query: str, context: UserContext) -> str:
        """Enhance query with user context"""
        
        # Language-specific instructions
        if context.language == "vi":
            instructions = f"""Ngữ cảnh: Tháng {context.active_month}. Tiền tệ: {context.currency}.

Câu hỏi: {query}

Yêu cầu trả lời:
- Trả lời NGẮN GỌN, TÓM TẮT (2-4 câu hoặc dạng bullet points)
- Chỉ đưa số liệu QUAN TRỌNG nhất
- Tập trung vào tháng {context.active_month}
- Trả lời bằng TIẾNG VIỆT
- Dùng bullet points (•) cho danh sách
- Không giải thích dài dòng
- Số tiền: {context.currency} (VD: $70.50)
"""
        else:
            instructions = f"""Context: Current month is {context.active_month}. User currency is {context.currency}.

User question: {query}

Instructions:
- Focus on data from {context.active_month} unless the user asks about a different period
- All amounts should be in {context.currency}
- Respond in ENGLISH
- Be specific with numbers and dates
- If data is unavailable, clearly state that
"""
        
        return instructions
    
    def get_user_store_id(self, user_id: str, store_mapping: Dict[str, Any]) -> Optional[str]:
        """Get store ID for a user from mapping"""
        user_stores = store_mapping.get('user_stores', {})
        user_data = user_stores.get(user_id)
        
        if user_data:
            return user_data.get('store_id')
        
        return None
