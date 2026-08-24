import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  auditAssets,
  auditContent,
  auditProject,
  auditRelease,
  auditTags,
  compareVersions,
  formatReport,
} from './audit.mjs'

const temporaryRoots = []
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

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
  writeFileSync(target, content, 'utf8')
}

function validPost({ abbrlink = '', title = '示例文章', published } = {}) {
  const linkLine = abbrlink ? `abbrlink: ${abbrlink}\n` : ''
  const publishedLine = published === undefined ? '' : `published: ${published}\n`
  return `---\ntitle: ${title}\ntags:\n  - Hexo\ncategories:\n  - 文档\ndescription: 用于校验的文章。\n${linkLine}${publishedLine}date: 2026-08-10 12:00:00\n---\n\n正文。\n`
}

function validPlaywrightCoursePost({ number = '一', topic = '学习路线', published = true, placeholder = false, description = '按知识顺序学习 Playwright Python。' } = {}) {
  const placeholderContract = placeholder
    ? '<!-- learn-topic-placeholder -->\n\n## 本文职责\n\n说明本文职责。\n\n## 正文大纲\n\n列出正文大纲。\n\n'
    : ''
  const order = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'].indexOf(number) + 1
  return `---\ntitle: Playwright文档(${number}) ${topic}\ntags:\n  - Playwright\ncategories:\n  - Learn Topic\n  - Playwright\ndescription: ${description}\nseries: Playwright\nseries_order: ${order}\nabbrlink: pw${number}\npublished: ${published}\ndate: 2026-08-24 12:00:00\n---\n\n{% course_series %}\n\n${placeholderContract}正文。\n\n## 常见问题\n\n问题。\n\n## 参考资料\n\n- [Playwright](https://playwright.dev/python/)\n`
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
  write(
    root,
    'node_modules/hexo-butterfly-tag-plugins-plus/index.js',
    `${registeredTags.map(name => `hexo.extend.tag.register('${name}', () => {})`).join('\n')}\n`,
  )
  write(root, 'source/_posts/tags.md', markdown)
}

function createAssetFixture(root, { markdown = '![示例](/img/picgo-images/example.png)\n', image = 'image-bytes' } = {}) {
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
  write(root, 'source/_posts/root.md', validPost({ abbrlink: 'root123' }))
  write(root, 'source/_posts/archive/Playwright/01-browser.md', validPost({ abbrlink: 'nested123' }))

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'pass')
  assert.equal(report.facts.postCount, 2)
  assert.deepEqual(report.facts.checkedFiles, [
    'source/_posts/archive/Playwright/01-browser.md',
    'source/_posts/root.md',
  ])
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
  write(root, 'source/_posts/learn-topic/playwright/Playwright文档(一)学习路线.md', validPlaywrightCoursePost())
  write(root, 'source/_posts/learn-topic/playwright/Playwright文档(二)快速开始.md', validPlaywrightCoursePost({
    number: '二',
    topic: '快速开始',
    published: false,
    placeholder: true,
  }))

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'pass')
  assert.equal(report.facts.learnTopicPostCount, 2)
})

test('learn-topic course audit enforces stable series order and course navigation', () => {
  const root = makeRoot()
  const invalid = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
    .replace('series_order: 2', 'series_order: 7')
    .replace('{% course_series %}', '{% series %}')
  write(root, 'source/_posts/learn-topic/playwright/Playwright文档(二)快速开始.md', invalid)

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
  write(root, 'source/_posts/learn-topic/playwright/Playwright文档(一)学习路线.md', markdown)

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'pass')
})

test('learn-topic course audit rejects legacy path and public-copy violations', () => {
  const root = makeRoot()
  write(root, 'source/_posts/learn/playwright-python/00-route.md', validPost({ abbrlink: 'legacy' }))
  const invalid = validPlaywrightCoursePost({ description: '>-' })
    .replace('description: >-', 'description: >-\n  多行描述。')
    .replace('## 常见问题', '## 来源')
    .replace('## 参考资料', '## 结语')
    .replace('正文。', '正文。核验于 2026-08-24。')
  write(root, 'source/_posts/learn-topic/playwright/Playwright文档(一)学习路线.md', invalid)

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'blocked')
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_LEGACY_PATH'))
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_DESCRIPTION_BLOCK'))
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_SOURCE_HEADING'))
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_VERIFICATION_COPY'))
  assert.ok(report.errors.some(item => item.code === 'LEARN_TOPIC_FINAL_HEADINGS'))
})

test('learn-topic audit rejects quoted and plain descriptions that span physical lines', () => {
  const root = makeRoot()
  const quoted = validPlaywrightCoursePost()
    .replace('description: 按知识顺序学习 Playwright Python。', 'description: "跨越\n  两个物理行的描述"')
    .replace('abbrlink: pw一', 'abbrlink: quoted-description')
  const plain = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
    .replace('description: 按知识顺序学习 Playwright Python。', 'description: 跨越\n  两个物理行的描述')
    .replace('abbrlink: pw二', 'abbrlink: plain-description')
  write(root, 'source/_posts/learn-topic/playwright/Playwright文档(一)学习路线.md', quoted)
  write(root, 'source/_posts/learn-topic/playwright/Playwright文档(二)快速开始.md', plain)

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'blocked')
  assert.equal(report.errors.filter(item => item.code === 'LEARN_TOPIC_DESCRIPTION_BLOCK').length, 2)
})

test('learn-topic audit applies the same contract to non-Playwright courses', () => {
  const root = makeRoot()
  const markdown = validPlaywrightCoursePost({ topic: '快速开始' })
    .replaceAll('Playwright', 'FastAPI')
    .replace('abbrlink: pw一', 'abbrlink: fastapi-one')
  write(root, 'source/_posts/learn-topic/fastapi/FastAPI文档(一)快速开始.md', markdown)

  const report = auditContent({ root, release: true })
  assert.equal(report.status, 'pass')
  assert.equal(report.facts.learnTopicPostCount, 1)
})

test('learn-topic audit rejects nested paths and validates each course sequence independently', () => {
  const root = makeRoot()
  write(root, 'source/_posts/learn-topic/playwright/nested/Playwright文档(一)学习路线.md', validPlaywrightCoursePost())
  const fastApi = validPlaywrightCoursePost({ number: '二', topic: '快速开始' })
    .replaceAll('Playwright', 'FastAPI')
    .replace('abbrlink: pw二', 'abbrlink: fastapi-two')
  write(root, 'source/_posts/learn-topic/fastapi/FastAPI文档(二)快速开始.md', fastApi)

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
