FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x docker-entrypoint.sh

EXPOSE 8000

# docker-entrypoint.sh runs migrations before starting the server, and binds
# to $PORT if set (Render and similar platforms assign this dynamically).
CMD ["./docker-entrypoint.sh"]
