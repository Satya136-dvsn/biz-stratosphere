FROM python:3.11-slim
WORKDIR /app
COPY shared /app/shared
COPY llm-orchestrator/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY llm-orchestrator .
EXPOSE 8002
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002", "--workers", "1"]
