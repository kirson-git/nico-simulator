ARG NODE_BASE=node:24-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6
FROM ${NODE_BASE} AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
# The first validated artifact targets the Linux amd64 learner VM.
RUN test "$(uname -m)" = x86_64 && \
    curl -fsSL https://dl.k8s.io/release/v1.35.8/bin/linux/amd64/kubectl -o /tmp/kubectl && \
    echo '874d5e72dbb819f43cff16bcd1e4f8bac5b7f2361fe1e55049b0a6c676fb0cbf  /tmp/kubectl' | sha256sum -c - && \
    curl -fsSL https://get.helm.sh/helm-v3.19.0-linux-amd64.tar.gz -o /tmp/helm.tgz && \
    echo 'a7f81ce08007091b86d8bd696eb4d86b8d0f2e1b9f6c714be62f82f96a594496  /tmp/helm.tgz' | sha256sum -c - && \
    tar -xzf /tmp/helm.tgz -C /tmp && chmod +x /tmp/kubectl

FROM ${NODE_BASE}
RUN apt-get update && apt-get install -y --no-install-recommends bash python3 curl jq ca-certificates nano vim && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /tmp/kubectl /usr/local/bin/kubectl
COPY --from=build /tmp/linux-amd64/helm /usr/local/bin/helm
COPY package*.json *.mjs THIRD_PARTY_NOTICES.txt ./
COPY web ./web
COPY lessons ./lessons
COPY examples ./examples
COPY bin ./bin
COPY tests ./tests
RUN mkdir -p /workspace /run/workshop && chown node:node /workspace
ENV KUBECONFIG=/run/workshop/kubeconfig.json HOME=/workspace TERM=xterm-256color EDITOR=vim VISUAL=vim
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
