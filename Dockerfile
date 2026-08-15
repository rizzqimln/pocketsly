# Pocketsly — container image for Hugging Face Spaces (free, no card) and any
# other Docker host. The app listens on $PORT (HF Spaces injects 7860).
FROM python:3.12-slim

WORKDIR /app

# Install the single runtime dependency first (cached unless requirements change)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application
COPY . .

# HF Spaces proxies to port 7860; Render/other hosts inject their own PORT
ENV PORT=7860
EXPOSE 7860

CMD ["python3", "server.py"]
