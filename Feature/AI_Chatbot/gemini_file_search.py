"""
Gemini File Search Manager for Personal Finance Chatbot
Manages FileSearchStores and uploads cleaned data to Gemini
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('gemini_file_search.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class GeminiFileSearchManager:
    """Manages Gemini File Search stores and operations"""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Gemini client"""
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        self.client = genai.Client(api_key=self.api_key)
        self.stores_map = {}  # store_name -> store_id mapping
        
        logger.info("Initialized GeminiFileSearchManager")
    
    def create_store(self, display_name: str) -> Dict[str, Any]:
        """Create a new FileSearchStore"""
        logger.info(f"Creating FileSearchStore: {display_name}")
        
        try:
            store = self.client.file_search_stores.create(
                config={'display_name': display_name}
            )
            
            result = {
                "success": True,
                "store_id": store.name,
                "display_name": store.display_name,
                "create_time": str(store.create_time),
                "update_time": str(store.update_time)
            }
            
            self.stores_map[display_name] = store.name
            logger.info(f"✓ Created store: {display_name} (ID: {store.name})")
            
            return result
        
        except Exception as e:
            logger.error(f"Failed to create store {display_name}: {e}")
            return {"success": False, "error": str(e)}
    
    def list_stores(self) -> List[Dict[str, Any]]:
        """List all FileSearchStores"""
        logger.info("Listing all FileSearchStores...")
        
        try:
            stores = self.client.file_search_stores.list()
            store_list = []
            
            for store in stores:
                store_info = {
                    "store_id": store.name,
                    "display_name": store.display_name,
                    "active_documents": int(store.active_documents_count),
                    "pending_documents": int(store.pending_documents_count),
                    "failed_documents": int(store.failed_documents_count),
                    "size_bytes": int(store.size_bytes),
                    "create_time": str(store.create_time),
                    "update_time": str(store.update_time)
                }
                store_list.append(store_info)
                self.stores_map[store.display_name] = store.name
            
            logger.info(f"Found {len(store_list)} stores")
            return store_list
        
        except Exception as e:
            logger.error(f"Failed to list stores: {e}")
            return []
    
    def get_store_by_name(self, display_name: str) -> Optional[str]:
        """Get store ID by display name"""
        if display_name in self.stores_map:
            return self.stores_map[display_name]
        
        # Refresh stores list
        stores = self.list_stores()
        for store in stores:
            if store['display_name'] == display_name:
                return store['store_id']
        
        return None
    
    def delete_store(self, store_id: str) -> bool:
        """Delete a FileSearchStore"""
        logger.info(f"Deleting store: {store_id}")
        
        try:
            self.client.file_search_stores.delete(name=store_id)
            logger.info(f"✓ Deleted store: {store_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete store {store_id}: {e}")
            return False
    
    def upload_file_to_store(self, file_path: str, store_id: str, display_name: Optional[str] = None) -> Dict[str, Any]:
        """Upload a file directly to a FileSearchStore"""
        if not display_name:
            display_name = Path(file_path).name
        
        logger.info(f"Uploading {file_path} to store {store_id}")
        
        try:
            # Check file exists
            if not Path(file_path).exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            # Get file size
            file_size = Path(file_path).stat().st_size
            logger.debug(f"File size: {file_size} bytes")
            
            # Upload and import to store
            operation = self.client.file_search_stores.upload_to_file_search_store(
                file=file_path,
                file_search_store_name=store_id,
                config={'display_name': display_name}
            )
            
            logger.info(f"✓ Uploaded: {display_name} ({file_size} bytes)")
            
            return {
                "success": True,
                "file_name": display_name,
                "store_id": store_id,
                "size_bytes": file_size
            }
        
        except Exception as e:
            logger.error(f"Failed to upload {file_path}: {e}")
            return {"success": False, "error": str(e), "file": file_path}
    
    def list_documents_in_store(self, store_id: str) -> List[Dict[str, Any]]:
        """List all documents in a FileSearchStore"""
        logger.info(f"Listing documents in store: {store_id}")
        
        try:
            documents = self.client.file_search_stores.documents.list(parent=store_id)
            doc_list = []
            
            for doc in documents:
                doc_info = {
                    "document_id": doc.name,
                    "display_name": doc.display_name,
                    "mime_type": doc.mime_type,
                    "size_bytes": doc.size_bytes,
                    "create_time": str(doc.create_time)
                }
                doc_list.append(doc_info)
            
            logger.info(f"Found {len(doc_list)} documents")
            return doc_list
        
        except Exception as e:
            logger.error(f"Failed to list documents: {e}")
            return []
    
    def search(self, query: str, store_ids: List[str], model: str = "gemini-2.5-flash") -> Dict[str, Any]:
        """
        Perform semantic search across FileSearchStores
        
        Args:
            query: Natural language query
            store_ids: List of store IDs to search
            model: Gemini model to use
        """
        logger.info(f"Searching query: '{query}' across {len(store_ids)} stores")
        
        try:
            response = self.client.models.generate_content(
                model=model,
                contents=query,
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
            
            logger.info(f"✓ Search completed: {len(result_text)} chars")
            
            return {
                "success": True,
                "query": query,
                "result": result_text,
                "stores_searched": store_ids,
                "model": model
            }
        
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "query": query
            }
    
    def upload_user_store(self, user_dir: Path, store_id: str) -> Dict[str, Any]:
        """Upload all files from a user directory to their store"""
        logger.info(f"Uploading user store from {user_dir}")
        
        results = {
            "store_id": store_id,
            "uploaded": [],
            "failed": []
        }
        
        # Upload all files
        for file_path in user_dir.iterdir():
            if file_path.is_file() and file_path.suffix in ['.json', '.csv', '.md']:
                result = self.upload_file_to_store(
                    str(file_path),
                    store_id,
                    file_path.name
                )
                
                if result['success']:
                    results['uploaded'].append(file_path.name)
                else:
                    results['failed'].append(file_path.name)
        
        logger.info(f"User store upload complete: {len(results['uploaded'])} files, {len(results['failed'])} failed")
        return results
    
    def setup_all_stores(self, cleaned_data_dir: str) -> Dict[str, Any]:
        """Set up all FileSearchStores from cleaned data directory"""
        logger.info("=" * 60)
        logger.info("Setting up all FileSearchStores")
        logger.info("=" * 60)
        
        cleaned_path = Path(cleaned_data_dir)
        if not cleaned_path.exists():
            raise FileNotFoundError(f"Cleaned data directory not found: {cleaned_data_dir}")
        
        setup_results = {
            "user_stores": {},
            "knowledge_store": None,
            "summary": {
                "total_stores": 0,
                "total_files": 0,
                "failed_files": 0
            }
        }
        
        # 1. Set up knowledge store
        logger.info("\n[1/2] Setting up knowledge store...")
        knowledge_dir = cleaned_path / 'store_knowledge'
        
        if knowledge_dir.exists():
            # Create or get knowledge store
            store_info = self.create_store("finance_knowledge")
            
            if store_info['success']:
                store_id = store_info['store_id']
                upload_result = self.upload_user_store(knowledge_dir, store_id)
                
                setup_results['knowledge_store'] = {
                    "store_id": store_id,
                    "files": upload_result['uploaded'],
                    "failed": upload_result['failed']
                }
                
                setup_results['summary']['total_stores'] += 1
                setup_results['summary']['total_files'] += len(upload_result['uploaded'])
                setup_results['summary']['failed_files'] += len(upload_result['failed'])
        
        # 2. Set up user stores
        logger.info("\n[2/2] Setting up user stores...")
        user_dirs = [d for d in cleaned_path.iterdir() if d.is_dir() and d.name.startswith('store_user_')]
        
        for user_dir in user_dirs:
            user_id = user_dir.name.replace('store_user_', '')
            
            # Load user profile to get name
            profile_path = user_dir / 'user_profile.json'
            if profile_path.exists():
                with open(profile_path, 'r') as f:
                    profile = json.load(f)
                    user_name = profile.get('name', user_id)
            else:
                user_name = user_id
            
            # Create store
            store_name = f"user_{user_name}_{user_id[:8]}"
            store_info = self.create_store(store_name)
            
            if store_info['success']:
                store_id = store_info['store_id']
                upload_result = self.upload_user_store(user_dir, store_id)
                
                setup_results['user_stores'][user_id] = {
                    "user_name": user_name,
                    "store_id": store_id,
                    "store_name": store_name,
                    "files": upload_result['uploaded'],
                    "failed": upload_result['failed']
                }
                
                setup_results['summary']['total_stores'] += 1
                setup_results['summary']['total_files'] += len(upload_result['uploaded'])
                setup_results['summary']['failed_files'] += len(upload_result['failed'])
        
        # Save mapping to file
        mapping_path = Path('store_mapping.json')
        with open(mapping_path, 'w') as f:
            json.dump(setup_results, f, indent=2)
        
        logger.info("=" * 60)
        logger.info("Setup complete!")
        logger.info("=" * 60)
        logger.info(f"Total stores: {setup_results['summary']['total_stores']}")
        logger.info(f"Total files uploaded: {setup_results['summary']['total_files']}")
        logger.info(f"Failed files: {setup_results['summary']['failed_files']}")
        logger.info(f"Mapping saved to: {mapping_path}")
        logger.info("=" * 60)
        
        return setup_results


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Gemini File Search Manager')
    parser.add_argument('command', choices=['setup', 'list', 'search', 'cleanup'],
                       help='Command to execute')
    parser.add_argument('--data-dir', default='cleaned_data',
                       help='Cleaned data directory (default: cleaned_data)')
    parser.add_argument('--query', help='Search query (for search command)')
    parser.add_argument('--user-id', help='User ID to search (for search command)')
    
    args = parser.parse_args()
    
    manager = GeminiFileSearchManager()
    
    if args.command == 'setup':
        # Set up all stores
        results = manager.setup_all_stores(args.data_dir)
        print(f"\n✓ Setup complete: {results['summary']['total_stores']} stores, {results['summary']['total_files']} files")
    
    elif args.command == 'list':
        # List all stores
        stores = manager.list_stores()
        print(f"\nFound {len(stores)} stores:")
        for store in stores:
            print(f"\n  {store['display_name']}")
            print(f"    ID: {store['store_id']}")
            print(f"    Documents: {store['active_documents']} active, {store['pending_documents']} pending")
            print(f"    Size: {store['size_bytes']} bytes")
    
    elif args.command == 'search':
        # Search across stores
        if not args.query:
            print("Error: --query required for search command")
            return
        
        # Load store mapping
        mapping_path = Path('store_mapping.json')
        if not mapping_path.exists():
            print("Error: store_mapping.json not found. Run 'setup' first.")
            return
        
        with open(mapping_path, 'r') as f:
            mapping = json.load(f)
        
        # Determine which stores to search
        store_ids = []
        
        if args.user_id:
            # Search specific user store + knowledge
            if args.user_id in mapping['user_stores']:
                store_ids.append(mapping['user_stores'][args.user_id]['store_id'])
            else:
                print(f"Error: User {args.user_id} not found")
                return
        else:
            # Search all user stores
            for user_data in mapping['user_stores'].values():
                store_ids.append(user_data['store_id'])
        
        # Add knowledge store
        if mapping['knowledge_store']:
            store_ids.append(mapping['knowledge_store']['store_id'])
        
        # Perform search
        result = manager.search(args.query, store_ids)
        
        if result['success']:
            print(f"\n{'='*60}")
            print(f"Query: {args.query}")
            print(f"{'='*60}")
            print(result['result'])
            print(f"{'='*60}")
        else:
            print(f"Search failed: {result['error']}")
    
    elif args.command == 'cleanup':
        # Delete all stores
        stores = manager.list_stores()
        print(f"Found {len(stores)} stores to delete")
        
        confirm = input("Are you sure you want to delete all stores? (yes/no): ")
        if confirm.lower() == 'yes':
            for store in stores:
                manager.delete_store(store['store_id'])
            print("✓ All stores deleted")
        else:
            print("Cancelled")


if __name__ == '__main__':
    main()
