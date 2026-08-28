import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  auditAssets,
  auditCode,
  auditConfig,
  auditContent,
  auditDocs,
  auditLint,
  auditProject,
  auditRelease,
  auditSkills,
  auditStructure,
  auditTags,
  compareVersions,
  formatReport,
} from './audit.mjs'

const temporaryRoots = []
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const migrationScript = path.join(projectRoot, '.agents/skills/hexo-learn-topic/scripts/migrate-course-contracts.mjs')
const CHINESE_SEQUENCE = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']

const TAG_PLUGIN_PLUS_TAGS = [
  'audio', 'bdage', 'btns', 'bubble', 'carousel', 'cell', 'checkbox',
  'del', 'emp', 'folding', 'ghcard', 'ghcardgroup', 'icon', 'image',
  'inlineimage', 'issues', 'kbd', 'link', 'linkgroup', 'nota', 'p',
  'poem', 'progress', 'psw', 'radio', 'referfrom', 'referto', 'site',
  'sitegroup', 'span', 'tip', 'u', 'video', 'videos', 'wavy',
]

function makeRoot() {
  const root = mkdtempSync(path.join(tmpdir(), 'hexo-blog-audit-'))
  temporaryRoots.push(root)
  return root
}

function write(root, relativePath, content) {
  const target = path.join(root, relativePath)
  mkdirSync(path.dirname(target), { recursive: true })
  if (Buffer.isBuffer(content)) writeFileSync(target, content)
  else writeFileSync(target, content, 'utf8')
}

function validPost({ abbrlink = '', title = '示例文章', published } = {}) {
  const linkLine = abbrlink ? `abbrlink: ${abbrlink}\n` : ''
  const publishedLine = published === undefined ? '' : `published: ${published}\n`
  return `---\ntitle: ${title}\ntags:\n  - Hexo\ncategories:\n  - 文档\ndescription: 用于校验的文章。\n${linkLine}${publishedLine}date: 2026-08-10 12:00:00\n---\n\n正文。\n`
}

function validPlaywrightCoursePost({ number = '一', topic = '入门路线', published = true, placeholder = false, description = '按知识顺序学习 Playwright Python。' } = {}) {
  const order = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'].indexOf(number) + 1
  const entry = !placeholder && number === '一' && topic === '入门路线'
    ? `{% note info flat %}\n课程入口只说明学习范围、依赖和开始方式。\n{% endnote %}\n\n## 课程目标\n\n{% note info flat %}\n建立 Playwright Python 测试主线。\n{% endnote %}\n\n## 前置条件\n\n{% note info flat %}\n需要 Python 函数、类和终端基础。\n{% endnote %}\n\n## 学习路径\n\n{% mermaid %}\nflowchart TD\nA[环境] --> B[定位]\nB --> C[断言]\n{% endmermaid %}\n\n## 文章安排\n\n| 顺序 | 主题 |\n| --- | --- |\n| 1 | 入门路线 |\n| 2 | 快速开始 |\n\n## 开始学习\n\n{% note info flat %}\n先完成环境准备，再进入快速开始。\n{% endnote %}\n\n## 参考资料\n\n{% linkgroup %}\n{% link Playwright, https://playwright.dev/python/, https://playwright.dev/favicon.ico %}\n{% endlinkgroup %}`
    : placeholder
      ? `<!-- learn-topic-placeholder -->\n\n> 本文为已确认课程中的未发布占位。\n\n## 文章职责\n\n说明本文唯一问题和可观察成果。\n\n## 内容边界\n\n说明覆盖条目、文章间边界和失败边界。\n\n## 正文编排\n\n| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| 环境准备 | 完成环境准备 | 安装与验证 | tabs | 平行方案 | 选择标准 | 文字兜底 | 命令与输出 | 计划 |\n\n## 视觉与复习\n\n说明标签、图表、实验、复习卡片和资料卡片计划。\n\n## 验收证据\n\n说明机械检查、隔离构建和公开候选门禁。`
      : `{% note info flat %}\n正文。\n{% endnote %}\n\n## 主题内容\n\n{% note info flat %}\n说明主题机制、示例和边界。\n{% endnote %}\n\n## 常见问题\n\n{% flashcard basic id:fixture-${number} deck:"Playwright" priority:2 %}\n--- question\n问题。\n--- answer\n回答。\n--- explanation\n解析。\n{% endflashcard %}\n\n## 参考资料\n\n{% linkgroup %}\n{% link Playwright, https://playwright.dev/python/, https://playwright.dev/favicon.ico %}\n{% endlinkgroup %}`
  return `---\ntitle: Playwright(${number})${topic}\ntags:\n  - Playwright\ncategories:\n  - Learn Topic\n  - Playwright\ndescription: ${description}\nseries: Playwright\nseries_order: ${order}\nabbrlink: pw${number}\npublished: ${published}\ndate: 2026-08-24 12:00:00\n---\n\n{% course_series %}\n\n${entry}\n`
}

function writeCourseContract(root, {
  slug = 'playwright',
  series = 'Playwright',
  topics = ['快速开始'],
  optionalArticles = [],
} = {}) {
  const suffixes = ['入门路线', ...topics, ...optionalArticles]
  const articles = suffixes.map((suffix, index) => {
    const title = `${series}(${CHINESE_SEQUENCE[index]})${suffix}`
    return {
      order: index + 1,
      title,
      file: `${title}.md`,
      kind: index === 0 ? 'entry' : index <= topics.length ? 'topic' : suffix === '进阶路线' ? 'advanced' : 'final',
    }
  })
  write(root, `.agents/skills/hexo-learn-topic/data/${slug}.json`, JSON.stringify({
    schema_version: 2,
    course: {
      slug,
      series,
      public_article_contract: 'v1',
      topics,
      optional_articles: optionalArticles,
      articles,
    },
    capability_ledger: {
      schema_version: '1.0',
      source_manifest: {},
      capabilities: { 'fixture-capability': { title: 'fixture' } },
      ledger: {
        fields: ['disposition', 'target', 'reason', 'validation'],
        items: {
          'fixture-capability': ['core', `${articles[1].title} / 核心功能`, 'fixture', 'verified'],
        },
      },
      summary: {
        official_capabilities: 1,
        ledger_entries: 1,
        official_only: 0,
        ledger_only: 0,
        duplicates: 0,
        unassigned: 0,
      },
    },
  }))
}

function createProjectFixture(root) {
  write(root, 'package.json', JSON.stringify({
    name: 'fixture',
    dependencies: { hexo: '^8.0.0' },
  }))
  write(root, 'node_modules/hexo/package.json', JSON.stringify({
    version: '8.1.1',
    engines: { node: '>=20.19.0' },
  }))
  write(root, '_config.yml', 'url: https://example.com\ntheme: butterfly\ndeploy:\n  type: git\n  repo: https://user:secret@example.com/site.git?token=hidden\n  branch: main\n')
  write(root, '_config.butterfly.yml', 'search:\n  use: local_search\ncomments:\n  use: giscus\npjax:\n  enable: true\nlazyload:\n  enable: true\ninject:\n  head:\n    - <link rel="stylesheet" href="/css/custom.css">\n  bottom:\n    - <script src="/js/missing.js"></script>\nservice:\n  apiKey: super-secret-value\n')
  write(root, 'scaffolds/post.md', '---\ntitle: {{ title }}\ndate: {{ date }}\ntags:\n---\n')
  write(root, 'scripts/course-series.js', "hexo.extend.tag.register('course_series', () => '')\n")
  write(root, 'source/_posts/example.md', validPost({ abbrlink: 'abc123' }))
  write(root, 'source/css/custom.css', 'body {}\n')
  write(root, 'source/js/client.js', 'const token = "do-not-print-this"\n')
  write(root, 'themes/butterfly/package.json', '{"version":"5.5.3"}\n')
  write(root, '.github/workflows/deploy.yml', "node-version: '16'\n")
}

function createTagPluginFixture(root, {
  enable = true,
  issues = false,
  markdown = '',
  registeredTags = TAG_PLUGIN_PLUS_TAGS,
} = {}) {
  write(root, 'package.json', JSON.stringify({
    name: 'fixture',
    dependencies: {
      'hexo-butterfly-tag-plugins-plus': '^1.0.18',
      'hexo-flashcard-plugin': 'https://example.com/hexo-flashcard-plugin.tgz',
      'hexo-renderer-kramed': '^0.1.4',
    },
  }))
  write(root, '_config.yml', 'flashcard:\n  path: learn-topic\n  asset_path: flashcard-assets\n')
  write(root, '_config.butterfly.yml', `tag_plugins:\n  enable: ${enable}\n  priority: 5\n  issues: ${issues}\n  link:\n    placeholder: /img/link.png\n  CDN: {}\n`)
  write(root, 'node_modules/hexo-butterfly-tag-plugins-plus/package.json', JSON.stringify({
    name: 'hexo-butterfly-tag-plugins-plus',
    version: '1.0.18',
  }))
  write(root, 'node_modules/hexo-flashcard-plugin/package.json', JSON.stringify({
    name: 'hexo-flashcard-plugin',
    version: '0.3.0',
  }))
  write(root, 'node_modules/hexo-flashcard-plugin/lib/parser.js', readFileSync(path.join(projectRoot, 'node_modules/hexo-flashcard-plugin/lib/parser.js'), 'utf8'))
  write(root, 'node_modules/hexo-flashcard-plugin/lib/errors.js', readFileSync(path.join(projectRoot, 'node_modules/hexo-flashcard-plugin/lib/errors.js'), 'utf8'))
  write(
    root,
    'node_modules/hexo-butterfly-tag-plugins-plus/index.js',
    `${registeredTags.map(name => `hexo.extend.tag.register('${name}', () => {})`).join('\n')}\n`,
  )
  write(root, 'source/_posts/tags.md', markdown)
}

function createAssetFixture(root, { markdown = '![示例](/img/picgo-images/example.png)\n', image = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x49, 0x45, 0x4e, 0x44]) } = {}) {
  const targetPath = 'source/img/picgo-images/example.png'
  write(root, 'source/_posts/example.md', markdown)
  write(root, targetPath, image)
  write(root, 'tools/hexo-blog/image-migration-map.json', JSON.stringify({
    sourceRepository: 'https://github.com/koco-co/picgo-images',
    sourceCommit: '63bc3eab70de61ff1979e01478b58e2e9f2499df',
    occurrenceCount: 1,
    assetCount: 1,
    totalBytes: Buffer.byteLength(image),
    assets: [{
      sourcePath: 'picgo-images/example.png',
      targetPath,
      bytes: Buffer.byteLength(image),
      sha256: createHash('sha256').update(image).digest('hex'),
      mediaType: 'image/png',
    }],
  }))
}

test.after(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true })
})

test('compareVersions handles the Hexo minimum runtime boundary', () => {
  assert.equal(compareVersions('20.19.0', '20.19.0'), 0)
  assert.equal(compareVersions('25.8.1', '20.19.0'), 1)
  assert.equal(compareVersions('20.18.9', '20.19.0'), -1)
})

test('course contract migration preserves the ledger and removes only the legacy field', () => {
  const root = makeRoot()
  const ledger = {
    schema_version: '1.0',
    capabilities: { cap: { title: '能力' } },
    ledger: { fields: ['disposition', 'target'], items: { cap: ['core', 'Playwright(二)快速开始 / 核心功能'] } },
    summary: { official_capabilities: 1, ledger_entries: 1 },
  }
  const entry = validPlaywrightCoursePost().replace(
    'series: Playwright',
    `learn_topic_capability_ledger: '${JSON.stringify(ledger)}'\nseries: Playwright`,
  )
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', entry)
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', validPlaywrightCoursePost({ number: '二', topic: '快速开始' }))

  execFileSync(process.execPath, [migrationScript, '--root', root, '--apply'])

  const migratedEntry = readFileSync(path.join(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md'), 'utf8')
  const contract = JSON.parse(readFileSync(path.join(root, '.agents/skills/hexo-learn-topic/data/playwright.json'), 'utf8'))
  assert.ok(!migratedEntry.includes('learn_topic_capability_ledger'))
  assert.deepEqual(contract.capability_ledger, ledger)
  assert.deepEqual(contract.course.topics, ['快速开始'])
})

test('content audit allows a pre-build missing abbrlink but blocks release mode', () => {
  const root = makeRoot()
  write(root, 'source/_posts/example.md', validPost())

  const draftReport = auditContent({ root, release: false })
  assert.equal(draftReport.status, 'warning')
  assert.equal(draftReport.errors.length, 0)
  assert.ok(draftReport.warnings.some(item => item.code === 'ABBRLINK_PENDING'))

  const releaseReport = auditContent({ root, release: true })
  assert.equal(releaseReport.status, 'blocked')
  assert.ok(releaseReport.blockers.some(item => item.code === 'ABBRLINK_MISSING'))
})

test('CLI returns a non-zero exit code for warning as well as blocked reports', () => {
  const root = makeRoot()
  write(root, 'source/_posts/example.md', validPost())
  const result = spawnSync(process.execPath, [path.join(projectRoot, '.agents/scripts/audit.mjs'), 'content', '--root', root, '--json'], { encoding: 'utf8' })
  assert.equal(result.status, 2)
  assert.equal(JSON.parse(result.stdout).status, 'warning')
})

test('content and page audits reject impossible or unparseable dates', () => {
  const root = makeRoot()
  write(root, 'source/_posts/example.md', validPost({ abbrlink: 'bad-date' }).replace('2026-08-10 12:00:00', '2026-02-30 12:00:00 # invalid calendar date'))
  write(root, 'source/about/index.md', '---\ntitle: 关于\ndate: not-a-date\n---\n')
  const content = auditContent({ root, release: true })
  const structure = auditStructure({ root })
  assert.ok(content.errors.some(item => item.code === 'FRONT_MATTER_FIELD_INVALID' && item.path === 'source/_posts/example.md'))
  assert.ok(structure.errors.some(item => item.code === 'PAGE_DATE_INVALID' && item.path === 'source/about/index.md'))
})

test('content audit rejects duplicate abbrlinks without exposing front matter values', () => {
  const root = makeRoot()
  write(root, 'source/_posts/one.md', validPost({ abbrlink: 'duplicate', title: '第一篇' }))
  write(root, 'source/_posts/two.md', validPost({ abbrlink: 'duplicate', title: '第二篇' }))

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'blocked')
  assert.ok(report.blockers.some(item => item.code === 'ABBRLINK_DUPLICATE'))
  assert.ok(!formatReport(report).includes('super-secret-value'))
})

test('content audit recursively checks nested learning posts', () => {
  const root = makeRoot()
  write(root, 'source/_posts/root.md', validPost({ abbrlink: 'root123', title: '根文章' }))
  write(root, 'source/_posts/archive/Playwright/01-browser.md', validPost({ abbrlink: 'nested123', title: '嵌套文章' }))

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'pass')
  assert.equal(report.facts.postCount, 2)
  assert.deepEqual(report.facts.checkedFiles, [
    'source/_posts/archive/Playwright/01-browser.md',
    'source/_posts/root.md',
  ])
})

test('content audit blocks empty article bodies and unclosed Markdown fences', () => {
  const root = makeRoot()
  write(root, 'source/_posts/empty.md', validPost({ abbrlink: 'empty' }).replace('\n正文。\n', '\n'))
  write(root, 'source/_posts/fence.md', `${validPost({ abbrlink: 'fence', title: '围栏文章' })}\n\`\`\`js\nconst value = 1\n`)
  const report = auditContent({ root, release: true })
  assert.ok(report.errors.some(item => item.code === 'ARTICLE_BODY_EMPTY' && item.path === 'source/_posts/empty.md'))
  assert.ok(report.errors.some(item => item.code === 'MARKDOWN_FENCE_UNCLOSED' && item.path === 'source/_posts/fence.md'))
})

test('content audit enforces concise non-FAQ headings and ignores code or FAQ headings', () => {
  const root = makeRoot()
  const markdown = `${validPost({ abbrlink: 'heading-style', title: '标题规范' })}\n## 传输层：端点、首部和语义\n\n正文。\n\n### 为什么连接会失败？\n\n解释。\n\n### APIRequestContext\n\n代码对象。\n\n## 常见问题\n\n### 为什么这个问题成立？\n\nFAQ。\n\n## 参考资料\n\n### 官方参考资料分组\n\n资料。\n`
  write(root, 'source/_posts/heading-style.md', markdown)

  const report = auditContent({ root, release: true })
  const issues = report.errors.filter(item => item.code === 'ARTICLE_HEADING_STYLE_INVALID')
  assert.equal(issues.length, 2)
  assert.ok(issues.some(item => item.message.includes('传输层：端点、首部和语义')))
  assert.ok(issues.some(item => item.message.includes('为什么连接会失败？')))
})

test('published course chapters reject internal chapter plans instead of synchronizing them', () => {
  const root = makeRoot()
  const entry = validPlaywrightCoursePost()
  const topic = validPlaywrightCoursePost({ number: '二', topic: '快速开始' }).replace(
    '## 主题内容',
    '正文。\n\n## 章节计划\n\n- H2：旧章节；\n- H2：常见问题；\n- H2：参考资料；\n\n## 主题内容',
  )
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', entry)
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', topic)
  writeCourseContract(root)

  const report = auditContent({ root, release: true })
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_META_HEADING_FORBIDDEN' && item.message.includes('章节计划')))
})

test('release audit rejects published false outside a valid course placeholder', () => {
  const root = makeRoot()
  const target = 'source/_posts/course/Playwright/01-browser.md'
  write(root, target, validPost({ published: false }))

  const placeholderReport = auditContent({ root, release: true })
  assert.equal(placeholderReport.status, 'blocked')
  assert.ok(placeholderReport.errors.some(item => item.code === 'PUBLISHED_FALSE_NOT_COURSE_PLACEHOLDER'))
  assert.ok(placeholderReport.blockers.some(item => item.code === 'ABBRLINK_MISSING'))

  write(root, target, validPost({ published: true }))
  const publishedReport = auditContent({ root, release: true })
  assert.equal(publishedReport.status, 'blocked')
  assert.ok(publishedReport.blockers.some(item => item.code === 'ABBRLINK_MISSING'))
})

test('content audit rejects a non-boolean published value', () => {
  const root = makeRoot()
  const markdown = validPost({ abbrlink: 'typed123' }).replace(
    'date: 2026-08-10 12:00:00',
    'published: "draft"\ndate: 2026-08-10 12:00:00',
  )
  write(root, 'source/_posts/course/Playwright/01-browser.md', markdown)

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'blocked')
  assert.ok(report.errors.some(item => item.code === 'FRONT_MATTER_FIELD_INVALID' && item.message.startsWith('published:')))
})

test('learn-topic course audit enforces naming, publication state, description style and final headings', () => {
  const root = makeRoot()
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', validPlaywrightCoursePost())
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', validPlaywrightCoursePost({
    number: '二',
    topic: '快速开始',
    published: false,
    placeholder: true,
  }))
  writeCourseContract(root)

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'pass')
  assert.equal(report.facts.learnTopicPostCount, 2)
})

test('learn-topic audit accepts a complete unpublished draft while retaining the placeholder marker', () => {
  const root = makeRoot()
  const entry = validPlaywrightCoursePost()
  const draft = validPlaywrightCoursePost({ number: '二', topic: '快速开始', published: false }).replace(
    /正文。\n\n## 主题内容[\s\S]*$/,
    '正文草稿。\n\n## 主题内容\n\n{% note info flat %}\n草稿范围。\n{% endnote %}\n\n{% mermaid %}\nflowchart TD\nA[环境] --> B[命令]\n{% endmermaid %}\n\n## 常见问题\n\n{% flashcard basic id:fixture-draft deck:"Playwright" priority:2 %}\n--- question\n问题。\n--- answer\n回答。\n--- explanation\n解析。\n{% endflashcard %}\n\n## 参考资料\n\n{% linkgroup %}\n{% link Playwright, https://playwright.dev/python/, https://playwright.dev/favicon.ico %}\n{% endlinkgroup %}\n',
  ).replace(
    '{% course_series %}\n\n{% note info flat %}',
    '{% course_series %}\n\n<!-- learn-topic-placeholder -->\n\n{% note info flat %}',
  )
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', entry)
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', draft)
  writeCourseContract(root)

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'pass', JSON.stringify(report.errors))
})

test('learn-topic audit requires a v2 course contract and rejects the legacy ledger field', () => {
  const root = makeRoot()
  const entry = validPlaywrightCoursePost().replace(
    'series: Playwright',
    'learn_topic_capability_ledger: "{}"\nseries: Playwright',
  )
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', entry)
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', validPlaywrightCoursePost({ number: '二', topic: '快速开始' }))

  const missingReport = auditContent({ root, release: true })
  assert.ok(missingReport.errors.some(item => item.code === 'LEARN_TOPIC_CONTRACT_MISSING'))
  assert.ok(missingReport.errors.some(item => item.code === 'LEARN_TOPIC_LEDGER_FRONT_MATTER_FORBIDDEN'))

  writeCourseContract(root, { topics: ['页面定位'] })
  const mismatchReport = auditContent({ root, release: true })
  assert.ok(mismatchReport.errors.some(item => item.code === 'LEARN_TOPIC_CONTRACT_INVALID'))
})

test('learn-topic audit enforces Mermaid containers and flashcards only for a real FAQ', () => {
  const root = makeRoot()
  const entry = validPlaywrightCoursePost()
  const topic = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
    .replace('正文。', '```mermaid\nflowchart LR\nA --> B\n```')
    .replace(/\{% flashcard basic[\s\S]*?\{% endflashcard %\}/, '普通文本问答。')
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', entry)
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', topic)
  writeCourseContract(root)

  const report = auditContent({ root, release: true })
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_MERMAID_FENCE_FORBIDDEN'))
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_FAQ_FLASHCARD_REQUIRED'))
})

test('learn-topic audit requires a visual tag composition for published course正文', () => {
  const root = makeRoot()
  const entry = validPlaywrightCoursePost()
  const topic = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
    .replace(/\{% note info flat %\}[\s\S]*?\{% endnote %\}\n\n/g, '')
    .replace(/\n## 常见问题[\s\S]*?\n## 参考资料/, '\n## 参考资料')
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', entry)
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', topic)
  writeCourseContract(root)

  const report = auditContent({ root, release: true })
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_VISUAL_COMPOSITION_MISSING'))
})

test('learn-topic audit rejects naked explanation blocks and repeated course navigation copy', () => {
  const root = makeRoot()
  const entry = validPlaywrightCoursePost()
  const naked = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
    .replace('{% note info flat %}\n正文。\n{% endnote %}', '这是没有标签承载的解释性正文。')
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', entry)
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', naked)
  writeCourseContract(root)

  const nakedReport = auditContent({ root, release: true })
  assert.ok(nakedReport.errors.some(item => item.code === 'LEARN_TOPIC_PLAIN_BODY_BLOCK'))

  const structuralConnector = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
    .replace('{% note info flat %}\n正文。\n{% endnote %}', '最小示例：\n\n```python\nprint("ok")\n```')
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', structuralConnector)
  const connectorReport = auditContent({ root, release: true })
  assert.ok(!connectorReport.errors.some(item => item.code === 'LEARN_TOPIC_PLAIN_BODY_BLOCK'))

  const disguisedExplanation = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
    .replace('{% note info flat %}\n正文。\n{% endnote %}', 'Playwright 会持续重新查询 Locator，直到条件成立或超时。这不是一次读取结果的普通断言，失败时必须区分定位、等待与业务状态，而且不能用扩大超时掩盖真实原因：\n\n```python\nprint("ok")\n```')
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', disguisedExplanation)
  const disguisedReport = auditContent({ root, release: true })
  assert.ok(disguisedReport.errors.some(item => item.code === 'LEARN_TOPIC_PLAIN_BODY_BLOCK'))

  const navigation = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
    .replace('说明主题机制、示例和边界。', '前置文章是上一篇，本文分配能力为 FIXTURE-001。')
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', navigation)
  const navigationReport = auditContent({ root, release: true })
  assert.ok(navigationReport.errors.some(item => item.code === 'LEARN_TOPIC_NAVIGATION_COPY_FORBIDDEN'))
  assert.ok(navigationReport.errors.some(item => item.code === 'LEARN_TOPIC_LEDGER_COPY_FORBIDDEN'))

  const internalCopy = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
    .replace('说明主题机制、示例和边界。', '文章(七)的实验使用 MOD-001 记录，正文不应暴露这些内部编号。')
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', internalCopy)
  const internalReport = auditContent({ root, release: true })
  assert.ok(internalReport.errors.some(item => item.code === 'LEARN_TOPIC_NAVIGATION_COPY_FORBIDDEN'))
  assert.ok(internalReport.errors.some(item => item.code === 'LEARN_TOPIC_LEDGER_COPY_FORBIDDEN'))

  const tagOnly = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
    .replace('id:fixture-二', 'id:CN-MOD-999')
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', tagOnly)
  const tagOnlyReport = auditContent({ root, release: true })
  assert.ok(!tagOnlyReport.errors.some(item => item.code === 'LEARN_TOPIC_LEDGER_COPY_FORBIDDEN'))
})

test('concept stories exempt only bounded prose and preserve checks outside and inside the story', () => {
  const root = makeRoot()
  const target = 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md'
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', validPlaywrightCoursePost())
  writeCourseContract(root)
  const story = '<!-- concept-story:start -->\n\n守门人按姓名找人，座位换了也能找到。\n\n{% mermaid %}\nflowchart TD\nA[姓名<br/>门牌] --> B[查找]\n{% endmermaid %}\n\n他不再记住一张旧座位表。\n\n<!-- concept-story:end -->'
  const base = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
  const withStory = base.replace('## 主题内容', `## 主题内容\n\n${story}\n\n${story}`)
  write(root, target, withStory)
  assert.equal(auditContent({ root, release: true }).status, 'pass')

  write(root, target, withStory.replace('## 常见问题', '标记外仍然需要语义承载。\n\n## 常见问题'))
  const outside = auditContent({ root, release: true }).errors.find(item => item.code === 'LEARN_TOPIC_PLAIN_BODY_BLOCK')
  assert.equal(outside.path, target)
  assert.match(outside.message, /标记外仍然需要语义承载/)

  write(root, target, withStory.replace('守门人按姓名找人', '前置文章是上一篇，守门人按姓名找人'))
  assert.ok(auditContent({ root, release: true }).errors.some(item => item.code === 'LEARN_TOPIC_NAVIGATION_COPY_FORBIDDEN'))
  write(root, target, withStory.replace('守门人按姓名找人', '/tmp/story-result 是示例路径，守门人按姓名找人'))
  const contractPath = '.agents/skills/hexo-learn-topic/data/playwright.json'
  const contract = JSON.parse(readFileSync(path.join(root, contractPath), 'utf8'))
  contract.course.forbid_local_absolute_paths = true
  write(root, contractPath, JSON.stringify(contract))
  assert.ok(auditContent({ root, release: true }).errors.some(item => item.code === 'LEARN_TOPIC_LOCAL_ABSOLUTE_PATH_FORBIDDEN'))
})

test('concept story boundaries fail closed for malformed, nested, hidden and unclosed regions', () => {
  const root = makeRoot()
  const target = 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md'
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', validPlaywrightCoursePost())
  writeCourseContract(root)
  const start = '<!-- concept-story:start -->'
  const end = '<!-- concept-story:end -->'
  const cases = [
    [`${start}\n故事没有结束。`, 'CONCEPT_STORY_UNCLOSED'],
    [end, 'CONCEPT_STORY_UNEXPECTED_END'],
    [`${start}\n${start}\n故事。\n${end}`, 'CONCEPT_STORY_NESTED'],
    [`${start}\n故事。\n### 新章节\n越界。\n${end}`, 'CONCEPT_STORY_HEADING'],
    [`${start}\n故事标题\n===\n故事。\n${end}`, 'CONCEPT_STORY_HEADING'],
    [`${start}\n${end}`, 'CONCEPT_STORY_EMPTY'],
    [`${start}\n<!--\n故事文字\n-->\n${end}`, 'CONCEPT_STORY_EMPTY'],
    [`${start}\n<details><summary>故事</summary>\n故事文字\n</details>\n${end}`, 'CONCEPT_STORY_HTML'],
    [`<details>\n${start}\n故事文字\n${end}\n</details>`, 'CONCEPT_STORY_HTML'],
    [`${start}\n故事开场。\n{% hideInline 结局,查看 %}\n${end}`, 'CONCEPT_STORY_HIDDEN'],
    [`${start}\n故事开场。\n{% psw 结局 %}\n${end}`, 'CONCEPT_STORY_HIDDEN'],
    [`${start}\n~~~text\n仅有代码。\n~~~\n${end}`, 'CONCEPT_STORY_EMPTY'],
    [`${start}\n{% folding open, 故事 %}\n故事。\n{% endfolding %}\n${end}`, 'CONCEPT_STORY_HIDDEN'],
    [`{% tabs 故事 %}\n${start}\n故事。\n${end}\n{% endtabs %}`, 'CONCEPT_STORY_CONTAINER'],
    [`${start}\n故事。\n{% note info flat %}\n${end}\n{% endnote %}`, 'CONCEPT_STORY_CONTAINER'],
    [`前缀 ${start}\n故事。\n${end}`, 'CONCEPT_STORY_MARKER_INVALID'],
    [`${start}\n故事。\n<!-- concept-story:stop -->`, 'CONCEPT_STORY_MARKER_INVALID'],
  ]
  for (const [fragment, code] of cases) {
    write(root, target, validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
      .replace('## 主题内容', `## 主题内容\n\n${fragment}\n\n仍需检查的普通解释。`))
    const report = auditContent({ root, release: true })
    assert.ok(report.errors.some(item => item.code === code && item.path === target && /第 \d+ 行/.test(item.message)), `${code}: ${JSON.stringify(report.errors)}`)
    assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_PLAIN_BODY_BLOCK'), `invalid region must not exempt prose: ${code}`)
  }
})

test('story markers in fenced code or inline code do not activate an exception', () => {
  const root = makeRoot()
  const target = 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md'
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', validPlaywrightCoursePost())
  writeCourseContract(root)
  const base = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
  for (const fragment of [
    '````markdown\n<!-- concept-story:start -->\n```text\n示例。\n```\n<!-- concept-story:end -->\n````',
    '~~~markdown\n<!-- concept-story:start -->\n<!-- concept-story:end -->\n~~~',
    '{% note info flat %}\n使用 `<!-- concept-story:start -->` 作为示例。\n{% endnote %}',
  ]) {
    write(root, target, base.replace('## 主题内容', `## 主题内容\n\n${fragment}\n\n普通解释不能被示例标记豁免。`))
    const report = auditContent({ root, release: true })
    assert.ok(!report.errors.some(item => item.code.startsWith('CONCEPT_STORY_')), JSON.stringify(report.errors))
    assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_PLAIN_BODY_BLOCK'))
  }
})

test('unpublished course drafts also validate story boundaries', () => {
  const root = makeRoot()
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', validPlaywrightCoursePost())
  writeCourseContract(root)
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md',
    validPlaywrightCoursePost({ number: '二', topic: '快速开始', published: false, placeholder: true })
      .concat('\n<!-- concept-story:start -->\n未完成的叙事。\n'))
  assert.ok(auditContent({ root }).errors.some(item => item.code === 'CONCEPT_STORY_UNCLOSED'))
})

test('learn-topic audit rejects local filesystem absolute paths when the course contract enables the gate', () => {
  const root = makeRoot()
  const entry = validPlaywrightCoursePost()
  const baseTopic = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
  const invalidTopic = baseTopic.replace(
    '说明主题机制、示例和边界。',
    '说明主题机制、示例和边界；不要写死 `/tmp/result.txt`、`/dev/null` 或 `C:\\work\\notes`。',
  )
  const allowedTopic = baseTopic.replace(
    '说明主题机制、示例和边界。',
    '说明主题机制、示例和边界；资源使用 `/img/picgo-images/example.png`，接口使用 `/health`。',
  )
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', entry)
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', invalidTopic)
  writeCourseContract(root)
  const contractPath = '.agents/skills/hexo-learn-topic/data/playwright.json'
  const contract = JSON.parse(readFileSync(path.join(root, contractPath), 'utf8'))
  contract.course.forbid_local_absolute_paths = true
  write(root, contractPath, JSON.stringify(contract))

  const invalidReport = auditContent({ root, release: true })
  assert.equal(invalidReport.status, 'blocked')
  assert.ok(invalidReport.errors.some(item => item.code === 'LEARN_TOPIC_LOCAL_ABSOLUTE_PATH_FORBIDDEN'))

  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', allowedTopic)
  const allowedReport = auditContent({ root, release: true })
  assert.ok(!allowedReport.errors.some(item => item.code === 'LEARN_TOPIC_LOCAL_ABSOLUTE_PATH_FORBIDDEN'))
})

test('learn-topic audit requires published reference card groups and valid HTTP links', () => {
  const missingCardsRoot = makeRoot()
  const markdownReferences = validPlaywrightCoursePost().replace(
    '{% linkgroup %}\n{% link Playwright, https://playwright.dev/python/, https://playwright.dev/favicon.ico %}\n{% endlinkgroup %}',
    '- [Playwright](https://playwright.dev/python/)',
  )
  write(missingCardsRoot, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', markdownReferences)
  writeCourseContract(missingCardsRoot)
  const missingCardsReport = auditContent({ root: missingCardsRoot, release: true })
  assert.ok(missingCardsReport.errors.some(item => item.code === 'LEARN_TOPIC_REFERENCE_TAG_REQUIRED'))
  assert.ok(!missingCardsReport.errors.some(item => item.code === 'LEARN_TOPIC_REFERENCE_LINK_REQUIRED'))

  const invalidLinkRoot = makeRoot()
  const invalidTagReference = validPlaywrightCoursePost().replace(
    '{% linkgroup %}\n{% link Playwright, https://playwright.dev/python/, https://playwright.dev/favicon.ico %}\n{% endlinkgroup %}',
    '{% linkgroup %}\n{% link Playwright, https://, https://playwright.dev/favicon.ico %}\n{% endlinkgroup %}',
  )
  write(invalidLinkRoot, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', invalidTagReference)
  writeCourseContract(invalidLinkRoot)
  const invalidLinkReport = auditContent({ root: invalidLinkRoot, release: true })
  assert.ok(invalidLinkReport.errors.some(item => item.code === 'LEARN_TOPIC_REFERENCE_LINK_INVALID'))

  const validTagRoot = makeRoot()
  const validTagReference = validPlaywrightCoursePost()
  write(validTagRoot, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', validTagReference)
  write(validTagRoot, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', validPlaywrightCoursePost({ number: '二', topic: '快速开始' }))
  writeCourseContract(validTagRoot)
  const validTagReport = auditContent({ root: validTagRoot, release: true })
  assert.equal(validTagReport.status, 'pass', JSON.stringify(validTagReport.errors))
})

test('learn-topic audit rejects default, page and unrelated reference preview images', () => {
  const cases = [
    ['omitted', '{% link Playwright, https://playwright.dev/python/ %}'],
    ['page', '{% link Playwright, https://playwright.dev/python/, https://playwright.dev/python/ %}'],
    ['default', '{% link Playwright, https://playwright.dev/python/, https://example.com/img/avatar.png %}'],
    ['unrelated', '{% link Playwright, https://playwright.dev/python/, https://cdn.example.net/logo.svg %}'],
  ]
  for (const [label, replacement] of cases) {
    const root = makeRoot()
    const markdown = validPlaywrightCoursePost().replace(
      '{% link Playwright, https://playwright.dev/python/, https://playwright.dev/favicon.ico %}',
      replacement,
    )
    write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', markdown)
    writeCourseContract(root)
    const report = auditContent({ root, release: true })
    assert.ok(
      report.errors.some(item => item.code === 'LEARN_TOPIC_REFERENCE_PREVIEW_INVALID'),
      `${label}: ${JSON.stringify(report.errors)}`,
    )
  }
})

test('reference preview lint accepts an official product CDN icon', () => {
  const root = makeRoot()
  const chromeIcon = 'https://www.google.com/chrome/static/images/chrome-logo.svg'
  const article = validPlaywrightCoursePost().replace(
    '{% link Playwright, https://playwright.dev/python/, https://playwright.dev/favicon.ico %}',
    `{% link Chrome DevTools, https://developer.chrome.com/docs/devtools/network/, ${chromeIcon} %}`,
  )
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', article)
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', validPlaywrightCoursePost({ number: '二', topic: '快速开始' }))
  writeCourseContract(root)
  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'pass', JSON.stringify(report.errors))
})

test('repository content audit applies reference preview lint outside learn-topic', () => {
  const root = makeRoot()
  const article = validPost({ abbrlink: 'reference-preview' }).replace(
    '正文。',
    '## 参考资料\n\n{% linkgroup %}\n{% link 官方资料, https://example.com/docs, https://example.com/img/avatar.png %}\n{% endlinkgroup %}\n',
  )
  write(root, 'source/_posts/reference-preview.md', article)
  const report = auditContent({ root, release: true })
  assert.ok(report.errors.some(item => item.code === 'REFERENCE_PREVIEW_INVALID'))
})

test('learn-topic audit rejects internal planning fields and navigation cards', () => {
  const root = makeRoot()
  const entry = validPlaywrightCoursePost().replace(
    'series: Playwright',
    'learn_topic_capabilities: [fixture]\nseries: Playwright',
  )
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', entry)
  writeCourseContract(root)
  const fieldReport = auditContent({ root, release: true })
  assert.ok(fieldReport.errors.some(item => item.code === 'LEARN_TOPIC_INTERNAL_FRONT_MATTER_FORBIDDEN'))

  const topic = validPlaywrightCoursePost({ number: '二', topic: '快速开始' }).replace(
    '问题。',
    '课程应该从哪一篇开始，进阶路线会不会阻塞项目实战？',
  )
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', topic)
  writeCourseContract(root, { topics: ['快速开始'] })
  const cardReport = auditContent({ root, release: true })
  assert.ok(cardReport.errors.some(item => item.code === 'LEARN_TOPIC_NAVIGATION_CARD_FORBIDDEN'))
})

test('learn-topic audit blocks a capability ledger that is not closed', () => {
  const root = makeRoot()
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', validPlaywrightCoursePost())
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', validPlaywrightCoursePost({ number: '二', topic: '快速开始' }))
  writeCourseContract(root)
  const contractPath = '.agents/skills/hexo-learn-topic/data/playwright.json'
  const contract = JSON.parse(readFileSync(path.join(root, contractPath), 'utf8'))
  contract.capability_ledger.summary.official_only = 1
  write(root, contractPath, JSON.stringify(contract))

  const report = auditContent({ root, release: true })
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_LEDGER_INVALID' && item.path === contractPath))
})

test('learn-topic ledger requires article assignments except for excluded capabilities', () => {
  const root = makeRoot()
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', validPlaywrightCoursePost())
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', validPlaywrightCoursePost({ number: '二', topic: '快速开始' }))
  writeCourseContract(root)
  const contractPath = '.agents/skills/hexo-learn-topic/data/playwright.json'
  const contract = JSON.parse(readFileSync(path.join(root, contractPath), 'utf8'))
  contract.capability_ledger.ledger.items['fixture-capability'][1] = null
  write(root, contractPath, JSON.stringify(contract))
  assert.ok(auditContent({ root, release: true }).errors.some(item => item.code === 'LEARN_TOPIC_LEDGER_INVALID'))

  contract.capability_ledger.ledger.items['fixture-capability'][0] = 'excluded'
  contract.capability_ledger.ledger.items['fixture-capability'][1] = 'Playwright(二)快速开始 / 核心功能'
  write(root, contractPath, JSON.stringify(contract))
  assert.ok(auditContent({ root, release: true }).errors.some(item => item.code === 'LEARN_TOPIC_LEDGER_INVALID'))
})

test('compressed ledger blocks invalid article indexes and source manifest count drift', () => {
  const root = makeRoot()
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', validPlaywrightCoursePost())
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', validPlaywrightCoursePost({ number: '二', topic: '快速开始' }))
  writeCourseContract(root)
  const contractPath = '.agents/skills/hexo-learn-topic/data/playwright.json'
  const contract = JSON.parse(readFileSync(path.join(root, contractPath), 'utf8'))
  contract.capability_ledger = {
    schema_version: 1,
    codec: { row_fields: ['stableId', 'disposition', 'mainArticle'] },
    dictionaries: { disposition: ['核心详解'], mainArticle: ['Playwright(二)快速开始'] },
    current: [['fixture-capability', 0, 7]],
    manifest: [{ count: 2 }],
    sources: [],
    summary: { universeCount: 1, ledgerCount: 1, officialOnly: 0, ledgerOnly: 0, duplicates: 0, unassigned: 0 },
  }
  write(root, contractPath, JSON.stringify(contract))
  const messages = auditContent({ root, release: true }).errors.filter(item => item.code === 'LEARN_TOPIC_LEDGER_INVALID').map(item => item.message)
  assert.ok(messages.some(message => message.includes('文章字典')))
  assert.ok(messages.some(message => message.includes('来源清单')))
})

test('learn-topic ledger requires its dialect schema and source manifest', () => {
  const root = makeRoot()
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', validPlaywrightCoursePost())
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', validPlaywrightCoursePost({ number: '二', topic: '快速开始' }))
  writeCourseContract(root)
  const contractPath = '.agents/skills/hexo-learn-topic/data/playwright.json'
  const contract = JSON.parse(readFileSync(path.join(root, contractPath), 'utf8'))
  delete contract.capability_ledger.schema_version
  delete contract.capability_ledger.source_manifest
  write(root, contractPath, JSON.stringify(contract))
  const messages = auditContent({ root, release: true }).errors.filter(item => item.code === 'LEARN_TOPIC_LEDGER_INVALID').map(item => item.message)
  assert.ok(messages.some(message => message.includes('schema_version')))
  assert.ok(messages.some(message => message.includes('source_manifest')))
})

test('course contract template renders into a contract accepted by course lint', () => {
  const root = makeRoot()
  const replacements = new Map([
    ['{{主题路径段}}', 'playwright'], ['{{主题系列名}}', 'Playwright'],
    ['{{第一轮学习主题一}}', '快速开始'], ['{{第一轮学习主题二}}', '页面定位'],
    ['{{能力稳定ID}}', 'fixture-capability'], ['{{能力名称}}', '基础能力'],
    ['{{目标章节}}', '核心功能'], ['{{纳入理由}}', '课程基础'], ['{{核验状态}}', 'verified'],
  ])
  let template = readFileSync(path.join(projectRoot, '.agents/skills/hexo-learn-topic/templates/course-contract.template.json'), 'utf8')
  for (const [token, value] of replacements) template = template.replaceAll(token, value)
  write(root, '.agents/skills/hexo-learn-topic/data/playwright.json', template)
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', validPlaywrightCoursePost())
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', validPlaywrightCoursePost({ number: '二', topic: '快速开始' }))
  write(root, 'source/_posts/learn-topic/playwright/Playwright(三)页面定位.md', validPlaywrightCoursePost({ number: '三', topic: '页面定位' }))
  assert.equal(auditContent({ root, release: true }).status, 'pass')
})

test('learn-topic course audit rejects the legacy document prefix and route names', () => {
  const root = makeRoot()
  const legacyEntry = validPlaywrightCoursePost()
    .replace('title: Playwright(一)入门路线', 'title: Playwright文档(一) 学习路线')
  write(root, 'source/_posts/learn-topic/playwright/Playwright文档(一)学习路线.md', legacyEntry)
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)进阶内容.md', validPlaywrightCoursePost({
    number: '二',
    topic: '进阶内容',
  }))
  write(root, 'source/_posts/learn-topic/fastapi/FastAPI(一)快速开始.md', validPlaywrightCoursePost({
    topic: '快速开始',
  }).replaceAll('Playwright', 'FastAPI'))

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'blocked')
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_FILENAME_INVALID'))
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_TITLE_INVALID'))
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_ADVANCED_ROUTE_INVALID'))
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_ENTRY_ROUTE_INVALID'))
})

test('learn-topic course audit enforces stable series order and course navigation', () => {
  const root = makeRoot()
  const invalid = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
    .replace('series_order: 2', 'series_order: 7')
    .replace('{% course_series %}', '{% series %}')
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', invalid)

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'blocked')
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_SERIES_ORDER_MISMATCH'))
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_COURSE_SERIES_MISSING'))
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_BUILTIN_SERIES_USED'))
})

test('learn-topic course audit ignores series examples inside fenced code', () => {
  const root = makeRoot()
  const markdown = validPlaywrightCoursePost()
    .replace('正文。', '```markdown\n{% series %}\n{% course_series %}\n```\n\n正文。')
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', markdown)
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', validPlaywrightCoursePost({ number: '二', topic: '快速开始' }))
  writeCourseContract(root)

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'pass')
})

test('learn-topic course audit rejects legacy path and public-copy violations', () => {
  const root = makeRoot()
  write(root, 'source/_posts/learn/playwright-python/00-route.md', validPost({ abbrlink: 'legacy' }))
  const invalid = validPlaywrightCoursePost({ description: '>-' })
    .replace('description: >-', 'description: >-\n  多行描述。')
    .replace('## 参考资料', '## 来源')
    .replace('## 课程目标', '核验于 2026-08-24。\n\n## 课程目标')
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', invalid)

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'blocked')
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_LEGACY_PATH'))
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_DESCRIPTION_BLOCK'))
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_SOURCE_HEADING'))
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_VERIFICATION_COPY'))
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_ENTRY_HEADINGS_INVALID'))
})

test('learn-topic audit rejects quoted and plain descriptions that span physical lines', () => {
  const root = makeRoot()
  const quoted = validPlaywrightCoursePost()
    .replace('description: 按知识顺序学习 Playwright Python。', 'description: "跨越\n  两个物理行的描述"')
    .replace('abbrlink: pw一', 'abbrlink: quoted-description')
  const plain = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
    .replace('description: 按知识顺序学习 Playwright Python。', 'description: 跨越\n  两个物理行的描述')
    .replace('abbrlink: pw二', 'abbrlink: plain-description')
  write(root, 'source/_posts/learn-topic/playwright/Playwright(一)入门路线.md', quoted)
  write(root, 'source/_posts/learn-topic/playwright/Playwright(二)快速开始.md', plain)

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'blocked')
  assert.equal(report.errors.filter(item => item.code === 'LEARN_TOPIC_DESCRIPTION_BLOCK').length, 2)
})

test('learn-topic audit applies the same contract to non-Playwright courses', () => {
  const root = makeRoot()
  const markdown = validPlaywrightCoursePost()
    .replaceAll('Playwright', 'FastAPI')
    .replace('abbrlink: pw一', 'abbrlink: fastapi-one')
  write(root, 'source/_posts/learn-topic/fastapi/FastAPI(一)入门路线.md', markdown)
  const topic = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
    .replaceAll('Playwright', 'FastAPI')
    .replace('abbrlink: pw二', 'abbrlink: fastapi-two')
  write(root, 'source/_posts/learn-topic/fastapi/FastAPI(二)快速开始.md', topic)
  writeCourseContract(root, { slug: 'fastapi', series: 'FastAPI' })

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'pass')
  assert.equal(report.facts.learnTopicPostCount, 2)
})

test('learn-topic audit rejects nested paths and validates each course sequence independently', () => {
  const root = makeRoot()
  write(root, 'source/_posts/learn-topic/playwright/nested/Playwright(一)入门路线.md', validPlaywrightCoursePost())
  const fastApi = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
    .replaceAll('Playwright', 'FastAPI')
    .replace('abbrlink: pw二', 'abbrlink: fastapi-two')
  write(root, 'source/_posts/learn-topic/fastapi/FastAPI(二)快速开始.md', fastApi)

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'blocked')
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_PATH_INVALID'))
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_SEQUENCE_INVALID' && item.path.endsWith('/fastapi')))
})

test('asset audit verifies migrated bytes and separates rendered references from tutorial examples', () => {
  const root = makeRoot()
  createAssetFixture(root, {
    markdown: [
      '![本地图片](/img/picgo-images/example.png)',
      '',
      '```markdown',
      '![旧图床示例](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/example.png)',
      '```',
      '',
    ].join('\n'),
  })

  const report = auditAssets({ root })
  assert.equal(report.status, 'pass')
  assert.equal(report.facts.verifiedAssetCount, 1)
  assert.equal(report.facts.liveOldHostReferenceCount, 0)
  assert.equal(report.facts.tutorialOldHostExampleCount, 1)
  assert.equal(report.facts.localImageReferenceCount, 1)
})

test('asset audit does not treat remote tag icons as missing local images', () => {
  const root = makeRoot()
  createAssetFixture(root, {
    markdown: [
      "{% link Playwright, https://playwright.dev/python/docs/intro, https://playwright.dev/img/playwright-logo.svg %}",
      "{% link pytest, https://docs.pytest.org/, //docs.pytest.org/en/stable/_static/favicon.png %}",
      '',
    ].join('\n'),
  })

  const report = auditAssets({ root })
  assert.equal(report.status, 'pass')
  assert.equal(report.facts.localImageReferenceCount, 0)
  assert.ok(!report.errors.some(item => item.code === 'LOCAL_IMAGE_MISSING'))
})

test('asset audit blocks a live old-host image without treating plain tutorial text as rendered', () => {
  const root = makeRoot()
  createAssetFixture(root, {
    markdown: [
      '![仍在渲染](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/example.png)',
      '',
      '`https://cdn.jsdelivr.net/gh/koco-co/picgo-images@main/picgo-images/example.png`',
      '',
    ].join('\n'),
  })

  const report = auditAssets({ root })
  assert.equal(report.status, 'blocked')
  assert.equal(report.facts.liveOldHostReferenceCount, 1)
  assert.equal(report.facts.tutorialOldHostExampleCount, 1)
  assert.ok(report.errors.some(item => item.code === 'OLD_IMAGE_HOST_LIVE_REFERENCE'))
})

test('asset audit detects image URLs in a multiline Butterfly tag', () => {
  const root = makeRoot()
  createAssetFixture(root, {
    markdown: [
      "{% galleryGroup '动漫' '说明' '",
      "/wallpaper/anime' https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/example.png %}",
      '',
    ].join('\n'),
  })

  const report = auditAssets({ root })
  assert.equal(report.status, 'blocked')
  assert.equal(report.facts.liveOldHostReferenceCount, 1)
  assert.ok(report.errors.some(item => item.code === 'OLD_IMAGE_HOST_LIVE_REFERENCE'))
})

test('asset audit blocks missing local images and migrated-byte drift', () => {
  const root = makeRoot()
  createAssetFixture(root, { markdown: '![缺失图片](/img/missing.png)\n' })
  write(root, 'source/img/picgo-images/example.png', 'changed')

  const report = auditAssets({ root })
  assert.equal(report.status, 'blocked')
  assert.ok(report.errors.some(item => item.code === 'MIGRATED_IMAGE_SIZE_MISMATCH'))
  assert.ok(report.errors.some(item => item.code === 'LOCAL_IMAGE_MISSING'))
})

test('project audit reports schema, CI and injected-asset drift while redacting secrets', () => {
  const root = makeRoot()
  createProjectFixture(root)

  const report = auditProject({ root })
  const rendered = formatReport(report)

  assert.equal(report.status, 'warning')
  assert.ok(report.warnings.some(item => item.code === 'SCAFFOLD_SCHEMA_DRIFT'))
  assert.ok(report.warnings.some(item => item.code === 'CI_NODE_INCOMPATIBLE'))
  assert.ok(report.warnings.some(item => item.code === 'INJECTED_ASSET_MISSING'))
  assert.ok(report.facts.sensitiveKeyLocations.some(item => item.identifier === 'apikey'))
  assert.ok(!rendered.includes('super-secret-value'))
  assert.ok(!rendered.includes('do-not-print-this'))
  assert.ok(!rendered.includes('user:secret'))
  assert.ok(!rendered.includes('token=hidden'))
})

test('release audit blocks a dirty deployment worktree', () => {
  const root = makeRoot()
  createProjectFixture(root)
  const deployRoot = path.join(root, '.deploy_git')
  mkdirSync(deployRoot, { recursive: true })
  execFileSync('git', ['init', '-q', deployRoot])
  write(root, '.deploy_git/untracked.html', '<p>dirty</p>\n')

  const report = auditRelease({ root, route: 'local' })
  assert.equal(report.status, 'blocked')
  assert.ok(report.blockers.some(item => item.code === 'DEPLOY_WORKTREE_DIRTY'))
})

test('CI release keeps local deployment worktree drift as a warning, not a blocker', () => {
  const root = makeRoot()
  createProjectFixture(root)
  const deployRoot = path.join(root, '.deploy_git')
  mkdirSync(deployRoot, { recursive: true })
  execFileSync('git', ['init', '-q', deployRoot])
  write(root, '.deploy_git/untracked.html', '<p>local-only drift</p>\n')

  const report = auditRelease({ root, route: 'ci' })
  assert.ok(report.warnings.some(item => item.code === 'DEPLOY_WORKTREE_DIRTY'))
  assert.ok(!report.blockers.some(item => item.code === 'DEPLOY_WORKTREE_DIRTY'))
})

test('local release blocks when the theme is not a verifiable Git worktree', () => {
  const root = makeRoot()
  createProjectFixture(root)

  const report = auditRelease({ root, route: 'local' })
  assert.ok(report.blockers.some(item => item.code === 'THEME_NOT_GIT'))
  assert.ok(!report.warnings.some(item => item.code === 'THEME_NOT_GIT'))
})

test('tag plugin audit inventories the installed registry and balanced containers', () => {
  const root = makeRoot()
  createTagPluginFixture(root, {
    markdown: '{% btns rounded %}\n{% cell 文档, https://example.com %}\n{% endbtns %}\n',
  })

  const report = auditTags({ root })
  assert.equal(report.status, 'pass')
  assert.equal(report.facts.plugin.installedVersion, '1.0.18')
  assert.equal(report.facts.plugin.enabled, true)
  assert.equal(report.facts.plugin.registeredTags.length, 35)
  assert.ok(report.facts.plugin.containerTags.includes('btns'))
  assert.equal(report.facts.flashcardPlugin.installedVersion, '0.3.0')
  assert.equal(report.facts.flashcardPlugin.path, 'learn-topic')
  assert.equal(report.facts.usage.tagCounts.btns, 1)
})

test('tag plugin audit blocks disabled issues capability when content uses it', () => {
  const root = makeRoot()
  createTagPluginFixture(root, {
    issues: false,
    markdown: '{% issues sites | api=https://example.com/issues %}\n',
  })

  const report = auditTags({ root })
  assert.equal(report.status, 'blocked')
  assert.ok(report.errors.some(item => item.code === 'TAG_CAPABILITY_DISABLED'))
})

test('tag plugin audit rejects tags that are not registered in the current project', () => {
  const root = makeRoot()
  createTagPluginFixture(root, {
    markdown: '{% invented_widget demo %}\n',
  })

  const report = auditTags({ root })
  assert.equal(report.status, 'blocked')
  assert.ok(report.errors.some(item => item.code === 'TAG_UNREGISTERED' && item.path === 'source/_posts/tags.md'))
})

test('tag registry ignores registrations in package files unreachable from the loaded entry', () => {
  const root = makeRoot()
  createTagPluginFixture(root, { markdown: '{% dead_widget demo %}\n' })
  write(root, 'node_modules/hexo-butterfly-tag-plugins-plus/test/dead.js', "hexo.extend.tag.register('dead_widget', () => {})\n")
  const report = auditTags({ root })
  assert.ok(report.errors.some(item => item.code === 'TAG_UNREGISTERED' && item.message.includes('dead_widget')))
})

test('tag lint invokes the installed flashcard parser for fields, IDs and references', () => {
  const root = makeRoot()
  createTagPluginFixture(root, {
    markdown: '{% flashcard basic id:bad-card deck:"Fixture" priority:9 %}\n--- question\n问题\n--- answer\n回答\n--- explanation\n解析\n{% endflashcard %}\n',
  })
  const report = auditTags({ root })
  assert.ok(report.errors.some(item => item.code === 'FLASHCARD_CONTENT_INVALID' && item.path === 'source/_posts/tags.md'))
})

test('tag lint blocks duplicate flashcard IDs and references to missing cards', () => {
  const card = '{% flashcard basic id:shared-card deck:"Fixture" priority:2 %}\n--- question\n问题\n--- answer\n回答\n--- explanation\n解析\n{% endflashcard %}\n'
  const duplicateRoot = makeRoot()
  createTagPluginFixture(duplicateRoot, { markdown: card })
  write(duplicateRoot, 'source/_posts/duplicate.md', card)
  const duplicateReport = auditTags({ root: duplicateRoot })
  assert.ok(duplicateReport.errors.some(item => item.code === 'FLASHCARD_CONTENT_INVALID' && item.message.includes('duplicates')))

  const referenceRoot = makeRoot()
  createTagPluginFixture(referenceRoot, { markdown: '{% flashcard_ref id:missing-card %}\n' })
  const referenceReport = auditTags({ root: referenceRoot })
  assert.ok(referenceReport.errors.some(item => item.code === 'FLASHCARD_CONTENT_INVALID' && item.message.includes('does not exist')))
})

test('tag plugin audit rejects an unclosed container with a source line', () => {
  const root = makeRoot()
  createTagPluginFixture(root, {
    markdown: '正文。\n\n{% folding blue, 详情 %}\n没有结束标签。\n',
  })

  const report = auditTags({ root })
  assert.equal(report.status, 'blocked')
  const error = report.errors.find(item => item.code === 'TAG_CONTAINER_UNCLOSED')
  assert.equal(error?.path, 'source/_posts/tags.md')
  assert.match(error?.message ?? '', /第 3 行/)
})

test('tag plugin audit blocks disabled plugin configuration', () => {
  const root = makeRoot()
  createTagPluginFixture(root, { enable: false })

  const report = auditTags({ root })
  assert.equal(report.status, 'blocked')
  assert.ok(report.errors.some(item => item.code === 'TAG_PLUGIN_DISABLED'))
})

test('tag plugin audit detects registry drift from the documented baseline', () => {
  const root = makeRoot()
  createTagPluginFixture(root, {
    registeredTags: TAG_PLUGIN_PLUS_TAGS.filter(name => name !== 'carousel'),
  })

  const report = auditTags({ root })
  assert.equal(report.status, 'blocked')
  assert.ok(report.errors.some(item => item.code === 'TAG_PLUGIN_REGISTRATION_MISSING'))
})

test('tag plugin reference names every registered baseline capability', () => {
  const reference = readFileSync(
    path.join(projectRoot, '.agents/skills/hexo-blog-maintenance/references/butterfly-tag-plugins-plus.md'),
    'utf8',
  )

  for (const name of TAG_PLUGIN_PLUS_TAGS) {
    assert.ok(reference.includes(`\`${name}\``), `missing documented tag: ${name}`)
  }
})

test('repository structure audit rejects temporary source artifacts with an exact path', () => {
  const root = makeRoot()
  write(root, 'source/_posts/example.md', validPost({ abbrlink: 'structure' }))
  write(root, 'source/_posts/.DS_Store', 'metadata')
  write(root, 'source/img/example.png', 'image')
  write(root, 'source/css/custom.css', 'body {}')
  write(root, 'source/js/custom.js', 'void 0')
  write(root, '.agents/skills/hexo-learn-topic/data/example.json', '{}')
  write(root, '.agents/scripts/audit.mjs', '')
  write(root, '.agents/scripts/audit.test.mjs', '')
  write(root, 'tools/hexo-blog/image-migration-map.json', '{}')

  const report = auditStructure({ root })
  assert.equal(report.status, 'blocked')
  assert.ok(report.errors.some(item => item.code === 'REPOSITORY_ARTIFACT_FORBIDDEN' && item.path === 'source/_posts/.DS_Store'))
})

test('repository structure audit covers forbidden artifacts outside source', () => {
  const root = makeRoot()
  write(root, '.agents/skills/example/.DS_Store', 'metadata')
  const report = auditStructure({ root })
  assert.ok(report.errors.some(item => item.code === 'REPOSITORY_ARTIFACT_FORBIDDEN' && item.path === '.agents/skills/example/.DS_Store'))
})

test('config audit blocks JSON, YAML, package-lock and installed-dependency drift', () => {
  const root = makeRoot()
  write(root, 'package.json', JSON.stringify({
    private: true,
    scripts: { build: 'hexo generate', clean: 'hexo clean', deploy: 'hexo deploy', server: 'hexo server' },
    dependencies: { hexo: '^8.0.0' },
  }))
  write(root, 'package-lock.json', JSON.stringify({ packages: { '': { dependencies: {} } } }))
  write(root, '_config.yml', 'url: https://example.com\ntheme: butterfly\ntimezone: Asia/Shanghai\n')
  write(root, '_config.butterfly.yml', 'broken: [\n')
  write(root, 'themes/butterfly/README.md', 'theme')
  write(root, '.agents/invalid.json', '{')
  const report = auditConfig({ root })
  assert.ok(report.errors.some(item => item.code === 'JSON_PARSE_FAILED' && item.path === '.agents/invalid.json'))
  assert.ok(report.errors.some(item => item.code === 'YAML_PARSE_FAILED' && item.path === '_config.butterfly.yml'))
  assert.ok(report.errors.some(item => item.code === 'PACKAGE_LOCK_DEPENDENCY_DRIFT'))
  assert.ok(report.errors.some(item => item.code === 'DEPENDENCY_NOT_INSTALLED'))
})

test('config audit compares dependency maps without depending on key order', () => {
  const root = makeRoot()
  write(root, 'package.json', JSON.stringify({
    private: true,
    scripts: { build: 'hexo generate', clean: 'hexo clean', deploy: 'hexo deploy', server: 'hexo server' },
    dependencies: { hexo: '^8.0.0', 'js-yaml': '^4.1.0' },
  }))
  write(root, 'package-lock.json', JSON.stringify({ packages: { '': { dependencies: { 'js-yaml': '^4.1.0', hexo: '^8.0.0' } } } }))
  write(root, 'node_modules/hexo/package.json', JSON.stringify({ name: 'hexo' }))
  write(root, 'node_modules/js-yaml/package.json', JSON.stringify({ name: 'js-yaml' }))
  write(root, '_config.yml', 'url: https://example.com\ntheme: butterfly\ntimezone: Asia/Shanghai\n')
  write(root, 'themes/butterfly/README.md', 'theme')

  const report = auditConfig({ root })
  assert.ok(!report.errors.some(item => item.code === 'PACKAGE_LOCK_DEPENDENCY_DRIFT'))
})

test('config audit excludes the generated root db.json file', () => {
  const root = makeRoot()
  write(root, 'db.json', '{ generated file may be incomplete')
  write(root, '_config.yml', 'url: https://example.com\ntheme: butterfly\ntimezone: Asia/Shanghai\n')
  write(root, 'themes/butterfly/README.md', 'theme')

  const report = auditConfig({ root })
  assert.ok(!report.errors.some(item => item.code === 'JSON_PARSE_FAILED' && item.path === 'db.json'))
  assert.equal(report.facts.jsonFileCount, 0)
})

test('code audit checks JavaScript, CSS and Shell syntax with exact paths', () => {
  const root = makeRoot()
  write(root, 'source/js/bad.js', 'const = 1\n')
  write(root, 'source/css/bad.css', '.card { color: red;\n')
  write(root, 'source/css/bad-declaration.css', '.card { color red; }\n')
  write(root, 'source/css/bad-function.css', '.card { color: rgb(1, 2; }\n')
  write(root, 'broken.sh', 'if true; then\n')
  const report = auditCode({ root })
  assert.ok(report.errors.some(item => item.code === 'JAVASCRIPT_SYNTAX_INVALID' && item.path === 'source/js/bad.js'))
  assert.ok(report.errors.some(item => item.code === 'CSS_SYNTAX_INVALID' && item.path === 'source/css/bad.css'))
  assert.ok(report.errors.some(item => item.code === 'CSS_SYNTAX_INVALID' && item.path === 'source/css/bad-declaration.css'))
  assert.ok(report.errors.some(item => item.code === 'CSS_SYNTAX_INVALID' && item.path === 'source/css/bad-function.css'))
  assert.ok(report.errors.some(item => item.code === 'SHELL_SYNTAX_INVALID' && item.path === 'broken.sh'))
})

test('skill audit checks project instruction links, mirrors, front matter and resource references', () => {
  const root = makeRoot()
  write(root, 'AGENTS.md', '# Rules\n')
  symlinkSync('AGENTS.md', path.join(root, 'CLAUDE.md'))
  write(root, '.agents/skills/example/SKILL.md', '---\nname: wrong\ndescription: ""\n---\n\n读取 `workflows/§01-run.md`。\n')
  write(root, '.agents/skills/example/rules/guide.md', '继续读取 `data/missing.json`。\n')
  write(root, '.claude/skills/example', 'not a symlink')
  const report = auditSkills({ root })
  assert.ok(report.errors.some(item => item.code === 'SKILL_NAME_MISMATCH'))
  assert.ok(report.errors.some(item => item.code === 'SKILL_DESCRIPTION_MISSING'))
  assert.ok(report.errors.some(item => item.code === 'SKILL_REFERENCE_MISSING'))
  assert.ok(report.errors.some(item => item.code === 'SKILL_REFERENCE_MISSING' && item.path === '.agents/skills/example/rules/guide.md'))
  assert.ok(report.errors.some(item => item.code === 'SKILL_MIRROR_INVALID'))
})

test('documentation audit blocks broken repository-local Markdown links', () => {
  const root = makeRoot()
  write(root, 'README.md', '[missing](docs/missing.md)\n')
  const report = auditDocs({ root })
  assert.ok(report.errors.some(item => item.code === 'MARKDOWN_LOCAL_LINK_MISSING' && item.path === 'README.md'))
})

test('asset audit rejects image extensions that disagree with file signatures', () => {
  const root = makeRoot()
  createAssetFixture(root)
  write(root, 'source/img/picgo-images/fake.png', Buffer.from([0xff, 0xd8, 0xff, 0x00]))
  const report = auditAssets({ root })
  assert.ok(report.errors.some(item => item.code === 'IMAGE_FILE_INVALID' && item.path === 'source/img/picgo-images/fake.png'))
})

test('asset audit cross-checks manifest mediaType against extension and signature', () => {
  const root = makeRoot()
  createAssetFixture(root)
  const manifestPath = path.join(root, 'tools/hexo-blog/image-migration-map.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  manifest.assets[0].mediaType = 'image/jpeg'
  write(root, 'tools/hexo-blog/image-migration-map.json', JSON.stringify(manifest))

  const report = auditAssets({ root })
  assert.ok(report.errors.some(item => item.code === 'MIGRATED_IMAGE_MEDIA_TYPE_MISMATCH' && item.path === 'source/img/picgo-images/example.png'))
})

test('asset audit checks rendered image references in site configuration', () => {
  const root = makeRoot()
  createAssetFixture(root)
  write(root, '_config.butterfly.yml', 'cover: https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/example.png\nfallback: /img/missing.png\n')
  const report = auditAssets({ root })
  assert.ok(report.errors.some(item => item.code === 'OLD_IMAGE_HOST_RENDERED_SOURCE' && item.path === '_config.butterfly.yml'))
  assert.ok(report.errors.some(item => item.code === 'LOCAL_IMAGE_MISSING' && item.path === '_config.butterfly.yml'))
})

test('canonical repository lint passes for the current Hexo workspace', () => {
  const report = auditLint({ root: projectRoot })
  assert.equal(report.status, 'pass', formatReport(report))
})
