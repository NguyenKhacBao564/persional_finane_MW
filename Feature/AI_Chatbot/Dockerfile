FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirement.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirement.txt

# Copy application code
COPY . .

# Create directories for data and logs
RUN mkdir -p cleaned_data logs

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Expose port (if running as web service)
EXPOSE 8000

# Default command: interactive chatbot
CMD ["python", "chatbot.py", "--list-users"]

# Alternative commands:
# Run data cleaner: docker run chatbot python data_cleaner.py
# Setup stores: docker run chatbot python gemini_file_search.py setup
# Interactive: docker run -it chatbot python chatbot.py --user-id USER_ID
# Demo: docker run chatbot python test/chatbot_demo.py --quick
