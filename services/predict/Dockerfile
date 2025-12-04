# Use an official Python runtime as a parent image
FROM python:3.10-slim

WORKDIR /app

COPY ./services/predict/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY ./services/predict/ ./

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
