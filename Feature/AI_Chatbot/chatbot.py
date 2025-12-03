"""
Personal Finance AI Chatbot
Main chatbot interface using Gemini File Search and specialized agents
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

from agents.shared import UserContext, QueryOptions, FileSearchClient
from agents.router_agent import RouterAgent
from agents.guard_agent import GuardAgent

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PersonalFinanceChatbot:
    """
    AI Chatbot for personal finance queries
    """
    
    def __init__(self, store_mapping_path: str = 'store_mapping.json'):
        """
        Initialize chatbot with store mapping
        
        Args:
            store_mapping_path: Path to store mapping JSON file
        """
        logger.info("Initializing Personal Finance Chatbot")
        
        # Load store mapping
        self.store_mapping = self._load_store_mapping(store_mapping_path)
        
        # Get knowledge store ID
        knowledge_store_id = None
        if self.store_mapping.get('knowledge_store'):
            knowledge_store_id = self.store_mapping['knowledge_store']['store_id']
        
        # Initialize file search client
        self.file_search_client = FileSearchClient(
            knowledge_store_id=knowledge_store_id
        )
        
        # Initialize guard agent
        self.guard = GuardAgent()
        
        # Initialize router agent
        self.router = RouterAgent(self.file_search_client)
        
        logger.info("Chatbot initialized with GuardAgent and RouterAgent")
    
    def _load_store_mapping(self, path: str) -> Dict[str, Any]:
        """Load store mapping from JSON file"""
        mapping_path = Path(path)
        
        if not mapping_path.exists():
            raise FileNotFoundError(
                f"Store mapping not found: {path}. "
                "Please run 'python gemini_file_search.py setup' first."
            )
        
        with open(mapping_path, 'r') as f:
            mapping = json.load(f)
        
        summary = mapping.get('summary', {})
        logger.info(f"Loaded mapping: {summary.get('total_users', 0)} users, {summary.get('total_files', 0)} files")
        return mapping
    
    def get_user_context(self, user_id: str) -> Optional[UserContext]:
        """
        Get user context from store mapping
        
        Args:
            user_id: User ID
        
        Returns:
            UserContext or None if user not found
        """
        user_stores = self.store_mapping.get('user_stores', {})
        user_data = user_stores.get(user_id)
        
        if not user_data:
            logger.warning(f"User not found: {user_id}")
            return None
        
        # Get current month
        current_month = datetime.now().strftime('%Y-%m')
        
        # Collect file resources
        file_resources = []
        
        # Add user files
        if 'files' in user_data:
            # user_data['files'] is now a list of dicts {name, uri, mime_type}
            file_resources.extend(user_data['files'])
            
        # Add knowledge files
        if self.store_mapping.get('knowledge_store'):
            k_store = self.store_mapping['knowledge_store']
            if 'files' in k_store:
                file_resources.extend(k_store['files'])
        
        return UserContext(
            user_id=user_id,
            user_name=user_data['user_name'],
            store_id=user_data.get('store_id', ''),
            file_resources=file_resources,
            active_month=current_month,
            currency='USD',
            language='vi'  # Default to Vietnamese
        )
    
    def list_users(self) -> Dict[str, str]:
        """
        List all available users
        
        Returns:
            Dictionary of user_id -> user_name
        """
        user_stores = self.store_mapping.get('user_stores', {})
        return {
            user_id: data['user_name']
            for user_id, data in user_stores.items()
        }
    
    def chat(
        self,
        user_id: str,
        query: str,
        options: Optional[QueryOptions] = None
    ) -> Dict[str, Any]:
        """
        Process a user query
        
        Args:
            user_id: User ID
            query: User's natural language query
            options: Query options (optional)
        
        Returns:
            Dictionary with response and metadata
        """
        logger.info(f"Processing query for user {user_id}: {query}")
        
        # Get user context
        user_context = self.get_user_context(user_id)
        
        if not user_context:
            return {
                "success": False,
                "error": f"User not found: {user_id}",
                "available_users": self.list_users()
            }
        
        # Step 1: Check with GuardAgent first
        logger.info(f"[GuardAgent] Filtering query: {query}")
        
        if not self.guard.is_allowed(query):
            logger.warning(f"[GuardAgent] Query rejected: {query}")
            return {
                "success": False,
                "agent": "GuardAgent",
                "response": self.guard.get_rejection_message(user_context.language),
                "confidence": 1.0,
                "metadata": {"filtered": True, "reason": "non_finance_topic"},
                "user": user_context.user_name,
                "timestamp": datetime.now().isoformat(),
                "error": "Query not related to personal finance"
            }
        
        logger.info(f"[GuardAgent] Query allowed, routing to specialist agents")
        
        # Step 2: Route query through router agent
        response = self.router.route_query(user_context, query, options)
        
        # Convert to dict
        result = response.to_dict()
        result['user'] = user_context.user_name
        result['timestamp'] = datetime.now().isoformat()
        
        logger.info(f"Query processed: {response.success}")
        
        return result
    
    def interactive_session(self, user_id: str):
        """
        Start an interactive chat session
        
        Args:
            user_id: User ID
        """
        user_context = self.get_user_context(user_id)
        
        if not user_context:
            print(f"Error: User {user_id} not found")
            print(f"Available users: {self.list_users()}")
            return
        
        print("=" * 60)
        print(f"Personal Finance Chatbot - {user_context.user_name}")
        print("=" * 60)
        print(f"Current month: {user_context.active_month}")
        print(f"Type 'quit' or 'exit' to end session")
        print("=" * 60)
        print()
        
        while True:
            try:
                # Get user input
                query = input(f"{user_context.user_name}> ").strip()
                
                if not query:
                    continue
                
                if query.lower() in ['quit', 'exit', 'q']:
                    print("\nGoodbye!")
                    break
                
                # Process query
                result = self.chat(user_id, query)
                
                print()
                if result['success']:
                    print(f"[{result['agent']}]")
                    print(result['response'])
                else:
                    print(f"Error: {result.get('error', 'Unknown error')}")
                
                print()
            
            except KeyboardInterrupt:
                print("\n\nGoodbye!")
                break
            
            except Exception as e:
                print(f"\nError: {e}")
                logger.error(f"Session error: {e}")


def main():
    """Main entry point for CLI usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Personal Finance AI Chatbot')
    parser.add_argument('--user-id', help='User ID to chat with')
    parser.add_argument('--query', help='Single query (non-interactive mode)')
    parser.add_argument('--list-users', action='store_true', help='List available users')
    
    args = parser.parse_args()
    
    try:
        chatbot = PersonalFinanceChatbot()
        
        if args.list_users:
            users = chatbot.list_users()
            print("\nAvailable users:")
            for user_id, user_name in users.items():
                print(f"  {user_name}: {user_id}")
            return
        
        if not args.user_id:
            print("Error: --user-id required")
            print("\nAvailable users:")
            for user_id, user_name in chatbot.list_users().items():
                print(f"  {user_name}: {user_id}")
            return
        
        if args.query:
            # Single query mode
            result = chatbot.chat(args.user_id, args.query)
            
            if result['success']:
                print(result['response'])
            else:
                print(f"Error: {result.get('error')}")
        else:
            # Interactive mode
            chatbot.interactive_session(args.user_id)
    
    except Exception as e:
        logger.error(f"Error: {e}")
        print(f"Error: {e}")


if __name__ == '__main__':
    main()
