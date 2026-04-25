FROM python:3.11-slim
WORKDIR /app
COPY shared /app/shared
COPY ml_inference /app/ml_inference
RUN pip install --no-cache-dir -r /app/ml_inference/requirements.txt
RUN mkdir -p /app/models
WORKDIR /app/ml_inference
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
