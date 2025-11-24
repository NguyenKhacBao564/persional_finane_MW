"""
Chatbot Demo - Simulates conversations with the Personal Finance AI Chatbot
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


def demo_scenario_1(chatbot: PersonalFinanceChatbot, user_id: str, user_name: str):
    """Demo: Budget tracking and spending analysis"""
    print_section(f"Scenario 1: Budget Tracking - {user_name}")
    
    queries = [
        "How much have I spent on Food & Dining this month?",
        "What percentage of my Food budget have I used?",
        "Am I on track with my budget?",
    ]
    
    for query in queries:
        result = chatbot.chat(user_id, query)
        
        if result['success']:
            print_conversation(user_name, query, result['response'], result['agent'])
        else:
            print(f"Error: {result.get('error')}")


def demo_scenario_2(chatbot: PersonalFinanceChatbot, user_id: str, user_name: str):
    """Demo: Goal tracking"""
    print_section(f"Scenario 2: Goal Tracking - {user_name}")
    
    queries = [
        "What is my Emergency Fund goal?",
        "How much do I need to save monthly to reach my goal?",
        "Am I on track to meet my savings goal?",
    ]
    
    for query in queries:
        result = chatbot.chat(user_id, query)
        
        if result['success']:
            print_conversation(user_name, query, result['response'], result['agent'])
        else:
            print(f"Error: {result.get('error')}")


def demo_scenario_3(chatbot: PersonalFinanceChatbot, user_id: str, user_name: str):
    """Demo: Transaction analysis"""
    print_section(f"Scenario 3: Transaction Analysis - {user_name}")
    
    queries = [
        "Show me my recent spending",
        "What are my total expenses this month?",
        "What is my income vs expenses?",
    ]
    
    for query in queries:
        result = chatbot.chat(user_id, query)
        
        if result['success']:
            print_conversation(user_name, query, result['response'], result['agent'])
        else:
            print(f"Error: {result.get('error')}")


def demo_scenario_4(chatbot: PersonalFinanceChatbot, user_id: str, user_name: str):
    """Demo: Spending insights"""
    print_section(f"Scenario 4: Spending Insights - {user_name}")
    
    queries = [
        "What are my top spending categories?",
        "How is my spending this month?",
        "Any unusual spending patterns?",
    ]
    
    for query in queries:
        result = chatbot.chat(user_id, query)
        
        if result['success']:
            print_conversation(user_name, query, result['response'], result['agent'])
        else:
            print(f"Error: {result.get('error')}")


def run_full_demo():
    """Run full chatbot demo"""
    print_section("Personal Finance AI Chatbot - Demo")
    
    try:
        # Initialize chatbot
        print("\n🚀 Initializing chatbot...")
        chatbot = PersonalFinanceChatbot()
        
        # List available users
        users = chatbot.list_users()
        print(f"\n✓ Chatbot ready! Found {len(users)} users:")
        for user_id, user_name in users.items():
            print(f"  • {user_name} ({user_id[:8]}...)")
        
        # Demo with Demo User (has full data)
        demo_user_id = "44dfe804-3a46-4206-91a9-2685f7d5e003"
        demo_user_name = "Demo User"
        
        if demo_user_id in users:
            # Run all scenarios
            demo_scenario_1(chatbot, demo_user_id, demo_user_name)
            demo_scenario_2(chatbot, demo_user_id, demo_user_name)
            demo_scenario_3(chatbot, demo_user_id, demo_user_name)
            demo_scenario_4(chatbot, demo_user_id, demo_user_name)
        else:
            print(f"\n⚠️  Demo user not found: {demo_user_id}")
        
        # Summary
        print_section("Demo Complete")
        print("\n✅ All scenarios executed successfully!")
        print("\nTo start an interactive session, run:")
        print(f"  python chatbot.py --user-id {demo_user_id}")
        print("\nOr for a single query:")
        print(f"  python chatbot.py --user-id {demo_user_id} --query 'How much did I spend?'")
        print()
    
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        print("\nPlease run setup first:")
        print("  python gemini_file_search.py setup")
    
    except Exception as e:
        logger.error(f"Demo error: {e}")
        print(f"\n❌ Demo failed: {e}")


def run_quick_demo():
    """Run a quick demo with just a few queries"""
    print_section("Quick Demo")
    
    try:
        chatbot = PersonalFinanceChatbot()
        demo_user_id = "44dfe804-3a46-4206-91a9-2685f7d5e003"
        
        quick_queries = [
            "What is my total spending on Food this month?",
            "How much do I need to save monthly for my Emergency Fund?",
            "What are my total income and expenses?",
        ]
        
        print("\n🚀 Running quick demo...\n")
        
        for i, query in enumerate(quick_queries, 1):
            print(f"[Query {i}/{len(quick_queries)}]")
            result = chatbot.chat(demo_user_id, query)
            
            if result['success']:
                print_conversation("Demo User", query, result['response'], result['agent'])
            else:
                print(f"Error: {result.get('error')}")
        
        print_section("Quick Demo Complete")
        print()
    
    except Exception as e:
        logger.error(f"Quick demo error: {e}")
        print(f"\n❌ Error: {e}")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Chatbot Demo')
    parser.add_argument('--quick', action='store_true', help='Run quick demo (3 queries)')
    parser.add_argument('--scenario', type=int, choices=[1, 2, 3, 4], 
                       help='Run specific scenario only')
    
    args = parser.parse_args()
    
    if args.quick:
        run_quick_demo()
    elif args.scenario:
        chatbot = PersonalFinanceChatbot()
        demo_user_id = "44dfe804-3a46-4206-91a9-2685f7d5e003"
        demo_user_name = "Demo User"
        
        scenarios = {
            1: demo_scenario_1,
            2: demo_scenario_2,
            3: demo_scenario_3,
            4: demo_scenario_4
        }
        
        scenarios[args.scenario](chatbot, demo_user_id, demo_user_name)
    else:
        run_full_demo()
