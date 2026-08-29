---
name: hexo-blog-deploy
description: 对当前 Hexo Butterfly 博客执行显式的发布准备、部署预检、本地或 CI 路由判断、部署和线上验证。仅在用户明确点名本 Skill 或明确要求部署当前博客时使用；不因构建通过、维护完成、提交建议或泛化的“准备好”自动触发。
compatibility: 需要 Node.js 20.19.0 或更高版本、Git 与已安装的 npm 依赖。
disable-model-invocation: true
metadata:
  author: koco-co
  version: "1.1.0"
---

# Outcome

在用户明确授权的范围内，安全地判断当前博客是否可发布；只有阻塞项清零且本次发布授权明确时才执行部署，并验证真实线上结果。

## Routing

- 用户只要求发布检查、发布清单或“是否可部署”时，执行预检并输出报告，不执行发布。
- 用户明确要求本次执行本地部署时，选择 `local` 路由，完成预检和确认门禁后才可运行 `npm run deploy`。
- 用户明确要求通过 GitHub Actions 发布时，选择 `ci` 路由；工作流、独立成品仓库或受限 Deploy Key 条件不满足时停止，不自动改用本地部署。
- 日常文章、配置、CSS/JavaScript 和页面维护转交 `hexo-blog-maintenance`。
- 其他仓库、通用部署建议或未明确指向当前博客的请求不进入本 Skill。

## Steps

1. 查明事实
   - 完整读取 `rules/release-safety.md` 和 `workflows/§01-deploy.md`。
   - 从实时 `_config.yml`、`package.json`、Git 状态和审计输出确定目标、路由、运行环境及阻塞项；敏感值必须脱敏。
   - 完成条件：发布意图、目标、路由、当前状态和所需权限均已明确。

2. 确认关键决策
   - 区分“准备发布”和“实际发布”；不得将 Skill 调用本身视为远程推送授权。
   - 若用户本轮已经明确要求执行部署且目标与命令唯一，可采用该授权；否则在展示目标和影响后请求一次确认。
   - 完成条件：本次是否允许执行外部副作用没有歧义。

3. 执行
   - 先运行 `node .agents/scripts/audit.mjs lint --json`；非 `pass` 时停止并交回维护流程按具体文件修复。
   - 运行 `node .agents/scripts/audit.mjs release --route <local|ci> --json`。
   - 阻塞项存在时停止；准备任务直接生成报告。
   - 仅在实际发布已授权且预检通过时执行选定路由，不扩张为提交、清理、修复主题或修改仓库权限。
   - 完成条件：授权动作完成，或在任何副作用发生前安全停止。

4. 验证
   - 按 `checklists/deployment-acceptance.md` 验证构建、远程结果和线上页面。
   - 命令成功不等于线上生效；无法访问线上站点时标记未验证。
   - 完成条件：报告能够区分已验证、未验证和阻塞，且没有未经授权的外部动作。

## Delivery

- 使用 `templates/deployment-report.template.md` 的字段输出目标、路由、授权、预检、构建、部署、线上验证和回滚信息。
- 列出实际执行的命令及退出结果，但不输出凭据、认证头或带凭据的远程 URL。
- 若未部署，明确写明“未执行部署”及原因。

## Guardrails

- 未获本次实际部署授权时，不运行 `npm run deploy`、`git push` 或任何远程发布动作。
- Local 路由下 `.deploy_git/` 脏、发布目标不唯一、内容校验失败或构建失败时，不绕过预检。
- 不用 `git reset --hard`、`git clean`、递归删除或手工整理 `.deploy_git/`；清理需要独立授权和精确目标。
- 不修改 npm 主题、`themes/butterfly-legacy/`、CI、配置、文章或依赖来“顺便让发布通过”；把这些问题交还维护流程。
- 不输出秘密，不把本地构建成功表述为 GitHub Actions 或线上验证成功。

## References

- 每次调用完整读取 `rules/release-safety.md` 和 `workflows/§01-deploy.md`。
- 输出发布结论时使用 `templates/deployment-report.template.md`。
- 完成预检或发布后使用 `checklists/deployment-acceptance.md`。
- 机械预检入口为 `.agents/scripts/audit.mjs`。
