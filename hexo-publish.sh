#!/usr/bin/env bash

set -u
set -o pipefail

readonly DEFAULT_PORT=4000
SELECTED_MODE=''
LOCAL_BACKGROUND=0
LOCAL_CLEAN=1
PUBLISH_LOG_FILE=''

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1
SCREEN_SESSION_PREFIX="hexo-publish-local-$(basename "$SCRIPT_DIR")"

append_log() {
  if [ -n "${PUBLISH_LOG_FILE:-}" ]; then
    printf '%s\n' "$1" >> "$PUBLISH_LOG_FILE" 2>/dev/null || true
  fi
}

fail() {
  local step="$1"
  local status="${2:-1}"

  append_log "✗ 发布失败：$step"
  append_log '请检查上方 Hexo 错误信息。'
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

usage() {
  printf '用法：%s（交互模式）或 %s local [--background] [--no-clean]\n' "$(basename "$0")" "$(basename "$0")" >&2
}

run_step() {
  local label="$1"
  local status
  local log_status
  local -a pipeline_status
  shift

  printf '→ %s\n' "$label"
  append_log "→ $label"
  if [ -n "${PUBLISH_LOG_FILE:-}" ]; then
    "$@" 2>&1 | tee -a "$PUBLISH_LOG_FILE"
    pipeline_status=("${PIPESTATUS[@]}")
    status="${pipeline_status[0]}"
    log_status="${pipeline_status[1]:-0}"
    if [ "$status" -eq 0 ] && [ "$log_status" -ne 0 ]; then
      status="$log_status"
    fi
  else
    "$@"
    status=$?
  fi
  if [ "$status" -ne 0 ]; then
    fail "$label" "$status"
  fi
  printf '✓ %s\n' "$label"
  append_log "✓ $label"
}

listener_pids() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | sort -u || true
}

port_in_use() {
  [ -n "$(listener_pids "$1")" ]
}

screen_session_exists() {
  local session_name="$1"
  local sessions

  sessions="$(screen -ls 2>/dev/null || true)"
  case "$sessions" in
    *".${session_name}"*) return 0 ;;
    *) return 1 ;;
  esac
}

screen_session_names() {
  local sessions
  local line
  local session_name

  sessions="$(screen -ls 2>/dev/null || true)"
  while IFS= read -r line; do
    case "$line" in
      *".${SCREEN_SESSION_PREFIX}-"*)
        session_name="${line#*.}"
        session_name="${session_name%%[[:space:]]*}"
        case "$session_name" in
          "${SCREEN_SESSION_PREFIX}-"*) printf '%s\n' "$session_name" ;;
        esac
        ;;
    esac
  done <<< "$sessions"
}

stop_managed_screen_sessions() {
  local session_name
  local port

  while IFS= read -r session_name; do
    [ -n "$session_name" ] || continue
    screen -S "$session_name" -X quit >/dev/null 2>&1 || true
    port="${session_name#"$SCREEN_SESSION_PREFIX-"}"
    stop_managed_hexo_server "$port"
  done < <(screen_session_names)
}

stop_managed_hexo_server() {
  local port="$1"
  local pid
  local process_command
  local parent_pid
  local parent_command
  local process_cwd
  local managed

  while IFS= read -r pid; do
    [ -n "$pid" ] || continue
    process_command="$(ps -p "$pid" -o command= 2>/dev/null || true)"
    parent_pid="$(ps -p "$pid" -o ppid= 2>/dev/null || true)"
    parent_command="$(ps -p "$parent_pid" -o command= 2>/dev/null || true)"
    process_cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null || true)"
    managed=0
    case "$process_cwd" in
      *"n${SCRIPT_DIR}"*) ;;
      *) continue ;;
    esac
    case "$process_command" in
      *hexo*) managed=1 ;;
    esac
    case "$parent_command" in
      *"npm run server"*"-p $port"*) managed=1 ;;
    esac
    if [ "$managed" -eq 1 ]; then
      terminate_process_tree "$pid"
    fi
  done < <(listener_pids "$port")
}

terminate_process_tree() {
  local pid="$1"
  local child_pid

  if command -v pgrep >/dev/null 2>&1; then
    while IFS= read -r child_pid; do
      [ -n "$child_pid" ] || continue
      terminate_process_tree "$child_pid"
    done < <(pgrep -P "$pid" 2>/dev/null || true)
  fi

  kill "$pid" 2>/dev/null || true
}

wait_for_process_exit() {
  local pid="$1"

  for _ in {1..50}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
    sleep 0.1
  done

  return 1
}

stop_managed_fallback_server() {
  local pid=''
  local port=''
  local process_command
  local process_cwd

  [ -f "$SCRIPT_DIR/logs/hexo-publish-local.pid" ] || return 0
  if ! read -r pid port < "$SCRIPT_DIR/logs/hexo-publish-local.pid"; then
    : > "$SCRIPT_DIR/logs/hexo-publish-local.pid" 2>/dev/null || true
    return 0
  fi

  case "$pid" in
    ''|*[!0-9]*)
      : > "$SCRIPT_DIR/logs/hexo-publish-local.pid" 2>/dev/null || true
      return 0
      ;;
  esac
  case "$port" in
    ''|*[!0-9]*)
      : > "$SCRIPT_DIR/logs/hexo-publish-local.pid" 2>/dev/null || true
      return 0
      ;;
  esac

  if ! kill -0 "$pid" 2>/dev/null; then
    : > "$SCRIPT_DIR/logs/hexo-publish-local.pid" 2>/dev/null || true
    return 0
  fi

  process_command="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  process_cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null || true)"
  case "$process_cwd" in
    *"n${SCRIPT_DIR}"*) ;;
    *) return 0 ;;
  esac
  case "$process_command" in
    *"npm run server"*"-p $port"*|*"hexo server"*"-p $port"*) ;;
    *) return 0 ;;
  esac

  terminate_process_tree "$pid"
  wait_for_process_exit "$pid" || true
  : > "$SCRIPT_DIR/logs/hexo-publish-local.pid" 2>/dev/null || true
}

resolve_local_port() {
  local port="$DEFAULT_PORT"

  while [ "$port" -le 65535 ]; do
    if ! port_in_use "$port"; then
      printf '✓ 端口 %s 可用\n' "$port" >&2
      append_log "✓ 端口 $port 可用"
      printf '%s\n' "$port"
      return 0
    fi
    printf '! 端口 %s 已被其他进程占用，尝试下一个可用端口\n' "$port" >&2
    append_log "! 端口 $port 已被其他进程占用，尝试下一个可用端口"
    port=$((port + 1))
  done

  fail '没有可用的本地端口'
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

start_background_server() {
  local port="$1"
  local log_file="$2"
  local session_name="${SCREEN_SESSION_PREFIX}-$port"
  local server_pid

  if command -v screen >/dev/null 2>&1; then
    if ! screen -dmS "$session_name" bash -lc 'cd "$1" && exec npm run server -- -p "$2" >> "$3" 2>&1' _ "$SCRIPT_DIR" "$port" "$log_file"; then
      fail "启动本地服务（日志：${log_file}）"
    fi

    for _ in {1..150}; do
      if port_in_use "$port"; then
        printf '✓ 后台本地服务已启动（screen 会话 %s）\n' "$session_name"
        printf '访问地址：http://localhost:%s/\n' "$port"
        printf '日志文件：%s\n' "$log_file"
        return 0
      fi
      if ! screen_session_exists "$session_name"; then
        stop_managed_hexo_server "$port"
        fail "启动本地服务（日志：${log_file}）"
      fi
      sleep 0.1
    done

    screen -S "$session_name" -X quit >/dev/null 2>&1 || true
    stop_managed_hexo_server "$port"
    fail "本地服务未在预期时间内启动（日志：${log_file}）"
  fi

  nohup npm run server -- -p "$port" >> "$log_file" 2>&1 &
  server_pid=$!
  if ! printf '%s %s\n' "$server_pid" "$port" > "$SCRIPT_DIR/logs/hexo-publish-local.pid"; then
    terminate_process_tree "$server_pid"
    fail "记录本地服务进程（日志：${log_file}）"
  fi
  for _ in {1..150}; do
    if port_in_use "$port"; then
      printf '✓ 后台本地服务已启动（PID %s）\n' "$server_pid"
      printf '访问地址：http://localhost:%s/\n' "$port"
      printf '日志文件：%s\n' "$log_file"
      return 0
    fi
    if ! kill -0 "$server_pid" 2>/dev/null; then
      terminate_process_tree "$server_pid"
      : > "$SCRIPT_DIR/logs/hexo-publish-local.pid" 2>/dev/null || true
      fail "启动本地服务（日志：${log_file}）"
    fi
    sleep 0.1
  done

  terminate_process_tree "$server_pid"
  wait_for_process_exit "$server_pid" || true
  : > "$SCRIPT_DIR/logs/hexo-publish-local.pid" 2>/dev/null || true
  fail "本地服务未在预期时间内启动（日志：${log_file}）"
}

publish_local() {
  local port
  local log_file
  local status

  if [ "$LOCAL_BACKGROUND" -eq 1 ]; then
    log_file="$SCRIPT_DIR/logs/hexo-publish.log"
    PUBLISH_LOG_FILE="$log_file"
    if ! mkdir -p "$(dirname "$log_file")"; then
      fail '创建本地发布日志目录'
    fi
    if ! : > "$log_file"; then
      fail '创建本地发布日志文件'
    fi
  fi

  require_command lsof

  if [ "$LOCAL_BACKGROUND" -eq 1 ]; then
    require_command tee
    require_command ps
    require_command pgrep
    if ! command -v screen >/dev/null 2>&1; then
      require_command nohup
    fi
    if command -v screen >/dev/null 2>&1; then
      stop_managed_screen_sessions
    fi
    stop_managed_fallback_server
  fi

  printf '\n[本地发布]\n\n'
  append_log '[本地发布]'
  port="$(resolve_local_port)"
  if [ "$LOCAL_CLEAN" -eq 1 ]; then
    run_step '清理旧资源' npm run clean
  else
    printf '→ 跳过清理旧资源（自动本地模式）\n'
    append_log '→ 跳过清理旧资源（自动本地模式）'
  fi
  run_step '重新生成 public' npm run build

  if [ "$LOCAL_BACKGROUND" -eq 1 ]; then
    printf '→ 启动后台本地服务\n'
    append_log '→ 启动后台本地服务'
    start_background_server "$port" "$log_file"
    return 0
  fi

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
  require_command npm

  if [ "$#" -eq 0 ]; then
    select_mode
  else
    if [ "$1" != 'local' ]; then
      printf '✗ 参数无效。\n' >&2
      usage
      exit 2
    fi
    SELECTED_MODE='local'
    shift
    while [ "$#" -gt 0 ]; do
      case "$1" in
        --background)
          LOCAL_BACKGROUND=1
          ;;
        --no-clean)
          LOCAL_CLEAN=0
          ;;
        *)
          printf '✗ 未知参数：%s\n' "$1" >&2
          usage
          exit 2
          ;;
      esac
      shift
    done
  fi

  case "$SELECTED_MODE" in
    local) publish_local ;;
    cloud) publish_cloud ;;
  esac
}

main "$@"
