# AI Chatbot Feature

## Overview

The AI Chatbot feature provides intelligent conversational capabilities for personal finance management. It uses a custom LLM deployment via AWS SageMaker with cost-effective billing controls and comprehensive monitoring.

## Architecture

### Technology Stack
- **Primary Model**: Meta Llama 3 8B Instruct deployed on AWS SageMaker
- **Fallback**: OpenAI API for redundancy
- **Backend**: Python-based integration with AWS SDK
- **Monitoring**: Real-time endpoint health and billing controls
- **File Structure**: Modular design with services, routes, and utilities

### Key Features
- **Cost Management**: Automated endpoint start/stop for billing control
- **Health Monitoring**: Real-time endpoint status and performance tracking
- **Multi-Model Support**: Primary SageMaker deployment with OpenAI fallback
- **Security**: AWS IAM integration and secure credential management

## File Structure

```
AI_Chatbot/
├── .env_example              # Environment variable template
├── requirement.txt           # Python dependencies
├── respone_test.py          # SageMaker endpoint testing
├── config/                  # Deployment configurations
├── scripts/                 # Utility scripts
│   └── sagemaker_monitor.py # SageMaker monitoring and billing control
└── services/                # Core chatbot services (to be implemented)
```

## Quick Start

### 1. Environment Setup
```bash
# Copy environment template and configure
cp .env_example .env
# Edit .env with your AWS credentials and configuration
```

### 2. Install Dependencies
```bash
pip install -r requirement.txt
```

### 3. Test SageMaker Endpoint
```bash
python respone_test.py
```

### 4. Monitor and Control Billing
```bash
python scripts/sagemaker_monitor.py
```

## Environment Variables

Required variables (see `.env_example`):

- **AWS Configuration**:
  - Configure AWS credentials using AWS CLI before running the scripts
  - Run `aws configure` to set up your credentials locally

- **Hugging Face Configuration**:
  - `HF_TOKEN`: Your Hugging Face read token for model access

- **SageMaker Configuration**:
  - `SAGEMAKER_EXECUTION_ROLE_ARN`: ARN of the SageMaker execution role for model deployment

## Development

### Adding New Chatbot Services
1. Create new service in `services/` directory
2. Follow existing pattern for endpoint integration
3. Add tests in corresponding `tests/` directory
4. Update requirement.txt with any new dependencies

### Model Deployment
Use the SageMaker deployment scripts in `config/` to deploy new models:
- Automated deployment from HuggingFace models
- Configuration validation
- Health check implementation

### Testing
```bash
# Test endpoint connectivity
python respone_test.py

# Run monitoring and health checks
python scripts/sagemaker_monitor.py

# Run tests (when implemented)
python -m pytest tests/
```

## Cost Management

The AI Chatbot includes sophisticated cost control features:

### Automatic Endpoint Management
- **Start Endpoint**: Launch when chatbot is needed
- **Stop Endpoint**: Automatically shut down to save costs
- **Health Monitoring**: Continuous endpoint status checks
- **Cleanup**: Remove failed or duplicate endpoints

### Billing Control Scripts
The `sagemaker_monitor.py` script provides:
- Interactive endpoint management
- Real-time cost monitoring
- Automated cleanup routines
- Billing alerts and notifications

## API Integration

### SageMaker Endpoint Usage
```python
import boto3
import json

runtime = boto3.client("sagemaker-runtime", region_name="us-east-1")

response = runtime.invoke_endpoint(
    EndpointName="llama-model",
    ContentType="application/json",
    Body=json.dumps({"inputs": prompt})
)
```

### OpenAI Fallback
The system automatically falls back to OpenAI if SageMaker is unavailable, ensuring continuous service.

## Security

- **AWS IAM**: Use least-privilege IAM roles for SageMaker access
- **Credentials**: Store AWS credentials securely in environment variables
- **Network**: Configure proper VPC and security group settings
- **Data**: Implement input validation and sanitization

## Monitoring and Logging

- **Health Checks**: Continuous endpoint status monitoring
- **Performance Metrics**: Response time and accuracy tracking
- **Cost Tracking**: Real-time billing monitoring
- **Error Handling**: Comprehensive error logging and alerting

## Future Enhancements

- **Multi-Model Support**: Integration with additional LLM providers
- **Fine-Tuning**: Custom model training on financial data
- **RAG Integration**: Retrieval-augmented generation with financial documents
- **Webhooks**: Real-time notifications and callbacks

## Contributing

1. Follow the existing code structure and patterns
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Ensure proper error handling and logging
5. Test cost control features before deployment
