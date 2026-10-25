FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/
COPY frontend/ frontend/

WORKDIR /app/backend

ENV APP_HOST=0.0.0.0
ENV APP_PORT=8099

EXPOSE 8099

CMD ["python", "main.py"]
