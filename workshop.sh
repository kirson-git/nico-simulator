#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
STATE="$ROOT/.runtime"
IMAGE=dpf-workshop:0.1.0
CLUSTER=dpf-training
CONTAINER=dpf-workshop
KIND_VERSION=v0.33.0
KIND_SHA=aee6151561422756b764a4ae28e7f44cda5af5a9eead3cc9985112b1de8d8e0d
NODE_IMAGE=kindest/node:v1.35.8@sha256:07b2536e30b803ed61d1677a79df6115f798ce64c80f9e22f6ed45afd09323c0
usage() {
  cat <<'HELP'
DPF Workshop 0.1.0 — one Linux amd64 learner VM
Usage: ./workshop.sh FLAG
  --build          Build the pinned local dpf-workshop:0.1.0 image.
  --start          Create/reuse kind-dpf-training and start UI on 127.0.0.1:8780.
                   Requires Docker, curl, Python 3 and kubectl on the host.
  --status         Show this workshop container and training nodes.
  --logs           Print workshop server logs (automation commands and results).
  --stop           Stop the UI; preserve cluster and learner work.
  --delete-cluster  Delete this workshop UI and kind cluster; retain workspace.
  --help           Show this help. No arguments also shows help.
Build before first start. Reset the Europe exercise from the browser.
Host-side logs and private kubeconfigs: .runtime/ (excluded from Git and builds).
HELP
}
if (($# == 0)); then usage; exit 0; fi
if (($# != 1)); then usage >&2; exit 2; fi
case "$1" in --help|-h) usage; exit 0;; --build|--start|--status|--logs|--stop|--delete-cluster) ;; *) usage >&2; exit 2;; esac
umask 077
mkdir -p "$STATE/logs"
chmod 700 "$STATE"
LOG="$STATE/logs/$(date -u +%Y%m%dT%H%M%S)-$$.log"
touch "$LOG"
ln -sfn "$(basename "$LOG")" "$STATE/logs/latest.log"
ID=0
run() {
  ID=$((ID + 1))
  { printf '%s command=%s start ' "$(date -u +%FT%TZ)" "$ID"; printf '%q ' "$@"; printf '\n'; } | tee -a "$LOG"
  local rc=0
  "$@" 2>&1 | tee -a "$LOG" || rc=${PIPESTATUS[0]}
  printf '%s command=%s exit=%s\n' "$(date -u +%FT%TZ)" "$ID" "$rc" | tee -a "$LOG"
  return "$rc"
}
capture_private() {
  local destination=$1
  shift
  ID=$((ID + 1))
  { printf '%s command=%s start ' "$(date -u +%FT%TZ)" "$ID"; printf '%q ' "$@"; printf '[private output omitted]\n'; } | tee -a "$LOG"
  local rc=0
  "$@" > "$destination" 2>> "$LOG" || rc=$?
  printf '%s command=%s exit=%s\n' "$(date -u +%FT%TZ)" "$ID" "$rc" | tee -a "$LOG"
  return "$rc"
}
owned_container() {
  [[ $(docker inspect --format '{{index .Config.Labels "workshop.dpf/owner"}}' "$CONTAINER" 2>/dev/null) == dpf-training ]]
}
owned_cluster() {
  local actual
  actual=$(docker inspect --format '{{.Id}}' "$CLUSTER-control-plane" 2>/dev/null) || return 1
  [[ -s "$STATE/owned-cluster" && $(cat "$STATE/owned-cluster") == "$actual" ]]
}
remove_workshop() {
  owned_container || { printf 'Refusing to remove an unrelated container.\n' >&2; return 1; }
  run docker stop "$CONTAINER"
  # Stop first so the archive also contains the final completed commands.
  run docker logs "$CONTAINER" > /dev/null
  run docker rm "$CONTAINER"
}
ensure_kind() {
  [[ $(uname -s) == Linux && $(uname -m) == x86_64 ]] || { printf 'This release supports Linux amd64.\n' >&2; exit 1; }
  if [[ ! -f "$STATE/kind" ]] || ! printf '%s  %s\n' "$KIND_SHA" "$STATE/kind" | sha256sum -c - >/dev/null 2>&1; then
    run curl -fL --retry 3 "https://github.com/kubernetes-sigs/kind/releases/download/$KIND_VERSION/kind-linux-amd64" -o "$STATE/kind.part"
    printf '%s  %s\n' "$KIND_SHA" "$STATE/kind.part" | sha256sum -c -
    mv "$STATE/kind.part" "$STATE/kind"
  fi
  printf '%s  %s\n' "$KIND_SHA" "$STATE/kind" | sha256sum -c -
  chmod 700 "$STATE/kind"
}
case "$1" in
  --build) run docker build --tag "$IMAGE" "$ROOT";;
  --start)
    for tool in docker curl python3 kubectl; do command -v "$tool" >/dev/null || { printf 'Missing required tool: %s\n' "$tool" >&2; exit 1; }; done
    docker image inspect "$IMAGE" >/dev/null || { printf 'Run --build first.\n' >&2; exit 1; }
    ensure_kind
    if docker inspect "$CLUSTER-control-plane" >/dev/null 2>&1; then
      owned_cluster || { printf 'Existing dpf-training cluster identity does not match this directory.\n' >&2; exit 1; }
    else
      create_rc=0
      run "$STATE/kind" create cluster --name "$CLUSTER" --config "$ROOT/kind.yaml" --image "$NODE_IMAGE" --kubeconfig "$STATE/host-kubeconfig" --wait 180s || create_rc=$?
      # Retain the actual identity even if kind leaves a partial cluster after failure.
      docker inspect --format '{{.Id}}' "$CLUSTER-control-plane" > "$STATE/owned-cluster" || true
      if ((create_rc != 0)); then exit "$create_rc"; fi
    fi
    capture_private "$STATE/internal-kubeconfig" "$STATE/kind" get kubeconfig --name "$CLUSTER" --internal
    capture_private "$STATE/kubeconfig.json" kubectl --kubeconfig "$STATE/internal-kubeconfig" config view --raw -o json
    run docker volume create --label workshop.dpf/owner=dpf-training dpf-workshop-config
    run docker volume create --label workshop.dpf/owner=dpf-training dpf-workshop-workspace
    # Transfer only this training credential; never mount the admin's home or Docker socket.
    run docker run --rm -i --user 0 --entrypoint /bin/sh -v dpf-workshop-config:/config "$IMAGE" -c 'cat > /config/kubeconfig.json && chown 1000:1000 /config/kubeconfig.json && chmod 600 /config/kubeconfig.json' < "$STATE/kubeconfig.json"
    if docker inspect "$CONTAINER" >/dev/null 2>&1; then
      remove_workshop
    fi
    run docker run -d --name "$CONTAINER" --label workshop.dpf/owner=dpf-training --restart unless-stopped --init --network kind --publish 127.0.0.1:8780:3000 --cpus 2 --memory 1g --pids-limit 256 --cap-drop ALL --security-opt no-new-privileges --mount type=volume,src=dpf-workshop-config,dst=/run/workshop,readonly --mount type=volume,src=dpf-workshop-workspace,dst=/workspace "$IMAGE"
    ready=false
    for ((attempt=0;attempt<30;attempt++)); do
      if curl -fsS http://127.0.0.1:8780/api/health > "$STATE/health.json"; then ready=true; break; fi
      sleep 2
    done
    if [[ $ready != true ]]; then run docker logs "$CONTAINER"; exit 1; fi
    printf '\nWorkshop ready: http://127.0.0.1:8780\nOn your Mac: ssh -L 8780:127.0.0.1:8780 nico-lab\nLog: %s\n' "$LOG"
    ;;
  --status)
    owned_container || { printf 'Workshop UI is not created.\n'; exit 1; }
    run docker ps -a --filter "name=^/$CONTAINER$" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    run docker exec "$CONTAINER" kubectl --kubeconfig /run/workshop/kubeconfig.json get nodes
    ;;
  --logs) owned_container || exit 1; run docker logs "$CONTAINER";;
  --stop) owned_container || exit 1; run docker stop "$CONTAINER";;
  --delete-cluster)
    owned_cluster || { printf 'Training cluster identity does not match; refusing deletion.\n' >&2; exit 1; }
    ensure_kind
    if docker inspect "$CONTAINER" >/dev/null 2>&1; then
      remove_workshop
    fi
    run "$STATE/kind" delete cluster --name "$CLUSTER" --kubeconfig "$STATE/host-kubeconfig"
    rm -f "$STATE/owned-cluster" "$STATE/host-kubeconfig" "$STATE/internal-kubeconfig" "$STATE/kubeconfig.json"
    ;;
esac
