#!/usr/bin/env bash
set -euo pipefail
IMAGE=dpf-workshop:0.1.0
CONTAINER=nico-simulator-web
usage() {
  cat <<'HELP'
Shared NICo course web server (presentations and simulated lessons).
Usage: ./web.sh --start BIND_IPV4 [PORT]
       ./web.sh --status | --logs | --stop | --help
--start requires an explicit IPv4 address assigned to this server.
PORT defaults to 8781; accepted range 1-65535. Wildcard 0.0.0.0 is rejected.
Build first with ./workshop.sh --build. Starting replaces only the owned web
container; it restarts automatically with Docker. No cluster, credentials,
workspace or live terminal are attached. Existing localhost lab is unchanged.
HELP
}
owned() { [[ $(docker inspect --format '{{index .Config.Labels "workshop.dpf/owner"}}' "$CONTAINER" 2>/dev/null) == shared-course ]]; }
case "${1:---help}" in
 --help|-h) (($#<=1)) || { usage >&2; exit 2; }; usage;;
 --start)
  (($#==2 || $#==3)) || { usage >&2; exit 2; }
  bind=$2; port=${3:-8781}
  python3 - "$bind" "$port" <<'PY'
import ipaddress,sys
try:
    address=ipaddress.IPv4Address(sys.argv[1])
    assert not address.is_unspecified and not address.is_multicast
    assert sys.argv[2].isascii() and sys.argv[2].isdigit() and 1<=int(sys.argv[2])<=65535
except (ValueError,AssertionError):
    sys.exit('Supply a specific IPv4 address and a port from 1 to 65535.')
PY
  docker image inspect "$IMAGE" >/dev/null
  if docker inspect "$CONTAINER" >/dev/null 2>&1; then
    owned || { echo 'Refusing to replace an unrelated container.' >&2; exit 1; }
    docker stop "$CONTAINER" >/dev/null
    docker rm "$CONTAINER" >/dev/null
  fi
  docker run -d --name "$CONTAINER" --label workshop.dpf/owner=shared-course \
    --restart unless-stopped --init --read-only --cap-drop ALL \
    --security-opt no-new-privileges --cpus 1 --memory 256m --pids-limit 64 \
    --publish "$bind:$port:3000" "$IMAGE" node shared-server.mjs
  ready=false
  for ((attempt=0;attempt<15;attempt++)); do
    if curl --noproxy '*' -fsS "http://$bind:$port/sa-demo" >/dev/null 2>&1; then ready=true; break; fi
    sleep 1
  done
  [[ $ready == true ]] || { docker logs "$CONTAINER"; echo 'Web server did not become ready.' >&2; exit 1; }
  printf 'Shared course: http://%s:%s/\nPresentation: http://%s:%s/sa-demo\n' "$bind" "$port" "$bind" "$port"
  ;;
 --status|--logs|--stop)
  (($#==1)) || { usage >&2; exit 2; }
  owned || { echo 'Owned shared web container not found.' >&2; exit 1; }
  case "$1" in
   --status) docker ps -a --filter "name=^/$CONTAINER$" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}';;
   --logs) docker logs "$CONTAINER";;
   --stop) docker stop "$CONTAINER";;
  esac;;
 *) usage >&2; exit 2;;
esac
