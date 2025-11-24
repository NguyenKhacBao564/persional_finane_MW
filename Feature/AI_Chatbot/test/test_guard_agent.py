"""
Test GuardAgent - Content Filtering
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from chatbot import PersonalFinanceChatbot


def test_guard_agent():
    """Test GuardAgent with various queries"""
    
    print("=" * 70)
    print("  TEST GUARD AGENT - Content Filtering")
    print("=" * 70)
    
    chatbot = PersonalFinanceChatbot()
    user_id = "44dfe804-3a46-4206-91a9-2685f7d5e003"
    
    # Test cases: (query, should_allow, category)
    test_cases = [
        # SHOULD BE REJECTED
        ("Thời tiết Nha Trang hôm nay?", False, "Weather"),
        ("Quán ăn ngon ở đâu?", False, "Food recommendations"),
        ("Phim hay hôm nay?", False, "Entertainment"),
        ("Cách lập trình Python", False, "Programming"),
        ("Tin tức thể thao", False, "News"),
        
        # SHOULD BE ALLOWED
        ("Tôi đã chi bao nhiêu cho Ăn uống?", True, "Transaction query"),
        ("Ngân sách tháng này còn lại bao nhiêu?", True, "Budget query"),
        ("Tiến độ mục tiêu tiết kiệm", True, "Goal query"),
        ("Phân tích chi tiêu tháng này", True, "Spending analysis"),
        ("Chuyến du lịch Nha Trang tôi đã chi bao nhiêu?", True, "Travel expenses"),
        ("Chi phí ăn uống tháng trước", True, "Food expenses"),
        ("Xin chào", True, "Greeting"),
    ]
    
    results = {"passed": 0, "failed": 0, "details": []}
    
    for query, should_allow, category in test_cases:
        print(f"\n[{category}]")
        print(f"Query: \"{query}\"")
        print(f"Expected: {'ALLOW' if should_allow else 'REJECT'}")
        
        result = chatbot.chat(user_id, query)
        
        is_allowed = result['success']
        agent = result.get('agent', 'N/A')
        
        print(f"Actual: {'ALLOW' if is_allowed else 'REJECT'} (Agent: {agent})")
        
        # Check if result matches expectation
        if is_allowed == should_allow:
            print("✅ PASS")
            results["passed"] += 1
            results["details"].append({
                "query": query,
                "category": category,
                "status": "PASS",
                "expected": should_allow,
                "actual": is_allowed
            })
        else:
            print(f"❌ FAIL - Expected {'ALLOW' if should_allow else 'REJECT'}, got {'ALLOW' if is_allowed else 'REJECT'}")
            results["failed"] += 1
            results["details"].append({
                "query": query,
                "category": category,
                "status": "FAIL",
                "expected": should_allow,
                "actual": is_allowed,
                "response": result.get('response', '')[:100]
            })
        
        print("-" * 70)
    
    # Summary
    total = results["passed"] + results["failed"]
    print("\n" + "=" * 70)
    print("  TEST SUMMARY")
    print("=" * 70)
    print(f"Total tests: {total}")
    print(f"Passed: {results['passed']} ({results['passed']/total*100:.1f}%)")
    print(f"Failed: {results['failed']} ({results['failed']/total*100:.1f}%)")
    print("=" * 70)
    
    if results["failed"] > 0:
        print("\nFailed tests:")
        for detail in results["details"]:
            if detail["status"] == "FAIL":
                print(f"  • {detail['category']}: \"{detail['query']}\"")
                print(f"    Expected: {detail['expected']}, Got: {detail['actual']}")
    
    print()
    
    return results["failed"] == 0


if __name__ == '__main__':
    success = test_guard_agent()
    exit(0 if success else 1)
