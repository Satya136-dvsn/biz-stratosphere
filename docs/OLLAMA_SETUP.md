
# 🦙 Ollama Local LLM Setup Guide

This guide explains how to activate the AI capabilities of **Biz Stratosphere**. We use [Ollama](https://ollama.ai/) to run powerful language models (LLMs) locally, ensuring **100% data privacy** (zero data leaves your machine).

## 🏗️ Architecture

- **Service**: `ollama` (in `docker-compose.yml`)
- **Port**: `11434`
- **Default Model**: `llama3.1` (8B parameters)
- **Integration**: The Python Backend talks to Ollama via HTTP to generate predictions and chat responses.

---

## 🚀 Setup Steps

### 1. Start the Docker Container

First, ensure the Ollama engine is running.

```bash
docker-compose up -d ollama
```

> **Note:** The first time you run this, it downloads the Ollama image (~3.3GB). If it fails, ensure you have a stable internet connection and try `docker pull ollama/ollama:latest` manually.

### 2. Download the "Brain" (Model)

The container starts empty. You must install the intelligence (Llama 3.1) inside it.
Run this command in your terminal:

```bash
docker exec -it biz-stratosphere-ollama ollama pull llama3.1
```

- **Size:** ~4.7 GB
- **Time:** 5-20 mins (depending on internet speed)

### 3. Verify Installation

Check if the model is ready:

```bash
docker exec -it biz-stratosphere-ollama ollama list
```

**Expected Output:**

```
NAME            ID              SIZE    MODIFIED
llama3.1:latest   ...             4.7GB   ...
```

### 4. Test the API

You can talk to it directly to test:

```bash
docker exec -it biz-stratosphere-ollama ollama run llama3.1 "Hello, are you ready?"
```

---

## 🐞 Troubleshooting

### "Image Pull Failed" / "httpReadSeeker" Error

- **Cause:** Network instability downloading the large Docker image.
- **Fix:**
  1. Restart Docker Desktop.
  2. Run `docker pull ollama/ollama:latest` repeatedly until it completes.

### "Model Not Found" / "Connection Refused" in Backend

- **Cause:** You started the backend, but didn't run **Step 2** (pulling the model).
- **Fix:** Run the `docker exec ... pull llama3.1` command. The backend will automatically retry connecting.

### Performance Issues

- **Cause:** Running LLMs is CPU/RAM intensive.
- **Tip:** Ensure you have at least **8GB RAM** allocated to Docker (16GB recommended).
