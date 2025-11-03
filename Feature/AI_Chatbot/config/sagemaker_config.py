import json
import sagemaker
import boto3
from sagemaker.huggingface import HuggingFaceModel, get_huggingface_llm_image_uri
from dotenv import load_dotenv
import os

# Load environment variables from the .env file in the parent directory
import pathlib
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

# Hub Model configuration. https://huggingface.co/models
hub = {
	'HF_MODEL_ID':'meta-llama/Meta-Llama-3-8B-Instruct',
	'SM_NUM_GPUS': json.dumps(1),
	'HF_TOKEN': hf_token
}

# create Hugging Face Model Class
huggingface_model = HuggingFaceModel(
	image_uri=get_huggingface_llm_image_uri("huggingface"),
	env=hub,
	role=role, 
)

# deploy model to SageMaker Inference
try:
	predictor = huggingface_model.deploy(
		initial_instance_count=1,
		instance_type="ml.m5.xlarge",
		container_startup_health_check_timeout=300,
	  )
	
	# send request
	response = predictor.predict({
		"inputs": "My name is Clara and I am",
	})
	print("Deployment successful! Response:", response)
	
except Exception as e:
	print(f"Error during deployment or prediction: {e}")
	raise
