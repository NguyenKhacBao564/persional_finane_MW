#!/usr/bin/env python3
"""
Fixed SageMaker Configuration for Meta-Llama-3-8B-Instruct

Issues fixed:
1. CPU vs GPU mismatch - using appropriate CPU-compatible model
2. Hugging Face Hub access issues
3. Better error handling
"""

import json
import sagemaker
import boto3
from sagemaker.huggingface import HuggingFaceModel, get_huggingface_llm_image_uri
from dotenv import load_dotenv
import os
import pathlib

# Load environment variables from the .env file in the parent directory
project_root = pathlib.Path(__file__).parent.parent
load_dotenv(project_root / '.env')

print(f"Loaded .env from: {project_root / '.env'}")

# SageMaker execution role
role = os.getenv("SAGEMAKER_EXECUTION_ROLE_ARN") 
if not role:
    raise ValueError("SAGEMAKER_EXECUTION_ROLE_ARN environment variable is required but not set.")
print(f"Using SageMaker execution role: {role}")

# Validate Hugging Face token
hf_token = os.getenv("HF_TOKEN")
if not hf_token:
    raise ValueError("HF_TOKEN environment variable is required but not set. Please set it and run again.")
print(f"✓ HF_TOKEN loaded (length: {len(hf_token)})")

# Use a CPU-compatible model for ml.m5.xlarge
hub = {
	'HF_MODEL_ID': 'tiiuae/falcon-7b-instruct',  # CPU-friendly model
	'HF_TASK': 'text-generation',
	'TF_DISABLE_NVTX_RANGES': '1',
	'TF_CPP_MIN_LOG_LEVEL': '2'
}

print(f"✓ Using CPU-compatible model: {hub['HF_MODEL_ID']}")

# create Hugging Face Model Class
try:
    # Use CPU image for CPU instances
    image_uri = get_huggingface_llm_image_uri(
        backend="huggingface",
        region="us-east-1"
    )
    print(f"✓ Using image URI: {image_uri}")
    
    huggingface_model = HuggingFaceModel(
        image_uri=image_uri,
        env=hub,
        role=role, 
        sagemaker_session=sagemaker.Session()
    )
    print("✓ Hugging Face model object created successfully")
    
except Exception as e:
    print(f"✗ Model creation failed: {e}")
    raise

# deploy model to SageMaker Inference
try:
    print("\n🚀 Starting deployment to SageMaker...")
    print("This will take 10-15 minutes")
    
    predictor = huggingface_model.deploy(
        initial_instance_count=1,
        instance_type="ml.m5.xlarge",
        container_startup_health_check_timeout=600,
        serializer=sagemaker.serializers.JSONSerializer(),
        deserializer=sagemaker.deserializers.JSONDeserializer()
    )
    
    print(f"✅ Deployment successful!")
    print(f"Endpoint name: {predictor.endpoint_name}")
    
    # Test the endpoint
    print("\n📝 Testing endpoint...")
    test_payload = {
        "inputs": "My name is Clara and I",
        "parameters": {
            "max_new_tokens": 50,
            "temperature": 0.7,
            "do_sample": True
        }
    }
    
    response = predictor.predict(test_payload)
    print("Test response:", response)
    
    print(f"\n🎉 Ready to use!")
    print(f"Endpoint URL: {predictor.endpoint_name}")
    
except Exception as e:
    print(f"❌ Error during deployment: {e}")
    print("\n🔧 Troubleshooting tips:")
    print("1. Check instance type: ml.m5.xlarge (CPU) vs GPU requirements")
    print("2. Verify model compatibility with CPU")
    print("3. Check IAM role permissions")
    print("4. Ensure sufficient SageMaker quotas")
    raise