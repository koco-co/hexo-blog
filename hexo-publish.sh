#!/usr/bin/env bash

set -euo pipefail

PORT=4000
RUN_CLEAN=0

usage() {
  cat <<'EOF'
用法：./hexo-publish.sh [local] [--port PORT] [--clean]

仅构建并启动本地预览，不执行提交、推送或云端部署。
--clean 会删除已有生成物，必须由调用者明确指定。
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
  local)
    ;;
  --port)
    shift
    if [ "$#" -eq 0 ] || ! [[ "$1" =~ ^[0-9]+$ ]] || [ "$1" -lt 1 ] || [ "$1" -gt 65535 ]; then
      printf '无效端口。\n' >&2
      exit 2
    fi
    PORT="$1"
    ;;
  --clean)
    RUN_CLEAN=1
    ;;
  -h | --help)
    usage
    exit 0
    ;;
  *)
    printf '未知参数：%s\n' "$1" >&2
    usage >&2
    exit 2
    ;;
  esac
  shift
done

if ! command -v npm >/dev/null 2>&1; then
  printf '缺少 npm。\n' >&2
  exit 1
fi

printf '→ 运行全仓库 lint\n'
node .agents/scripts/audit.mjs lint --json

if [ "$RUN_CLEAN" -eq 1 ]; then
  printf '→ 清理生成物\n'
  npm run clean
fi

printf '→ 生成站点\n'
npm run build

printf '→ 构建后复查 lint\n'
node .agents/scripts/audit.mjs lint --json

printf '→ 启动本地预览：http://localhost:%s/\n' "$PORT"
exec npm run server -- -p "$PORT"
