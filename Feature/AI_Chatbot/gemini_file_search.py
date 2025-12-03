"""
Gemini File Search Manager for Personal Finance Chatbot
Manages File Uploads and "Virtual Stores" for Gemini
(Modified to use Long Context Window due to SDK limitations)
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
    """Manages Gemini File uploads and mapping"""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Gemini client"""
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        self.client = genai.Client(api_key=self.api_key)
        logger.info("Initialized GeminiFileSearchManager (Long Context Mode)")
    
    def upload_file(self, file_path: str, display_name: Optional[str] = None) -> Dict[str, Any]:
        """Upload a file to Gemini"""
        if not display_name:
            display_name = Path(file_path).name
        
        logger.info(f"Uploading {file_path}")
        
        try:
            # Check file exists
            if not Path(file_path).exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            # Get file size
            file_size = Path(file_path).stat().st_size
            
            # Determine mime_type override
            mime_type_override = None
            if file_path.lower().endswith('.json') or file_path.lower().endswith('.md'):
                mime_type_override = 'text/plain'
            
            # Upload file
            # Using client.files.upload(file=path)
            if mime_type_override:
                file_ref = self.client.files.upload(file=file_path, config={'mime_type': mime_type_override})
            else:
                file_ref = self.client.files.upload(file=file_path)
            
            logger.info(f"✓ Uploaded: {display_name} ({file_size} bytes) -> {file_ref.name} ({file_ref.mime_type})")
            
            return {
                "success": True,
                "name": display_name,
                "uri": file_ref.uri,
                "mime_type": file_ref.mime_type,
                "size_bytes": file_size
            }
        
        except Exception as e:
            logger.error(f"Failed to upload {file_path}: {e}")
            return {"success": False, "error": str(e), "file": file_path}
    
    def upload_user_files(self, user_dir: Path) -> Dict[str, Any]:
        """Upload all files from a user directory"""
        logger.info(f"Uploading user files from {user_dir}")
        
        results = {
            "uploaded": [], # List of dicts: {name, uri, mime_type}
            "failed": []
        }
        
        # Upload all files
        for file_path in user_dir.iterdir():
            if file_path.is_file() and file_path.suffix in ['.json', '.csv', '.md']:
                result = self.upload_file(
                    str(file_path),
                    file_path.name
                )
                
                if result['success']:
                    results['uploaded'].append({
                        'name': result['name'],
                        'uri': result['uri'],
                        'mime_type': result['mime_type']
                    })
                else:
                    results['failed'].append(file_path.name)
        
        logger.info(f"User upload complete: {len(results['uploaded'])} files")
        return results
    
    def setup_all_stores(self, cleaned_data_dir: str) -> Dict[str, Any]:
        """Set up all files (acting as stores) from cleaned data directory"""
        logger.info("=" * 60)
        logger.info("Setting up all File Search 'Stores' (Files)")
        logger.info("=" * 60)
        
        cleaned_path = Path(cleaned_data_dir)
        if not cleaned_path.exists():
            raise FileNotFoundError(f"Cleaned data directory not found: {cleaned_data_dir}")
        
        setup_results = {
            "user_stores": {},
            "knowledge_store": None,
            "summary": {
                "total_users": 0,
                "total_files": 0,
                "failed_files": 0
            }
        }
        
        # 1. Set up knowledge store (common files)
        logger.info("\n[1/2] Setting up knowledge files...")
        knowledge_dir = cleaned_path / 'store_knowledge'
        
        if knowledge_dir.exists():
            upload_result = self.upload_user_files(knowledge_dir)
            
            setup_results['knowledge_store'] = {
                "store_id": "knowledge", # Dummy ID
                "files": upload_result['uploaded'], # List of {name, uri, mime_type}
                "failed": upload_result['failed']
            }
            
            setup_results['summary']['total_files'] += len(upload_result['uploaded'])
            setup_results['summary']['failed_files'] += len(upload_result['failed'])
        
        # 2. Set up user stores
        logger.info("\n[2/2] Setting up user files...")
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
            
            upload_result = self.upload_user_files(user_dir)
            
            setup_results['user_stores'][user_id] = {
                "user_name": user_name,
                "store_id": f"user_{user_id[:8]}", # Dummy ID
                "files": upload_result['uploaded'],
                "failed": upload_result['failed']
            }
            
            setup_results['summary']['total_users'] += 1
            setup_results['summary']['total_files'] += len(upload_result['uploaded'])
            setup_results['summary']['failed_files'] += len(upload_result['failed'])
        
        # Save mapping to file
        mapping_path = Path('store_mapping.json')
        with open(mapping_path, 'w') as f:
            json.dump(setup_results, f, indent=2)
        
        logger.info("=" * 60)
        logger.info("Setup complete!")
        logger.info("=" * 60)
        logger.info(f"Total users: {setup_results['summary']['total_users']}")
        logger.info(f"Total files uploaded: {setup_results['summary']['total_files']}")
        logger.info(f"Mapping saved to: {mapping_path}")
        logger.info("=" * 60)
        
        return setup_results


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Gemini File Manager')
    parser.add_argument('command', choices=['setup'],
                       help='Command to execute')
    parser.add_argument('--data-dir', default='cleaned_data',
                       help='Cleaned data directory (default: cleaned_data)')
    
    args = parser.parse_args()
    
    manager = GeminiFileSearchManager()
    
    if args.command == 'setup':
        results = manager.setup_all_stores(args.data_dir)
        print(f"\n✓ Setup complete: {results['summary']['total_users']} users, {results['summary']['total_files']} files")

if __name__ == '__main__':
    main()
