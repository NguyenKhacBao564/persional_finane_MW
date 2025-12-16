"""
Vietnamese Chatbot Demo - Test tiếng Việt
"""

import sys
import os
import logging
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from chatbot import PersonalFinanceChatbot

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def print_section(title: str):
    """Print formatted section header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def print_conversation(user_name: str, query: str, response: str, agent: str):
    """Print formatted conversation"""
    print(f"\n👤 {user_name}: {query}")
    print(f"\n🤖 [{agent}]: {response}")
    print("-" * 70)


def demo_vietnamese_queries(chatbot: PersonalFinanceChatbot, user_id: str, user_name: str):
    """Demo với các câu hỏi tiếng Việt"""
    print_section(f"Demo Tiếng Việt - {user_name}")
    
    vietnamese_queries = [
        # Transaction queries
        "Tôi đã chi bao nhiêu tiền cho Ăn uống tháng này?",
        "Cho tôi xem các giao dịch gần đây",
        
        # Budget queries  
        "Tôi đã dùng bao nhiêu phần trăm ngân sách Ăn uống?",
        "Còn bao nhiêu trong ngân sách của tôi?",
        
        # Goal queries
        "Tiến độ quỹ dự phòng khẩn cấp của tôi như thế nào?",
        "Tôi cần tiết kiệm bao nhiêu mỗi tháng để đạt mục tiêu?",
        
        # Insights queries
        "Phân tích chi tiêu của tôi tháng này",
        "Thu nhập và chi tiêu của tôi là bao nhiêu?",
    ]
    
    for i, query in enumerate(vietnamese_queries, 1):
        print(f"\n[Câu hỏi {i}/{len(vietnamese_queries)}]")
        
        result = chatbot.chat(user_id, query)
        
        if result['success']:
            print_conversation(user_name, query, result['response'], result['agent'])
        else:
            print(f"Lỗi: {result.get('error')}")


def demo_mixed_language(chatbot: PersonalFinanceChatbot, user_id: str, user_name: str):
    """Demo với câu hỏi lẫn tiếng Việt và tiếng Anh"""
    print_section(f"Demo Hỗn Hợp - {user_name}")
    
    mixed_queries = [
        # Vietnamese
        ("Tôi chi bao nhiêu cho Food & Dining?", "vi"),
        # English
        ("What's my Emergency Fund goal?", "en"),
        # Vietnamese
        ("Tổng thu chi tháng này?", "vi"),
        # English
        ("Am I on budget?", "en"),
    ]
    
    for i, (query, lang) in enumerate(mixed_queries, 1):
        lang_name = "Tiếng Việt" if lang == "vi" else "English"
        print(f"\n[{lang_name} - {i}/{len(mixed_queries)}]")
        
        result = chatbot.chat(user_id, query)
        
        if result['success']:
            print_conversation(user_name, query, result['response'], result['agent'])
        else:
            print(f"Lỗi: {result.get('error')}")


def run_vietnamese_demo():
    """Chạy demo tiếng Việt đầy đủ"""
    print_section("Demo Chatbot Tài Chính - Tiếng Việt")
    
    try:
        # Initialize chatbot
        print("\n🚀 Đang khởi tạo chatbot...")
        chatbot = PersonalFinanceChatbot()
        
        # List available users
        users = chatbot.list_users()
        print(f"\n✓ Chatbot sẵn sàng! Tìm thấy {len(users)} người dùng:")
        for user_id, user_name in users.items():
            print(f"  • {user_name} ({user_id[:8]}...)")
        
        # Demo with Demo User
        demo_user_id = "44dfe804-3a46-4206-91a9-2685f7d5e003"
        demo_user_name = "Demo User"
        
        if demo_user_id in users:
            # Run Vietnamese demo
            demo_vietnamese_queries(chatbot, demo_user_id, demo_user_name)
            
            # Optionally run mixed language demo
            # demo_mixed_language(chatbot, demo_user_id, demo_user_name)
        else:
            print(f"\n⚠️  Không tìm thấy demo user: {demo_user_id}")
        
        # Summary
        print_section("Demo Hoàn Thành")
        print("\n✅ Tất cả câu hỏi tiếng Việt đã được xử lý!")
        print("\nĐể chạy phiên tương tác, sử dụng:")
        print(f"  python chatbot.py --user-id {demo_user_id}")
        print("\nVí dụ câu hỏi tiếng Việt:")
        print("  • Tôi đã chi bao nhiêu cho Ăn uống?")
        print("  • Ngân sách của tôi còn lại bao nhiêu?")
        print("  • Tiến độ mục tiêu tiết kiệm như thế nào?")
        print("  • Phân tích chi tiêu tháng này cho tôi")
        print()
    
    except FileNotFoundError as e:
        print(f"\n❌ Lỗi: {e}")
        print("\nVui lòng chạy setup trước:")
        print("  python gemini_file_search.py setup")
    
    except Exception as e:
        logger.error(f"Demo error: {e}")
        print(f"\n❌ Demo thất bại: {e}")


def run_quick_vietnamese_test():
    """Test nhanh với 3 câu hỏi tiếng Việt"""
    print_section("Test Nhanh Tiếng Việt")
    
    try:
        chatbot = PersonalFinanceChatbot()
        demo_user_id = "44dfe804-3a46-4206-91a9-2685f7d5e003"
        
        quick_queries = [
            "Tôi đã chi bao nhiêu cho Ăn uống tháng này?",
            "Tôi cần tiết kiệm bao nhiêu mỗi tháng cho quỹ dự phòng?",
            "Tổng thu nhập và chi tiêu của tôi?",
        ]
        
        print("\n🚀 Đang chạy test nhanh...\n")
        
        for i, query in enumerate(quick_queries, 1):
            print(f"[Câu hỏi {i}/{len(quick_queries)}]")
            result = chatbot.chat(demo_user_id, query)
            
            if result['success']:
                print_conversation("Demo User", query, result['response'], result['agent'])
            else:
                print(f"Lỗi: {result.get('error')}")
        
        print_section("Test Hoàn Thành")
        print()
    
    except Exception as e:
        logger.error(f"Test error: {e}")
        print(f"\n❌ Lỗi: {e}")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Demo Chatbot Tiếng Việt')
    parser.add_argument('--quick', action='store_true', help='Test nhanh (3 câu hỏi)')
    parser.add_argument('--mixed', action='store_true', help='Demo hỗn hợp Việt-Anh')
    
    args = parser.parse_args()
    
    if args.quick:
        run_quick_vietnamese_test()
    elif args.mixed:
        chatbot = PersonalFinanceChatbot()
        demo_user_id = "44dfe804-3a46-4206-91a9-2685f7d5e003"
        demo_user_name = "Demo User"
        demo_mixed_language(chatbot, demo_user_id, demo_user_name)
    else:
        run_vietnamese_demo()
