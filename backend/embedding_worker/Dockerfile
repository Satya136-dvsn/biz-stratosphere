FROM python:3.11-slim
WORKDIR /app
COPY shared /app/shared
COPY embedding_worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY embedding_worker .
EXPOSE 8004
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8004", "--workers", "1"]
