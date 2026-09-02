#!/usr/bin/env bash

set -euo pipefail

PORT=4000
PORT_SET=0
RUN_CLEAN=0
MODE=""
ASSUME_YES=0
GITHUB_BRANCH="main"
GITHUB_WORKFLOW="deploy.yml"

usage() {
  cat <<'EOF'
用法：
  ./hexo-publish.sh [local] [--port PORT] [--clean]
  ./hexo-publish.sh github [--yes]

模式：
  local    运行 lint、构建并启动本地预览（默认）
  github   通过 workflow_dispatch 触发现有 GitHub Actions 远程部署

选项：
  --port PORT  指定本地预览端口，仅用于 local 模式
  --clean      构建前删除已有生成物，仅用于 local 模式
  --yes        跳过远程部署确认，仅用于 github 模式

github 模式不会提交或推送源码，只部署已经同步到 origin/main 的提交。
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
  local | github)
    if [ -n "$MODE" ] && [ "$MODE" != "$1" ]; then
      printf '不能同时指定 local 和 github 模式。\n' >&2
      exit 2
    fi
    MODE="$1"
    ;;
  --port)
    shift
    if [ "$#" -eq 0 ] || ! [[ "$1" =~ ^[0-9]+$ ]] || [ "$1" -lt 1 ] || [ "$1" -gt 65535 ]; then
      printf '无效端口。\n' >&2
      exit 2
    fi
    PORT="$1"
    PORT_SET=1
    ;;
  --clean)
    RUN_CLEAN=1
    ;;
  --yes)
    ASSUME_YES=1
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

MODE="${MODE:-local}"

if [ "$MODE" = "github" ] && { [ "$RUN_CLEAN" -eq 1 ] || [ "$PORT_SET" -eq 1 ]; }; then
  printf 'github 模式不接受 --clean 或 --port。\n' >&2
  exit 2
fi

if [ "$MODE" = "local" ] && [ "$ASSUME_YES" -eq 1 ]; then
  printf 'local 模式不接受 --yes。\n' >&2
  exit 2
fi

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf '缺少命令：%s。\n' "$command_name" >&2
    exit 1
  fi
}

run_local() {
  require_command node
  require_command npm

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
}

find_dispatched_run() {
  local source_repo="$1"
  local source_sha="$2"
  local triggered_at="$3"
  local run_id=""
  local attempt

  for attempt in {1..15}; do
    run_id="$(
      gh run list \
        --repo "$source_repo" \
        --workflow "$GITHUB_WORKFLOW" \
        --event workflow_dispatch \
        --branch "$GITHUB_BRANCH" \
        --commit "$source_sha" \
        --created ">=$triggered_at" \
        --limit 10 \
        --json databaseId \
        --jq '.[0].databaseId // empty'
    )"
    if [ -n "$run_id" ]; then
      printf '%s\n' "$run_id"
      return 0
    fi
    sleep 2
  done

  return 1
}

run_github() {
  local current_branch
  local source_sha
  local remote_sha
  local source_repo
  local confirmation
  local triggered_at
  local dispatch_output
  local run_url
  local run_id

  require_command node
  require_command git
  require_command gh

  if [ -n "$(git status --porcelain)" ]; then
    printf 'GitHub 远程部署已停止：主仓库工作树不干净，本地改动不会被 workflow_dispatch 部署。\n' >&2
    exit 1
  fi

  current_branch="$(git branch --show-current)"
  if [ "$current_branch" != "$GITHUB_BRANCH" ]; then
    printf 'GitHub 远程部署已停止：当前分支是 %s，要求分支为 %s。\n' "$current_branch" "$GITHUB_BRANCH" >&2
    exit 1
  fi

  if ! git remote get-url origin >/dev/null 2>&1; then
    printf 'GitHub 远程部署已停止：没有可用的 origin 远程。\n' >&2
    exit 1
  fi

  printf '→ 获取 origin/%s 的最新状态\n' "$GITHUB_BRANCH"
  git fetch --quiet origin "$GITHUB_BRANCH"

  source_sha="$(git rev-parse HEAD)"
  remote_sha="$(git rev-parse "refs/remotes/origin/$GITHUB_BRANCH")"
  if [ "$source_sha" != "$remote_sha" ]; then
    printf 'GitHub 远程部署已停止：本地 HEAD 与 origin/%s 不一致；请先单独处理提交或推送。\n' "$GITHUB_BRANCH" >&2
    exit 1
  fi

  printf '→ 运行全仓库 lint\n'
  node .agents/scripts/audit.mjs lint --json

  printf '→ 运行 GitHub Actions 发布预检\n'
  node .agents/scripts/audit.mjs release --route ci --json

  printf '→ 检查 GitHub CLI 登录状态\n'
  gh auth status --hostname github.com >/dev/null
  source_repo="$(gh repo view --json nameWithOwner --jq '.nameWithOwner')"

  printf '即将触发 GitHub Actions 远程部署：\n'
  printf '  源码仓库：%s\n' "$source_repo"
  printf '  工作流：%s\n' "$GITHUB_WORKFLOW"
  printf '  分支：%s\n' "$GITHUB_BRANCH"
  printf '  提交：%s\n' "$source_sha"

  if [ "$ASSUME_YES" -ne 1 ]; then
    if [ ! -t 0 ]; then
      printf '非交互环境必须显式传入 --yes 才能执行远程部署。\n' >&2
      exit 1
    fi
    read -r -p '输入 deploy 确认触发远程部署：' confirmation
    if [ "$confirmation" != "deploy" ]; then
      printf '已取消，未触发远程部署。\n'
      exit 0
    fi
  fi

  triggered_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  printf '→ 触发 GitHub Actions 工作流\n'
  if ! dispatch_output="$(
    gh workflow run "$GITHUB_WORKFLOW" \
      --repo "$source_repo" \
      --ref "$GITHUB_BRANCH" 2>&1
  )"; then
    printf '%s\n' "$dispatch_output" >&2
    printf '触发失败，未自动重试。\n' >&2
    exit 1
  fi
  printf '%s\n' "$dispatch_output"

  run_url="$(printf '%s\n' "$dispatch_output" | awk '/^https:\/\/github\.com\// { url=$0 } END { print url }')"
  run_id="${run_url##*/}"
  if [ -z "$run_url" ] || ! [[ "$run_id" =~ ^[0-9]+$ ]]; then
    printf '→ 查找刚触发的工作流运行\n'
    if ! run_id="$(find_dispatched_run "$source_repo" "$source_sha" "$triggered_at")"; then
      printf '工作流已触发，但无法可靠定位运行编号；为避免重复部署，脚本不会重试。\n' >&2
      exit 1
    fi
  fi

  printf '→ 等待 GitHub Actions 运行 %s 完成\n' "$run_id"
  if gh run watch "$run_id" --repo "$source_repo" --exit-status; then
    gh run view "$run_id" \
      --repo "$source_repo" \
      --json url,status,conclusion \
      --jq '"远程部署完成：\(.conclusion)\n运行地址：\(.url)"'
  else
    gh run view "$run_id" \
      --repo "$source_repo" \
      --json url,status,conclusion \
      --jq '"远程部署未成功：\(.conclusion)\n运行地址：\(.url)"' >&2
    printf '未自动重试或改写远程状态。\n' >&2
    exit 1
  fi
}

case "$MODE" in
local)
  run_local
  ;;
github)
  run_github
  ;;
esac
