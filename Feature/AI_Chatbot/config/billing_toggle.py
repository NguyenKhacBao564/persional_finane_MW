#!/usr/bin/env python3
"""
SageMaker Endpoint Billing Toggle Script
Controls endpoint status to manage AWS costs
---------------------------------------------
Interactive Mode:

python billing_toggle.py interactive

Quick Commands:

python billing_toggle.py status          # Show billing status
python billing_toggle.py stop --name xyz # Stop specific endpoint
python billing_toggle.py start --config xyz # Start from config
python billing_toggle.py test --name xyz # Test endpoint
python billing_toggle.py cleanup # cleanup failed endpoints
"""

import boto3
import time
import sys
import os
import argparse
from dotenv import load_dotenv

# Load .env from AI_Chatbot directory
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

class SageMakerBillingController:
    def __init__(self, region_name="us-east-1"):
        self.sagemaker = boto3.client('sagemaker', region_name=region_name)
        self.runtime = boto3.client('runtime.sagemaker', region_name=region_name)
        
    def list_endpoints(self):
        """List all SageMaker endpoints"""
        try:
            response = self.sagemaker.list_endpoints(MaxResults=50)
            return response.get('Endpoints', [])
        except Exception as e:
            print(f"Error listing endpoints: {e}")
            return []
    
    def get_endpoint_status(self, endpoint_name):
        """Get detailed status of an endpoint"""
        try:
            response = self.sagemaker.describe_endpoint(EndpointName=endpoint_name)
            return {
                'name': response['EndpointName'],
                'status': response['EndpointStatus'],
                'created': response.get('CreationTime'),
                'config': response.get('EndpointConfigName'),
                'instance_count': len(response.get('ProductionVariants', [])),
                'instance_type': response.get('ProductionVariants', [{}])[0].get('InstanceType', 'N/A')
            }
        except Exception as e:
            print(f"Error getting endpoint status: {e}")
            return None
    
    def stop_endpoint(self, endpoint_name):
        """Stop an endpoint to halt billing"""
        print(f"Stopping endpoint: {endpoint_name}")
        try:
            self.sagemaker.delete_endpoint(EndpointName=endpoint_name)
            print(f"✅ Stop command sent for {endpoint_name}")
            
            # Wait for deletion to complete
            print("Waiting for endpoint deletion to complete...")
            while True:
                try:
                    status = self.sagemaker.describe_endpoint(EndpointName=endpoint_name)
                    if status['EndpointStatus'] == 'Deleting':
                        print(f"⏳ Status: {status['EndpointStatus']}...")
                        time.sleep(10)
                    else:
                        break
                except self.sagemaker.exceptions.ResourceNotFound:
                    print("✅ Endpoint successfully deleted")
                    break
                except Exception as e:
                    if "Could not find endpoint" in str(e):
                        print("✅ Endpoint successfully deleted")
                        break
                    print(f"⚠️ Error checking status: {e}")
                    time.sleep(5)
                    
        except Exception as e:
            print(f"❌ Error stopping endpoint: {e}")
            return False
        return True
    
    def start_endpoint(self, endpoint_config_name, endpoint_name=None):
        """Start an endpoint from a configuration"""
        if not endpoint_name:
            endpoint_name = f"{endpoint_config_name}-restarted-{int(time.time())}"
            
        print(f"Starting endpoint: {endpoint_name} from config: {endpoint_config_name}")
        
        try:
            # Check if config exists
            config = self.sagemaker.describe_endpoint_config(EndpointConfigName=endpoint_config_name)
            print(f"📋 Found config with {len(config.get('ProductionVariants', []))} variants")
            
            # Create endpoint
            self.sagemaker.create_endpoint(
                EndpointName=endpoint_name,
                EndpointConfigName=endpoint_config_name
            )
            
            print(f"✅ Start command sent for {endpoint_name}")
            
            # Wait for endpoint to be ready
            print("Waiting for endpoint to become available...")
            while True:
                status = self.sagemaker.describe_endpoint(EndpointName=endpoint_name)
                endpoint_status = status['EndpointStatus']
                
                if endpoint_status == 'InService':
                    print(f"✅ Endpoint {endpoint_name} is now ready")
                    break
                elif endpoint_status == 'Failed':
                    failure_reason = status.get('FailureReason', 'Unknown')
                    print(f"❌ Endpoint creation failed: {failure_reason}")
                    return False
                else:
                    print(f"⏳ Status: {endpoint_status}...")
                    time.sleep(30)
                    
        except Exception as e:
            print(f"❌ Error starting endpoint: {e}")
            return False
        return True
    
    def test_endpoint(self, endpoint_name):
        """Test an endpoint with a simple request"""
        print(f"Testing endpoint: {endpoint_name}")
        try:
            import json
            response = self.runtime.invoke_endpoint(
                EndpointName=endpoint_name,
                ContentType='application/json',
                Body=json.dumps({
                    "inputs": "Hello, how are you today?"
                })
            )
            result = response['Body'].read().decode()
            print(f"✅ Endpoint test successful: {result[:100]}...")
            return True
        except Exception as e:
            print(f"❌ Endpoint test failed: {e}")
            return False
    
    def show_billing_info(self):
        """Show current billing status"""
        print("=== BILLING STATUS ===")
        endpoints = self.list_endpoints()
        
        if not endpoints:
            print("No endpoints found - No billing")
            return
            
        total_cost = 0
        for endpoint in endpoints:
            status = endpoint['EndpointStatus']
            name = endpoint['EndpointName']
            
            if status == 'InService':
                # Get detailed info for billing endpoints
                info = self.get_endpoint_status(name)
                if info:
                    print(f"💰 ACTIVE: {name}")
                    print(f"   Instance Type: {info['instance_type']}")
                    print(f"   Instance Count: {info['instance_count']}")
                    print(f"   Status: {info['status']}")
                    print(f"   Created: {info.get('created', 'N/A')}")
                    print()
            else:
                print(f"⏸️  INACTIVE: {name} - Status: {status}")
    
    def cleanup_failed_endpoints(self):
        """Clean up all failed endpoints"""
        print("=== CLEANUP FAILED ENDPOINTS ===")
        endpoints = self.list_endpoints()
        failed_endpoints = [ep for ep in endpoints if ep['EndpointStatus'] == 'Failed']
        
        if not failed_endpoints:
            print("✅ No failed endpoints found")
            return True
        
        print(f"Found {len(failed_endpoints)} failed endpoints:")
        for i, ep in enumerate(failed_endpoints):
            status = self.get_endpoint_status(ep['EndpointName'])
            print(f"{i+1}. {ep['EndpointName']} - Created: {status.get('created', 'N/A')}")
            
            # Get failure reason
            try:
                details = self.sagemaker.describe_endpoint(EndpointName=ep['EndpointName'])
                if 'FailureReason' in details:
                    print(f"   ❌ Reason: {details['FailureReason']}")
            except:
                pass
        
        confirm = input(f"\nDelete all {len(failed_endpoints)} failed endpoints? (y/N): ").strip().lower()
        if confirm != 'y':
            print("Cleanup cancelled")
            return True
        
        success_count = 0
        for ep in failed_endpoints:
            try:
                self.sagemaker.delete_endpoint(EndpointName=ep['EndpointName'])
                print(f"✅ Deleted {ep['EndpointName']}")
                success_count += 1
                
                # Wait a moment between deletions to avoid AWS rate limits
                time.sleep(1)
                
            except Exception as e:
                print(f"❌ Failed to delete {ep['EndpointName']}: {e}")
        
        print(f"\nCleanup complete: {success_count}/{len(failed_endpoints)} endpoints deleted")
        return success_count == len(failed_endpoints)
    
    def interactive_toggle(self):
        """Interactive mode for toggling endpoints"""
        self.show_billing_info()
        
        endpoints = self.list_endpoints()
        active_endpoints = [ep for ep in endpoints if ep['EndpointStatus'] == 'InService']
        inactive_configs = set()
        
        # Get all endpoint configs
        try:
            configs = self.sagemaker.list_endpoint_configs(MaxResults=50)
            for config in configs.get('EndpointConfigs', []):
                config_name = config['EndpointConfigName']
                inactive_configs.add(config_name)
        except:
            pass
        
        print("\n=== ACTIONS ===")
        if active_endpoints:
            print("1. Stop active endpoint(s)")
        if inactive_configs:
            print("2. Start endpoint from configuration")
        print("3. Test endpoint")
        print("4. Refresh status")
        print("5. Cleanup failed endpoints")
        print("6. Exit")
        
        choice = input("\nSelect action (1-6): ").strip()
        
        if choice == '1' and active_endpoints:
            for i, ep in enumerate(active_endpoints):
                print(f"{i+1}. {ep['EndpointName']}")
            
            idx = int(input(f"Select endpoint to stop (1-{len(active_endpoints)}): ")) - 1
            if 0 <= idx < len(active_endpoints):
                self.stop_endpoint(active_endpoints[idx]['EndpointName'])
                
        elif choice == '2' and inactive_configs:
            config_list = list(inactive_configs)
            for i, config in enumerate(config_list):
                print(f"{i+1}. {config}")
            
            idx = int(input(f"Select config to start (1-{len(config_list)}): ")) - 1
            if 0 <= idx < len(config_list):
                endpoint_name = input("Enter endpoint name (leave empty for auto): ").strip()
                self.start_endpoint(config_list[idx], endpoint_name if endpoint_name else None)
                
        elif choice == '3':
            name = input("Enter endpoint name to test: ").strip()
            self.test_endpoint(name)
            
        elif choice == '4':
            self.interactive_toggle()
            return
            
        elif choice == '5':
            self.cleanup_failed_endpoints()
            input("\nPress Enter to continue...")
            self.interactive_toggle()
            return
            
        elif choice == '6':
            print("Goodbye!")
            return
        else:
            print("Invalid choice")

def main():
    parser = argparse.ArgumentParser(description='SageMaker Endpoint Billing Controller')
    parser.add_argument('action', choices=['status', 'stop', 'start', 'test', 'interactive', 'cleanup'],
                       help='Action to perform')
    parser.add_argument('--name', help='Endpoint name')
    parser.add_argument('--config', help='Endpoint config name (for start action)')
    
    args = parser.parse_args()
    
    controller = SageMakerBillingController()
    
    if args.action == 'status':
        controller.show_billing_info()
    elif args.action == 'stop':
        if not args.name:
            # List endpoints and let user choose
            endpoints = controller.list_endpoints()
            active = [ep for ep in endpoints if ep['EndpointStatus'] == 'InService']
            if not active:
                print("No active endpoints to stop")
                return
            for i, ep in enumerate(active):
                print(f"{i+1}. {ep['EndpointName']}")
            idx = int(input(f"Select endpoint to stop (1-{len(active)}): ")) - 1
            args.name = active[idx]['EndpointName']
        
        controller.stop_endpoint(args.name)
    elif args.action == 'start':
        if not args.config:
            configs = controller.sagemaker.list_endpoint_configs(MaxResults=50)
            config_list = [c['EndpointConfigName'] for c in configs.get('EndpointConfigs', [])]
            if not config_list:
                print("No endpoint configs found")
                return
            for i, config in enumerate(config_list):
                print(f"{i+1}. {config}")
            idx = int(input(f"Select config to start (1-{len(config_list)}): ")) - 1
            args.config = config_list[idx]
        
        controller.start_endpoint(args.config, args.name)
    elif args.action == 'test':
        if not args.name:
            args.name = input("Enter endpoint name: ").strip()
        controller.test_endpoint(args.name)
    elif args.action == 'cleanup':
        controller.cleanup_failed_endpoints()
    elif args.action == 'interactive':
        controller.interactive_toggle()

if __name__ == "__main__":
    main()
