FROM python:3.11-slim
WORKDIR /app
COPY shared /app/shared
COPY api_gateway /app/api_gateway
RUN pip install --no-cache-dir -r /app/api_gateway/requirements.txt
WORKDIR /app/api_gateway
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
