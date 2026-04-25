FROM python:3.11-slim
WORKDIR /app
COPY shared /app/shared
COPY llm_orchestrator /app/llm_orchestrator
RUN pip install --no-cache-dir -r /app/llm_orchestrator/requirements.txt
WORKDIR /app/llm_orchestrator
EXPOSE 8002
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002", "--workers", "1"]
