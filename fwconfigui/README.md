# FW Config UI

A full-stack web application for managing firewall configuration data stored in YAML files. The backend is a Python FastAPI API with Casbin-based authorization (ABAC/RBAC). The frontend is a static React UI served by the same backend process.

**App URL:** http://localhost:8099

## Project overview

```
fwconfigui/
├── backend/           # FastAPI app (entry point: main.py)
├── frontend/          # Static UI served at / and /static/
├── Dockerfile         # Single-container image for backend + frontend
├── .dockerignore      # Files excluded from Docker build context
├── k8s/               # Kubernetes manifests for local deployment
├── run.sh             # Helper script for local, Docker, and Kubernetes
└── README.md          # This file
```

The backend reads and writes configuration under `WORKSPACE/fwconfigfiles` and uses external repo paths configured by environment variables.

## Prerequisites

### Local development

- Python 3.12+ (recommended)
- A virtual environment in `backend/venv/`
- Dependencies installed from `backend/requirements.txt`
- A `backend/.env` file with required paths (see Environment variables)

### Docker

- Docker Desktop (or Docker Engine)

### Kubernetes (local)

- Docker Desktop with Kubernetes enabled, or another local Kubernetes cluster
- `kubectl` configured for your cluster
- The `fwconfigui:latest` image built locally (the `run.sh k8s` command does this for you)

## Environment variables

| Variable | Example (local) | Purpose |
|---|---|---|
| `FORTIMGR_EXTRACT_REPO` | `/Users/.../fortimgr-extract` | Path to fortimgr-extract repo |
| `PFC_REPO` | `/Users/.../pfc-repo` | Path to pfc-repo |
| `GENERATED_FOLDER_PREFIX` | `generated` | Prefix for generated folders |
| `WORKSPACE` | `/Users/.../workspace` | Workspace root (`fwconfigfiles` lives here) |
| `DEPLOYMENT_TYPE` | `test` | Use `test` for local/demo auth |
| `CURRENT_USER` | `admin` | Simulated user when `DEPLOYMENT_TYPE=test` |
| `DEMO_MODE` | `true` | Enable demo mode |
| `APP_HOST` | `localhost` (local) / `0.0.0.0` (Docker) | Host the server binds to |
| `APP_PORT` | `8099` | Port the server listens on |

For local development, put these in `backend/.env`. Docker and Kubernetes set them via `run.sh` or manifests.

## How to run locally

From the `fwconfigui/` directory:

```bash
chmod +x run.sh
./run.sh local
```

Or manually:

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt   # first time only
python3 main.py
```

Open http://localhost:8099

## How to run with Docker

```bash
./run.sh docker
```

This will:

1. Build `fwconfigui:latest`
2. Run the container with port `8099` mapped
3. Mount your local data folders into `/data/...` inside the container

Open http://localhost:8099

Manual equivalent:

```bash
docker build -t fwconfigui:latest .
docker run --rm -p 8099:8099 \
  -e FORTIMGR_EXTRACT_REPO=/data/fortimgr-extract \
  -e PFC_REPO=/data/pfc-repo \
  -e GENERATED_FOLDER_PREFIX=generated \
  -e WORKSPACE=/data/workspace \
  -e DEPLOYMENT_TYPE=test \
  -e CURRENT_USER=admin \
  -e DEMO_MODE=true \
  -v /Users/kishanharavupradeep/local-dev-abac/fortimgr-extract:/data/fortimgr-extract \
  -v /Users/kishanharavupradeep/local-dev-abac/pfc-repo:/data/pfc-repo \
  -v /Users/kishanharavupradeep/local-dev-abac/workspace:/data/workspace \
  fwconfigui:latest
```

## How to run with Kubernetes

```bash
./run.sh k8s
```

This will:

1. Build `fwconfigui:latest`
2. Apply manifests from `k8s/` (namespace first, then deployment and service)
3. Wait for the deployment rollout
4. Show pods and services
5. Start `kubectl port-forward` to http://localhost:8099

**Note:** The current Kubernetes setup does not mount local data folders yet, so the UI may start but configuration data can appear empty.

Manual equivalent:

```bash
docker build -t fwconfigui:latest .
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl rollout status deployment/fwconfigui -n fwconfigui
kubectl port-forward -n fwconfigui svc/fwconfigui 8099:8099
```

## How to clean Kubernetes resources

```bash
./run.sh clean-k8s
```

Or manually:

```bash
kubectl delete namespace fwconfigui
```

## Troubleshooting

### Local: `ModuleNotFoundError` or missing packages

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Local: app fails on startup with missing environment variables

Create or update `backend/.env` with the required variables listed above.

### Docker: port already in use

Stop any other process or container using port `8099`:

```bash
docker ps
docker stop <container-id>
```

### Kubernetes: `ImagePullBackOff` or `ErrImagePull`

Build the image locally first. The deployment uses `imagePullPolicy: IfNotPresent` and expects `fwconfigui:latest` on your Docker Desktop node:

```bash
docker build -t fwconfigui:latest .
kubectl rollout restart deployment/fwconfigui -n fwconfigui
```

### Kubernetes: pod runs but data is empty

Expected for now. Persistent volume mounts for local data folders are not configured yet in `k8s/deployment.yaml`.

### Kubernetes: port-forward fails

Ensure the service and pod are running:

```bash
kubectl get pods -n fwconfigui
kubectl get svc -n fwconfigui
kubectl logs -n fwconfigui -l app=fwconfigui
```

## Important files

| File | Purpose |
|---|---|
| `Dockerfile` | Builds a single image with Python backend and static frontend. Sets `APP_HOST=0.0.0.0` and `APP_PORT=8099`. |
| `.dockerignore` | Keeps `venv/`, `.env`, caches, and other local-only files out of the Docker build. |
| `k8s/namespace.yaml` | Creates the `fwconfigui` namespace. |
| `k8s/deployment.yaml` | Runs one pod with image `fwconfigui:latest` and required environment variables. |
| `k8s/service.yaml` | Exposes the app inside the cluster on port `8099` for port-forwarding. |
| `run.sh` | One-command helper for local, Docker, Kubernetes deploy, and Kubernetes cleanup. |
