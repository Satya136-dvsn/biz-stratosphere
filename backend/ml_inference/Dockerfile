FROM python:3.11-slim
WORKDIR /app
COPY shared /app/shared
COPY ml_inference/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ml_inference .
RUN mkdir -p /app/models
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
