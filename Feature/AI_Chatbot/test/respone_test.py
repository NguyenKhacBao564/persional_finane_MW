import boto3
import json

runtime = boto3.client("sagemaker-runtime", region_name="us-east-1")

prompt = """
You are a helpful assistant that answers questions about capitals.
Please reply in JSON format:
[
  {
    "country": "the country name",
    "capital": "the capital of that country"
  }
]
Question: What is the capital of Vietnam?
"""

response = runtime.invoke_endpoint(
    EndpointName="llama-model",
    ContentType="application/json",
    Body=json.dumps({
        "inputs": prompt
    })
)

print(response["Body"].read().decode())

