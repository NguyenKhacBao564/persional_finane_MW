#!/usr/bin/env python3
"""
SageMaker Endpoint Monitor and Cleanup Utility
"""

import boto3
import time
import sys
import os
from dotenv import load_dotenv

# Load .env from AI_Chatbot directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'AI_Chatbot', '.env'))

def monitor_endpoints():
    """Monitor endpoint creation status"""
    sagemaker = boto3.client('sagemaker')
    
    print("=== SAGEMAKER ENDPOINT MONITOR ===")
    
    try:
        endpoints = sagemaker.list_endpoints(MaxResults=20)
        if not endpoints['Endpoints']:
            print("No endpoints found")
            return
            
        for endpoint in endpoints['Endpoints']:
            name = endpoint['EndpointName']
            status = endpoint['EndpointStatus']
            created = endpoint.get('CreationTime', 'N/A')
            
            print(f"\nEndpoint: {name}")
            print(f"Status: {status}")
            print(f"Created: {created}")
            
            if status == 'Creating':
                print("⏳ Still deploying...")
            elif status == 'InService':
                print("✅ Ready for use")
                # Test the endpoint if it's our model
                if 'huggingface' in name:
                    try:
                        runtime = boto3.client('runtime.sagemaker')
                        response = runtime.invoke_endpoint(
                            EndpointName=name,
                            ContentType='application/json',
                            Body='{"inputs": "Hello, how are you?"}'
                        )
                        result = response['Body'].read().decode()
                        print(f"📝 Test response: {result[:100]}...")
                    except Exception as e:
                        print(f"❌ Test failed: {e}")
            elif status == 'Failed':
                desc = sagemaker.describe_endpoint(EndpointName=name)
                if 'FailureReason' in desc:
                    print(f"❌ Failed: {desc['FailureReason']}")
                    
    except Exception as e:
        print(f"Error monitoring endpoints: {e}")

def cleanup_endpoints():
    """Clean up duplicate or test endpoints"""
    sagemaker = boto3.client('sagemaker')
    
    print("\n=== ENDPOINT CLEANUP ===")
    endpoints = sagemaker.list_endpoints(MaxResults=20)
    
    huggingface_endpoints = []
    for endpoint in endpoints['Endpoints']:
        if 'huggingface-pytorch-tgi' in endpoint['EndpointName']:
            huggingface_endpoints.append(endpoint)
    
    if len(huggingface_endpoints) <= 1:
        print("✅ Only one HuggingFace endpoint - no cleanup needed")
        return
    
    print(f"Found {len(huggingface_endpoints)} HuggingFace endpoints:")
    for i, ep in enumerate(huggingface_endpoints):
        print(f"{i+1}. {ep['EndpointName']} - {ep['EndpointStatus']} - {ep.get('CreationTime')}")
    
    # Keep the newest one, delete the rest
    sorted_endpoints = sorted(huggingface_endpoints, 
                            key=lambda x: x.get('CreationTime', ''), 
                            reverse=True)
    
    to_keep = sorted_endpoints[0]
    to_delete = sorted_endpoints[1:]
    
    print(f"\nKeeping: {to_keep['EndpointName']} (newest)")
    
    for ep in to_delete:
        print(f"Deleting: {ep['EndpointName']}")
        try:
            sagemaker.delete_endpoint(EndpointName=ep['EndpointName'])
            print(f"✓ Deleted {ep['EndpointName']}")
        except Exception as e:
            print(f"✗ Failed to delete {ep['EndpointName']}: {e}")

def main():
    if len(sys.argv) > 1 and sys.argv[1] == 'cleanup':
        cleanup_endpoints()
    else:
        monitor_endpoints()

if __name__ == "__main__":
    main()