#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

IMAGE_NAME="fwconfigui:latest"
NAMESPACE="fwconfigui"
APP_PORT="8099"
APP_URL="http://localhost:${APP_PORT}"

FORTIMGR_EXTRACT_REPO_HOST="/Users/kishanharavupradeep/local-dev-abac/fortimgr-extract"
PFC_REPO_HOST="/Users/kishanharavupradeep/local-dev-abac/pfc-repo"
WORKSPACE_HOST="/Users/kishanharavupradeep/local-dev-abac/workspace"

show_help() {
  cat <<EOF
FW Config UI - run helper

Usage:
  ./run.sh local       Run the app locally with Python (uses backend/venv if available)
  ./run.sh docker      Build and run the app in Docker with local data folders mounted
  ./run.sh k8s         Build image, deploy to Kubernetes, and port-forward to localhost
  ./run.sh clean-k8s   Delete the Kubernetes namespace and all resources in it
  ./run.sh help        Show this help message

App URL (local and Docker): ${APP_URL}

Environment paths used for Docker volume mounts:
  ${FORTIMGR_EXTRACT_REPO_HOST} -> /data/fortimgr-extract
  ${PFC_REPO_HOST} -> /data/pfc-repo
  ${WORKSPACE_HOST} -> /data/workspace

Notes:
  - Local mode reads backend/.env automatically via python-dotenv.
  - Kubernetes mode does not mount local data folders yet, so data may appear empty.
  - Press Ctrl+C to stop local, Docker, or port-forward sessions.
EOF
}

run_local() {
  echo "==> Starting FW Config UI locally..."
  cd "${SCRIPT_DIR}/backend"

  if [[ -x "venv/bin/python" ]]; then
    PYTHON="venv/bin/python"
    echo "Using virtual environment: backend/venv/bin/python"
  else
    PYTHON="python3"
    echo "Warning: backend/venv/bin/python not found. Falling back to python3."
    echo "Create a venv first if needed:"
    echo "  cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
  fi

  export APP_HOST="${APP_HOST:-localhost}"
  export APP_PORT="${APP_PORT:-8099}"

  echo "APP_HOST=${APP_HOST}"
  echo "APP_PORT=${APP_PORT}"
  echo "Open ${APP_URL}"
  echo "Press Ctrl+C to stop."
  exec "${PYTHON}" main.py
}

run_docker() {
  echo "==> Building Docker image ${IMAGE_NAME}..."
  docker build -t "${IMAGE_NAME}" .

  echo "==> Running Docker container on port ${APP_PORT}..."
  echo "Mounting local data folders into the container."
  echo "Open ${APP_URL}"
  echo "Press Ctrl+C to stop."

  docker run --rm -p "${APP_PORT}:${APP_PORT}" \
    -e FORTIMGR_EXTRACT_REPO=/data/fortimgr-extract \
    -e PFC_REPO=/data/pfc-repo \
    -e GENERATED_FOLDER_PREFIX=generated \
    -e WORKSPACE=/data/workspace \
    -e DEPLOYMENT_TYPE=test \
    -e CURRENT_USER=admin \
    -e DEMO_MODE=true \
    -v "${FORTIMGR_EXTRACT_REPO_HOST}:/data/fortimgr-extract" \
    -v "${PFC_REPO_HOST}:/data/pfc-repo" \
    -v "${WORKSPACE_HOST}:/data/workspace" \
    "${IMAGE_NAME}"
}

run_k8s() {
  echo "==> Building Docker image ${IMAGE_NAME}..."
  docker build -t "${IMAGE_NAME}" .

  echo "==> Applying Kubernetes namespace..."
  kubectl apply -f k8s/namespace.yaml

  echo "==> Applying Kubernetes deployment and service..."
  kubectl apply -f k8s/deployment.yaml
  kubectl apply -f k8s/service.yaml

  echo "==> Waiting for deployment rollout..."
  kubectl rollout status deployment/fwconfigui -n "${NAMESPACE}"

  echo
  echo "==> Pods:"
  kubectl get pods -n "${NAMESPACE}"
  echo
  echo "==> Services:"
  kubectl get svc -n "${NAMESPACE}"
  echo
  echo "Note: current Kubernetes setup does not mount local data folders yet, so data may show empty."
  echo "Starting port-forward to ${APP_URL}"
  echo "Press Ctrl+C to stop port-forward."
  kubectl port-forward -n "${NAMESPACE}" svc/fwconfigui "${APP_PORT}:${APP_PORT}"
}

run_clean_k8s() {
  echo "==> Deleting Kubernetes namespace ${NAMESPACE}..."
  kubectl delete namespace "${NAMESPACE}" --ignore-not-found
  echo "Done."
}

case "${1:-help}" in
  local)
    run_local
    ;;
  docker)
    run_docker
    ;;
  k8s)
    run_k8s
    ;;
  clean-k8s)
    run_clean_k8s
    ;;
  help|-h|--help)
    show_help
    ;;
  *)
    echo "Unknown command: ${1}"
    echo
    show_help
    exit 1
    ;;
esac
