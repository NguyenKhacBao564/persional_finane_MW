"""
    This script use for deploying model from huggingface to aws sagemaker AI
"""


import json
import os
import sagemaker
import boto3
from sagemaker.huggingface import HuggingFaceModel, get_huggingface_llm_image_uri
from dotenv import load_dotenv

# Load .env from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

try:
    role = sagemaker.get_execution_role()
except ValueError:
    iam = boto3.client("iam")
    role = iam.get_role(RoleName="sagemaker_execution_role")["Role"]["Arn"]

# Hub Model configuration. https://huggingface.co/models
hub = {
    "HF_MODEL_ID": "meta-llama/Meta-Llama-3-8B-Instruct",
    "SM_NUM_GPUS": json.dumps(1),
    "HF_TOKEN": os.getenv("HF_TOKEN"),
}

assert (
    hub["HF_TOKEN"] is not None
), "HF_TOKEN not found in .env file. Please add HF_TOKEN=your_token to the .env file."

# create Hugging Face Model Class
huggingface_model = HuggingFaceModel(
    image_uri=get_huggingface_llm_image_uri("huggingface", version="3.3.6"),
    env=hub,
    role=role,
)

# deploy model to SageMaker Inference
predictor = huggingface_model.deploy(
    initial_instance_count=1,
    instance_type="ml.g5.2xlarge",
    container_startup_health_check_timeout=300,
)

# send request
runtime = boto3.client("sagemaker-runtime", region_name="us-east-1")

response = runtime.invoke_endpoint(
    EndpointName="huggingface-pytorch-tgi-inference-2025-11-05-10-52-33-895",
    ContentType="application/json",
    Body=json.dumps({
        "inputs": "Hello, how are you today?"
    })
)

print(response["Body"].read().decode())

