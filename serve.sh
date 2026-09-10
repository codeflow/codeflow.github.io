#!/usr/bin/env bash
# Roda o site localmente exatamente como o GitHub Pages publica (imagem jekyll/jekyll:pages = gem github-pages).
# Uso:  ./serve.sh          -> http://localhost:4000  (auto-rebuild + LiveReload)
#       ./serve.sh build    -> só gera _site/
#       ./serve.sh stop     -> para o servidor
set -euo pipefail
cd "$(dirname "$0")"
IMG=jekyll/jekyll:pages
NAME=codeflow-serve
if ! docker info >/dev/null 2>&1; then
  echo "Docker não está rodando — abrindo o Docker Desktop…"; open -a Docker
  for _ in $(seq 1 36); do docker info >/dev/null 2>&1 && break; sleep 5; done
  docker info >/dev/null 2>&1 || { echo "Docker não subiu."; exit 1; }
fi
case "${1:-serve}" in
  build)
    docker run --rm -v "$PWD":/srv/jekyll -w /srv/jekyll -e JEKYLL_UID="$(id -u)" -e JEKYLL_GID="$(id -g)" \
      "$IMG" jekyll build ;;
  stop)
    docker rm -f "$NAME" >/dev/null 2>&1 && echo "parado." || echo "não estava rodando." ;;
  serve|*)
    docker rm -f "$NAME" >/dev/null 2>&1 || true
    docker run -d --name "$NAME" -p 4000:4000 -p 35729:35729 \
      -v "$PWD":/srv/jekyll -w /srv/jekyll -e JEKYLL_UID="$(id -u)" -e JEKYLL_GID="$(id -g)" \
      "$IMG" jekyll serve --host 0.0.0.0 --port 4000 --livereload --unpublished >/dev/null   # --unpublished: páginas internas (published: false) só aparecem localmente
    printf "subindo"; for _ in $(seq 1 60); do curl -sf -o /dev/null http://localhost:4000/ && break; printf .; sleep 3; done; echo
    echo "no ar: http://localhost:4000   (logs: docker logs -f $NAME | parar: ./serve.sh stop)" ;;
esac
