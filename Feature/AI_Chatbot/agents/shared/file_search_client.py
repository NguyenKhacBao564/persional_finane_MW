"""
FileSearch client wrapper for agents
(Modified for Long Context Window)
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
    """Wrapper for Gemini Long Context operations"""
    
    def __init__(self, api_key: Optional[str] = None, knowledge_store_id: Optional[str] = None):
        """
        Initialize client
        knowledge_store_id is kept for compatibility but not used as a store ID.
        We rely on UserContext to pass file URIs.
        """
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found")
        
        self.client = genai.Client(api_key=self.api_key)
        self.knowledge_store_id = knowledge_store_id
        
        logger.info("Initialized FileSearchClient (Long Context Mode)")
    
    def query(
        self,
        user_context: UserContext,
        query_text: str,
        options: Optional[QueryOptions] = None
    ) -> Dict[str, Any]:
        """
        Query user's files using long context
        """
        if options is None:
            options = QueryOptions()
        
        # Collect file resources
        file_resources = []
        
        # Add user files
        if user_context.file_resources:
            file_resources.extend(user_context.file_resources)
        
        # Enhance query
        enhanced_query = self._enhance_query(query_text, user_context)
        
        logger.info(f"Querying for user {user_context.user_name}: {query_text}")
        logger.debug(f"Files: {len(file_resources)}")
        
        try:
            # Construct parts list
            parts = []
            
            # Add text query part
            parts.append(types.Part(text=enhanced_query))
            
            # Add file parts
            for res in file_resources:
                uri = res.get('uri')
                name = res.get('name', '')
                stored_mime = res.get('mime_type')
                
                # Use stored mime type if available, otherwise guess
                if stored_mime:
                    mime_type = stored_mime
                else:
                    mime_type = "text/plain"
                    if name.lower().endswith(".json"): 
                        mime_type = "application/json"
                    elif name.lower().endswith(".csv"): 
                        mime_type = "text/csv"
                    elif name.lower().endswith(".pdf"):
                        mime_type = "application/pdf"
                
                # Override unsupported mime types
                if mime_type == "application/json":
                    mime_type = "text/plain"
                
                # Create file part
                parts.append(types.Part.from_uri(file_uri=uri, mime_type=mime_type))

            # Create content object
            content = types.Content(role="user", parts=parts)

            response = self.client.models.generate_content(
                model=options.model,
                contents=content  # Pass single Content object
            )
            
            result_text = response.text
            
            logger.info(f"Query successful: {len(result_text)} chars")
            
            return {
                "success": True,
                "result": result_text,
                "user_id": user_context.user_id,
                "files_used": len(file_resources)
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
        """Get store ID (kept for interface compatibility)"""
        user_stores = store_mapping.get('user_stores', {})
        user_data = user_stores.get(user_id)
        if user_data:
            return user_data.get('store_id')
        return None