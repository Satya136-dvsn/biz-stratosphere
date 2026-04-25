FROM python:3.11-slim
WORKDIR /app
COPY shared /app/shared
COPY rag-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY rag-service .
EXPOSE 8003
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003", "--workers", "1"]
