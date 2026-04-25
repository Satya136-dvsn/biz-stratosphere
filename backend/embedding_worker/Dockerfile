FROM python:3.11-slim
WORKDIR /app
COPY shared /app/shared
COPY embedding_worker /app/embedding_worker
RUN pip install --no-cache-dir -r /app/embedding_worker/requirements.txt
WORKDIR /app/embedding_worker
EXPOSE 8004
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8004", "--workers", "1"]
