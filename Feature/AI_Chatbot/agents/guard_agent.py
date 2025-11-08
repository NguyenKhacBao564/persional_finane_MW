import os
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from google import genai
from utils import get_chatbot_response_gemini

class GuardAgent:
    """
    Guard Agent for filtering user messages in personal finance AI chatbot.
    Uses Gemini to determine if user requests are relevant to personal finance tasks.
    """

    def __init__(self, model_name: str = "gemini-2.5-flash"):
        """
        Initialize the GuardAgent with Gemini client and system prompt.

        Args:
            model_name (str): Gemini model to use for filtering
        """
        # Load .env file
        load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

        # Initialize Gemini client
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")

        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name

        # System prompt for content filtering
        self.system_prompt = """
Bạn là một trợ lý AI hữu ích dành riêng cho ứng dụng quản lý tài chính cá nhân.

Nhiệm vụ của bạn là xác định xem yêu cầu hoặc câu hỏi của người dùng có liên quan đến chức năng của ứng dụng tài chính cá nhân hay không.

Người dùng ĐƯỢC PHÉP:
1. Hỏi về việc theo dõi chi tiêu, thu nhập hoặc ngân sách cá nhân.
2. Hỏi về các thống kê, biểu đồ, báo cáo chi tiêu hoặc xu hướng tài chính.
3. Hỏi về mục tiêu tiết kiệm, kế hoạch chi tiêu, hoặc cách phân bổ ngân sách.
4. Thêm, sửa, xóa hoặc xem các giao dịch, danh mục, tài khoản, ngân sách.
5. Hỏi về gợi ý tối ưu chi tiêu, phân tích thói quen chi tiêu, hoặc đề xuất tiết kiệm.

Người dùng KHÔNG ĐƯỢC PHÉP:
1. Hỏi về các chủ đề không liên quan đến tài chính cá nhân hoặc ứng dụng (ví dụ: thời tiết, tin tức, lập trình, đời sống, giải trí...).
2. Yêu cầu các thông tin nhạy cảm hoặc cá nhân của người khác.
3. Yêu cầu tư vấn tài chính phi pháp (trốn thuế, đầu tư lừa đảo, cờ bạc, v.v.).
4. Hỏi về việc lập trình, sửa mã nguồn, hoặc chi tiết kỹ thuật hệ thống.

Hãy đọc kỹ tin nhắn của người dùng và trả về phản hồi theo đúng cấu trúc JSON bên dưới (không thêm ký tự nào khác ngoài JSON):

{
  "chain_of_thought": "Giải thích ngắn gọn vì sao tin nhắn thuộc nhóm được phép hoặc không được phép, dựa theo các quy tắc trên.",
  "decision": "allowed" hoặc "not allowed",
  "message": "Để trống nếu allowed. Nếu not allowed, hãy ghi: 'Xin lỗi, tôi chỉ có thể hỗ trợ các tác vụ liên quan đến quản lý tài chính cá nhân như theo dõi chi tiêu, ngân sách, hoặc mục tiêu tiết kiệm.'"
}
"""

    def filter_message(self, user_input: str) -> Dict[str, Any]:
        """
        Filter user message to determine if it's allowed for personal finance chatbot.

        Args:
            user_input (str): User message to filter

        Returns:
            Dict[str, Any]: Filter result with chain_of_thought, decision, and message
        """
        try:
            # Prepare messages for Gemini
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": f"Người dùng: {user_input}"}
            ]

            # Get response from Gemini using utility function
            response_text = get_chatbot_response_gemini(
                client=self.client,
                model_name=self.model_name,
                messages=messages,
                temperature=0
            )

            # Try to parse JSON response
            try:
                # First try direct JSON parsing
                result = json.loads(response_text)
            except json.JSONDecodeError:
                # If that fails, try to extract JSON from the response
                import re
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    try:
                        result = json.loads(json_match.group(0))
                    except json.JSONDecodeError:
                        # If still fails, treat as not allowed
                        return {
                            "chain_of_thought": f"JSON parsing failed - response: {response_text[:100]}...",
                            "decision": "not allowed",
                            "message": "Xin lỗi, tôi chỉ có thể hỗ trợ các tác vụ liên quan đến quản lý tài chính cá nhân như theo dõi chi tiêu, ngân sách, hoặc mục tiêu tiết kiệm."
                        }
                else:
                    # No JSON found, treat as not allowed
                    return {
                        "chain_of_thought": f"No JSON found in response - response: {response_text[:100]}...",
                        "decision": "not allowed",
                        "message": "Xin lỗi, tôi chỉ có thể hỗ trợ các tác vụ liên quan đến quản lý tài chính cá nhân như theo dõi chi tiêu, ngân sách, hoặc mục tiêu tiết kiệm."
                    }

            # Validate required fields
            if not all(key in result for key in ["chain_of_thought", "decision", "message"]):
                # If required fields are missing, treat as not allowed
                return {
                    "chain_of_thought": "Response format validation failed - missing required fields",
                    "decision": "not allowed",
                    "message": "Xin lỗi, tôi chỉ có thể hỗ trợ các tác vụ liên quan đến quản lý tài chính cá nhân như theo dõi chi tiêu, ngân sách, hoặc mục tiêu tiết kiệm."
                }

            # Ensure decision is valid
            if result["decision"] not in ["allowed", "not allowed"]:
                result["decision"] = "not allowed"
                result["message"] = "Xin lỗi, tôi chỉ có thể hỗ trợ các tác vụ liên quan đến quản lý tài chính cá nhân như theo dõi chi tiêu, ngân sách, hoặc mục tiêu tiết kiệm."

            return result

        except Exception as e:
            # If API call fails, treat as not allowed
            return {
                "chain_of_thought": f"API call failed: {str(e)}",
                "decision": "not allowed",
                "message": "Xin lỗi, tôi chỉ có thể hỗ trợ các tác vụ liên quan đến quản lý tài chính cá nhân như theo dõi chi tiêu, ngân sách, hoặc mục tiêu tiết kiệm."
            }

    def is_allowed(self, user_input: str) -> bool:
        """
        Quick check if message is allowed (returns boolean).

        Args:
            user_input (str): User message to check

        Returns:
            bool: True if message is allowed, False otherwise
        """
        result = self.filter_message(user_input)
        return result.get("decision") == "allowed"

    def get_rejection_message(self, user_input: Optional[str] = None) -> str:
        """
        Get the standard rejection message for disallowed content.

        Args:
            user_input (str, optional): User input (not used but kept for consistency)

        Returns:
            str: Rejection message
        """
        return "Xin lỗi, tôi chỉ có thể hỗ trợ các tác vụ liên quan đến quản lý tài chính cá nhân như theo dõi chi tiêu, ngân sách, hoặc mục tiêu tiết kiệm."
