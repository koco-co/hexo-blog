#!/usr/bin/env bash

set -u
set -o pipefail

readonly DEFAULT_PORT=4000
SELECTED_MODE=''

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

fail() {
  local step="$1"
  local status="${2:-1}"

  printf '\n✗ 发布失败：%s\n' "$step" >&2
  printf '请检查上方 Hexo 错误信息。\n' >&2
  exit "$status"
}

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    fail "缺少命令 $command_name"
  fi
}

run_step() {
  local label="$1"
  shift

  printf '→ %s\n' "$label"
  "$@"
  local status=$?
  if [ "$status" -ne 0 ]; then
    fail "$label" "$status"
  fi
  printf '✓ %s\n' "$label"
}

listener_pids() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | sort -u || true
}

port_in_use() {
  [ -n "$(listener_pids "$1")" ]
}

stop_processes_on_default_port() {
  local pids="$1"
  local pid

  printf '! 检测到端口 %s 被占用\n' "$DEFAULT_PORT"
  printf '→ 正在终止占用端口 %s 的进程\n' "$DEFAULT_PORT"

  while IFS= read -r pid; do
    [ -n "$pid" ] || continue
    if ! kill "$pid" 2>/dev/null; then
      fail "终止端口 $DEFAULT_PORT 的占用进程"
    fi
  done <<< "$pids"

  for _ in {1..50}; do
    if ! port_in_use "$DEFAULT_PORT"; then
      printf '✓ 端口 %s 已释放\n' "$DEFAULT_PORT"
      return 0
    fi
    sleep 0.1
  done

  pids="$(listener_pids "$DEFAULT_PORT")"
  printf '! 端口 %s 未释放，正在强制终止剩余进程\n' "$DEFAULT_PORT" >&2
  while IFS= read -r pid; do
    [ -n "$pid" ] || continue
    if ! kill -KILL "$pid" 2>/dev/null; then
      fail "强制终止端口 $DEFAULT_PORT 的占用进程"
    fi
  done <<< "$pids"

  for _ in {1..50}; do
    if ! port_in_use "$DEFAULT_PORT"; then
      printf '✓ 端口 %s 已释放\n' "$DEFAULT_PORT"
      return 0
    fi
    sleep 0.1
  done

  fail "端口 $DEFAULT_PORT 未能释放"
}

resolve_local_port() {
  local pids

  pids="$(listener_pids "$DEFAULT_PORT")"
  if [ -z "$pids" ]; then
    printf '✓ 端口 %s 可用\n' "$DEFAULT_PORT" >&2
  else
    stop_processes_on_default_port "$pids" >&2
  fi

  printf '%s\n' "$DEFAULT_PORT"
}

select_mode() {
  local choice

  while true; do
    printf '请选择发布模式：\n\n'
    printf '  1) 本地发布（默认）\n'
    printf '  2) 云端发布\n\n'
    read -r -p '请选择 [1/2，默认 1]：' choice || choice=''
    choice="${choice:-1}"

    case "$choice" in
      1)
        SELECTED_MODE='local'
        return 0
        ;;
      2)
        SELECTED_MODE='cloud'
        return 0
        ;;
      *)
        printf '\n✗ 无效选择，请输入 1 或 2。\n\n' >&2
        ;;
    esac
  done
}

publish_local() {
  local port
  local status

  require_command lsof

  printf '\n[本地发布]\n\n'
  port="$(resolve_local_port)"
  run_step '清理旧资源' npm run clean
  run_step '重新生成 public' npm run build

  printf '→ 启动本地服务\n'
  printf '\n访问地址：http://localhost:%s/\n' "$port"
  printf '按 Ctrl+C 停止服务\n\n'

  npm run server -- -p "$port"
  status=$?
  if [ "$status" -eq 0 ] || [ "$status" -eq 130 ] || [ "$status" -eq 143 ]; then
    return 0
  fi
  fail '启动本地服务' "$status"
}

publish_cloud() {
  printf '\n[云端发布]\n\n'
  run_step '清理旧资源' npm run clean
  run_step '重新生成 public' npm run build
  run_step '部署到 GitHub' npm run deploy
  printf '\n✓ 云端发布完成\n'
}

main() {
  if [ "$#" -ne 0 ]; then
    printf '✗ %s 不需要传入任何参数。\n' "$(basename "$0")" >&2
    exit 2
  fi

  require_command npm
  select_mode

  case "$SELECTED_MODE" in
    local) publish_local ;;
    cloud) publish_cloud ;;
  esac
}

main "$@"
