"""
Test Concise Responses - Kiểm tra độ dài câu trả lời
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from chatbot import PersonalFinanceChatbot


def test_response_length():
    """Test that responses are concise"""
    
    print("=" * 70)
    print("  TEST CONCISE RESPONSES")
    print("=" * 70)
    
    chatbot = PersonalFinanceChatbot()
    user_id = "44dfe804-3a46-4206-91a9-2685f7d5e003"
    
    test_queries = [
        ("Tôi đã chi bao nhiêu cho Ăn uống?", "TransactionAnalyst", 300),
        ("Ngân sách tháng này?", "BudgetAdvisor", 250),
        ("Tiến độ quỹ dự phòng?", "GoalTracker", 300),
        ("Phân tích chi tiêu", "SpendingInsights", 350),
    ]
    
    results = []
    
    for query, expected_agent, max_chars in test_queries:
        print(f"\n{'='*70}")
        print(f"Query: {query}")
        print(f"Expected Agent: {expected_agent}")
        print(f"Max Length: {max_chars} chars")
        print(f"{'='*70}")
        
        result = chatbot.chat(user_id, query)
        
        if result['success']:
            response = result['response']
            length = len(response)
            agent = result['agent']
            
            print(f"\nAgent: {agent}")
            print(f"Length: {length} chars")
            print(f"\nResponse Preview:")
            print("-" * 70)
            print(response)
            print("-" * 70)
            
            # Check length
            if length <= max_chars:
                print(f"✅ PASS - Concise ({length}/{max_chars} chars)")
                status = "PASS"
            else:
                print(f"⚠️  WARNING - A bit long ({length}/{max_chars} chars)")
                status = "WARNING"
            
            results.append({
                "query": query,
                "agent": agent,
                "length": length,
                "max": max_chars,
                "status": status
            })
        else:
            print(f"❌ FAILED - {result.get('error')}")
            results.append({
                "query": query,
                "status": "FAILED",
                "error": result.get('error')
            })
    
    # Summary
    print("\n" + "=" * 70)
    print("  SUMMARY")
    print("=" * 70)
    
    for r in results:
        if r['status'] in ['PASS', 'WARNING']:
            status_icon = '✅' if r['status'] == 'PASS' else '⚠️'
            print(f"{status_icon} {r['agent']}: {r['length']}/{r['max']} chars")
    
    print("\n✅ Response conciseness test complete!")
    print("=" * 70)


if __name__ == '__main__':
    test_response_length()
