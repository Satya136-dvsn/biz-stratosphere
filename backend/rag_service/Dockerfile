FROM python:3.11-slim
WORKDIR /app
COPY shared /app/shared
COPY rag_service /app/rag_service
RUN pip install --no-cache-dir -r /app/rag_service/requirements.txt
WORKDIR /app/rag_service
EXPOSE 8003
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003", "--workers", "1"]
