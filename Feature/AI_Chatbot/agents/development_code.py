#!/usr/bin/env python3
"""
Development test file for AI Chatbot agents.
Use this file to test and debug the GuardAgent and other agents.
"""

import os
import sys
from typing import List, Dict, Any
from dotenv import load_dotenv

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from guard_agent import GuardAgent
from utils import get_chatbot_response_gemini
from google import genai

class AgentTester:
    """
    Development tester for AI Chatbot agents.
    """

    def __init__(self):
        """Initialize the tester with agents."""
        print("🚀 Initializing AI Chatbot Agents Tester...")

        try:
            self.guard_agent = GuardAgent()
            print("✅ GuardAgent initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize GuardAgent: {e}")
            self.guard_agent = None

        # Initialize Gemini client for direct testing
        try:
            load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                self.gemini_client = genai.Client(api_key=api_key)
                print("✅ Gemini client initialized successfully")
            else:
                print("❌ GEMINI_API_KEY not found")
                self.gemini_client = None
        except Exception as e:
            print(f"❌ Failed to initialize Gemini client: {e}")
            self.gemini_client = None

    def test_guard_agent(self):
        """Test the GuardAgent with various inputs."""
        print("\n" + "="*60)
        print("🛡️  TESTING GUARD AGENT")
        print("="*60)

        if not self.guard_agent:
            print("❌ GuardAgent not available for testing")
            return

        # Test cases: (input, expected_result)
        test_cases = [
            # Allowed cases
            ("Làm thế nào để theo dõi chi tiêu hàng tháng?", "allowed"),
            ("Tôi muốn thêm giao dịch mua sắm 500.000 VNĐ", "allowed"),
            ("Cho xem báo cáo thu nhập năm nay", "allowed"),
            ("Làm sao để tiết kiệm được 10 triệu trong 6 tháng?", "allowed"),
            ("Tạo mục tiêu tiết kiệm mua xe mới", "allowed"),
            ("Thống kê chi tiêu theo danh mục", "allowed"),

            # Not allowed cases
            ("Hôm nay thời tiết ở Hà Nội như thế nào?", "not allowed"),
            ("Viết cho tôi một đoạn code Python", "not allowed"),
            ("Tin tức về thể thao hôm nay", "not allowed"),
            ("Cách nấu phở bò Hà Nội", "not allowed"),
            ("Xem phim gì hay cuối tuần này?", "not allowed"),

            # Edge cases
            ("", "not allowed"),  # Empty input
            ("123", "not allowed"),  # Just numbers
            ("Chi tiêu cho lập trình viên", "allowed"),  # Mixed - programming context but finance topic
            ("Cách trốn thuế hợp pháp", "not allowed"),  # Illegal advice
        ]

        for i, (input_text, expected) in enumerate(test_cases, 1):
            print(f"\n📝 Test {i}: \"{input_text}\"")
            print(f"Expected: {expected}")

            try:
                result = self.guard_agent.filter_message(input_text)
                actual = result.get("decision", "unknown")

                # Print results
                print(f"Actual: {actual}")
                print(f"Chain of thought: {result.get('chain_of_thought', 'N/A')}")

                if result.get("message"):
                    print(f"Message: {result.get('message')}")

                # Check if test passed
                if actual == expected:
                    print("✅ PASS")
                else:
                    print("❌ FAIL")

            except Exception as e:
                print(f"❌ ERROR: {e}")

    def test_direct_gemini(self):
        """Test direct Gemini API calls using utils function."""
        print("\n" + "="*60)
        print("🔮 TESTING DIRECT GEMINI API")
        print("="*60)

        if not self.gemini_client:
            print("❌ Gemini client not available for testing")
            return

        test_messages = [
            [{"role": "user", "content": "Hello, can you help me with personal finance?"}],
            [{"role": "system", "content": "You are a helpful assistant."},
             {"role": "user", "content": "What is 2+2?"}],
            [{"role": "user", "content": "Explain budgeting in simple terms"}],
        ]

        for i, messages in enumerate(test_messages, 1):
            print(f"\n📝 Test {i}: {messages}")

            try:
                response = get_chatbot_response_gemini(
                    client=self.gemini_client,
                    model_name="gemini-2.5-flash",
                    messages=messages,
                    temperature=0.7
                )

                print(f"Response: {response}")
                print("✅ SUCCESS")

            except Exception as e:
                print(f"❌ ERROR: {e}")

    def test_guard_agent_quick_methods(self):
        """Test GuardAgent convenience methods."""
        print("\n" + "="*60)
        print("⚡ TESTING GUARD AGENT QUICK METHODS")
        print("="*60)

        if not self.guard_agent:
            print("❌ GuardAgent not available for testing")
            return

        test_inputs = [
            "How to create a budget?",
            "What's the weather today?",
            "Add expense: groceries $50",
            "Write a Python script",
        ]

        for input_text in test_inputs:
            print(f"\n📝 Input: \"{input_text}\"")

            # Test is_allowed method
            try:
                allowed = self.guard_agent.is_allowed(input_text)
                print(f"is_allowed(): {allowed}")
            except Exception as e:
                print(f"is_allowed() ERROR: {e}")

            # Test get_rejection_message method
            try:
                rejection_msg = self.guard_agent.get_rejection_message(input_text)
                print(f"get_rejection_message(): \"{rejection_msg}\"")
            except Exception as e:
                print(f"get_rejection_message() ERROR: {e}")

    def interactive_test(self):
        """Interactive testing mode."""
        print("\n" + "="*60)
        print("🎮 INTERACTIVE TESTING MODE")
        print("="*60)
        print("Type 'quit' or 'exit' to stop interactive testing")
        print("-" * 60)

        if not self.guard_agent:
            print("❌ GuardAgent not available for testing")
            return

        while True:
            try:
                user_input = input("\n💬 Enter message to test: ").strip()

                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("👋 Exiting interactive mode...")
                    break

                if not user_input:
                    print("⚠️  Please enter some text")
                    continue

                print(f"\n🔍 Testing: \"{user_input}\"")
                print("-" * 40)

                # Test with GuardAgent
                result = self.guard_agent.filter_message(user_input)

                print(f"Decision: {result.get('decision')}")
                print(f"Chain of thought: {result.get('chain_of_thought')}")

                if result.get('message'):
                    print(f"Message: {result.get('message')}")

                print("-" * 40)

            except KeyboardInterrupt:
                print("\n\n👋 Interrupted. Exiting...")
                break
            except Exception as e:
                print(f"❌ Error: {e}")

    def run_all_tests(self):
        """Run all test suites."""
        print("🧪 Running all agent tests...")

        self.test_guard_agent()
        self.test_direct_gemini()
        self.test_guard_agent_quick_methods()

        print("\n" + "="*60)
        print("✅ All tests completed!")
        print("="*60)

def main():
    """Main function to run the tester."""
    print("🤖 AI Chatbot Agents Development Tester")
    print("=" * 60)

    tester = AgentTester()

    if len(sys.argv) > 1:
        mode = sys.argv[1].lower()

        if mode == "interactive":
            tester.interactive_test()
        elif mode == "guard":
            tester.test_guard_agent()
        elif mode == "gemini":
            tester.test_direct_gemini()
        elif mode == "quick":
            tester.test_guard_agent_quick_methods()
        else:
            print(f"Unknown mode: {mode}")
            print("Available modes: interactive, guard, gemini, quick, all")
    else:
        # Interactive menu
        print("\nSelect test mode:")
        print("1. Run all tests")
        print("2. Test GuardAgent only")
        print("3. Test direct Gemini API")
        print("4. Test GuardAgent quick methods")
        print("5. Interactive testing")

        try:
            choice = input("\nEnter choice (1-5): ").strip()

            if choice == "1":
                tester.run_all_tests()
            elif choice == "2":
                tester.test_guard_agent()
            elif choice == "3":
                tester.test_direct_gemini()
            elif choice == "4":
                tester.test_guard_agent_quick_methods()
            elif choice == "5":
                tester.interactive_test()
            else:
                print("Invalid choice. Running all tests...")
                tester.run_all_tests()

        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
