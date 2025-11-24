"""
Guard Agent - Content filtering for personal finance chatbot
Filters out non-finance related queries
"""

import os
import json
import logging
import re
from typing import Dict, Any
from dotenv import load_dotenv
from google import genai

load_dotenv()

logger = logging.getLogger(__name__)


class GuardAgent:
    """
    Guard Agent for filtering user queries.
    Only allows personal finance-related questions.
    """
    
    def __init__(self, model_name: str = "gemini-2.5-flash"):
        """
        Initialize GuardAgent with Gemini client
        
        Args:
            model_name: Gemini model for filtering
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
        
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name
        
        logger.info(f"Initialized GuardAgent with model {model_name}")
    
    def filter_message(self, user_input: str) -> Dict[str, Any]:
        """
        Filter user message to check if finance-related
        
        Args:
            user_input: User's query
        
        Returns:
            Dict with decision, reason, and message
        """
        # System prompt for filtering
        system_prompt = """
Bạn là một bộ lọc nội dung cho ứng dụng quản lý tài chính cá nhân tiếng Việt.
Nhiệm vụ: Xác định câu hỏi có LIÊN QUAN đến quản lý tài chính cá nhân hay không.

CHỦ ĐỀ ĐƯỢC PHÉP (allowed) - CHỈ về TÀI CHÍNH CÁ NHÂN:
1. Giao dịch tài chính (chi tiêu, thu nhập, xem/thêm/sửa giao dịch)
2. Ngân sách (ngân sách tháng, kiểm soát chi phí, còn lại bao nhiêu)
3. Mục tiêu tiết kiệm (quỹ dự phòng, kế hoạch tiết kiệm, tiến độ)
4. Phân tích chi tiêu (theo danh mục: ăn uống, đi lại, mua sắm, v.v.)
5. Quản lý thu nhập (lương, thu nhập phụ, freelance)
6. Báo cáo tài chính cá nhân (thống kê, biểu đồ, xu hướng)
7. Tư vấn tiết kiệm và quản lý tiền bạc cá nhân
8. Hỏi số liệu cụ thể (đã chi bao nhiêu, còn bao nhiêu, phần trăm ngân sách)

CHỦ ĐỀ KHÔNG ĐƯỢC PHÉP (not allowed) - TẤT CẢ chủ đề KHÔNG phải tài chính:
1. Thời tiết (ở bất kỳ đâu)
2. Tin tức, thể thao, giải trí
3. Hỗ trợ kỹ thuật (lập trình, máy tính, điện thoại, phần mềm)
4. Hoạt động bất hợp pháp
5. Thông tin cá nhân người khác
6. Phim, nhạc, game, sách, truyện
7. Du lịch, ẩm thực (TRỪ KHI hỏi về CHI PHÍ du lịch/ăn uống)
8. Sức khỏe, y tế (TRỪ KHI hỏi về CHI PHÍ y tế)
9. Giáo dục (TRỪ KHI hỏi về HỌC PHÍ, chi phí học tập)
10. Định nghĩa từ, dịch thuật, kiến thức chung
11. Chào hỏi đơn thuần (xin chào, hi, hello) → allowed
12. Bất kỳ chủ đề nào KHÔNG liên quan TRỰC TIẾP đến QUẢN LÝ TIỀN BẠC

LƯU Ý QUAN TRỌNG:
- "Tôi đã chi bao nhiêu cho ăn uống?" → ALLOWED (hỏi về CHI TIÊU)
- "Quán ăn ngon ở đâu?" → NOT ALLOWED (không hỏi về tiền)
- "Thời tiết hôm nay?" → NOT ALLOWED (hoàn toàn không liên quan)
- "Chuyến du lịch Nha Trang tốn bao nhiêu?" → ALLOWED (hỏi về CHI PHÍ)
- "xin chào", "hi", "hello" → ALLOWED (chào hỏi lịch sự)

Trả về JSON (KHÔNG thêm text nào khác):
{
  "decision": "allowed" hoặc "not allowed",
  "reason": "Lý do ngắn gọn (tiếng Việt)"
}
"""
        
        try:
            # Call Gemini API
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=f"{system_prompt}\n\nCâu hỏi người dùng: {user_input}",
                config={"temperature": 0}
            )
            
            response_text = response.text.strip()
            
            # Parse JSON response
            try:
                # Try direct parsing
                result = json.loads(response_text)
            except json.JSONDecodeError:
                # Extract JSON from markdown or mixed text
                json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
                if json_match:
                    try:
                        result = json.loads(json_match.group(0))
                    except json.JSONDecodeError:
                        # Fallback: reject if can't parse
                        logger.warning(f"JSON parse failed: {response_text[:100]}")
                        return {
                            "decision": "not allowed",
                            "reason": f"Parse error: {response_text[:50]}..."
                        }
                else:
                    # No JSON found
                    logger.warning(f"No JSON in response: {response_text[:100]}")
                    return {
                        "decision": "not allowed",
                        "reason": "No valid JSON response"
                    }
            
            # Validate result
            if "decision" not in result:
                logger.warning(f"No 'decision' field in: {result}")
                return {
                    "decision": "not allowed",
                    "reason": "Invalid response format"
                }
            
            logger.debug(f"Filter result: {result['decision']} - {result.get('reason', '')}")
            return result
        
        except Exception as e:
            # On error, reject to be safe
            logger.error(f"GuardAgent error: {e}")
            return {
                "decision": "not allowed",
                "reason": f"Error: {str(e)}"
            }
    
    def is_allowed(self, user_input: str) -> bool:
        """
        Quick check if query is allowed
        
        Args:
            user_input: User's query
        
        Returns:
            True if allowed, False otherwise
        """
        result = self.filter_message(user_input)
        return result.get("decision") == "allowed"
    
    def get_rejection_message(self, language: str = "vi") -> str:
        """
        Get rejection message in specified language
        
        Args:
            language: 'vi' for Vietnamese, 'en' for English
        
        Returns:
            Rejection message string
        """
        if language == "vi":
            return "Xin lỗi, câu hỏi này không nằm trong phạm vi tài chính cá nhân."
        else:
            return "I'm sorry, this question is not within the scope of personal finance."
