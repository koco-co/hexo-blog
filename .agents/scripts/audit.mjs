#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, readlinkSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const yaml = require('js-yaml')

const CONTENT_REQUIRED_FIELDS = ['title', 'tags', 'categories', 'description', 'date']
const SENSITIVE_KEY_PATTERN = /\b(api[_-]?key|apikey|access[_-]?token|secret|password|client[_-]?id|token|key)\b\s*[:=]/gi
const TAG_PLUGIN_PACKAGE = 'hexo-butterfly-tag-plugins-plus'
const TAG_PLUGIN_BASELINE_VERSION = '1.0.18'
const FLASHCARD_PLUGIN_PACKAGE = 'hexo-flashcard-plugin'
const LEARN_TOPIC_ROOT = 'source/_posts/learn-topic/'
const LEARN_TOPIC_CONTRACT_ROOT = '.agents/skills/hexo-learn-topic/data'
const LEARN_TOPIC_LEGACY_LEDGER_FIELD = 'learn_topic_capability_ledger'
const LEGACY_LEARN_ROOT = 'source/_posts/learn/'
const LEARN_TOPIC_PLACEHOLDER_MARKER = '<!-- learn-topic-placeholder -->'
const CHINESE_SEQUENCE = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']
const LEARN_TOPIC_ENTRY_ARTICLE = '入门路线'
const LEARN_TOPIC_ADVANCED_ARTICLE = '进阶路线'
const LEARN_TOPIC_FINAL_ARTICLES = new Set(['综合实战', '项目实战', '知识总结'])
const LEARN_TOPIC_INTERNAL_FRONT_MATTER_PREFIX = 'learn_topic_'
const LEARN_TOPIC_ENTRY_HEADINGS = ['课程目标', '前置条件', '学习路径', '文章安排', '开始学习', '参考资料']
const LEARN_TOPIC_PLACEHOLDER_HEADINGS = new Set(['文章职责', '内容边界', '正文编排', '视觉与复习', '验收证据'])
const LEARN_TOPIC_LEGACY_PLACEHOLDER_HEADINGS = new Set(['学习目标', '章节计划', '验证方式'])
const LEARN_TOPIC_SEMANTIC_BLOCK_TAGS = new Set([
  'chartjs', 'flashcard', 'folding', 'gallery', 'hideBlock', 'hideToggle',
  'mermaid', 'note', 'tabs', 'timeline', 'tip', 'videos',
])
const LEARN_TOPIC_PUBLIC_COPY_RULES = [
  { code: 'LEARN_TOPIC_NAVIGATION_COPY_FORBIDDEN', pattern: /前置文章|前置篇|文章\([一二三四五六七八九十]+\)|上一(?:篇|章|文章)|下一(?:篇|章|文章)|从第[一二三四五六七八九十]+篇|课程(?:阅读)?进度|文章进度/ },
  { code: 'LEARN_TOPIC_LEDGER_COPY_FORBIDDEN', pattern: /本文分配(?:的)?能力|能力(?:账本|编号|ID)|课程候选门禁|公开候选门禁|候选门禁|进阶门禁|本篇新建|稳定复习节点|审计版本|\b(?:L2|IP|TR|HTTP|MOD|DIAG|ADV|CAP)-\d{3}\b|\bCN-(?:L2|IP|TR|HTTP|MOD|DIAG|ADV|CAP)-\d{3}\b/ },
  { code: 'LEARN_TOPIC_INTERNAL_COPY_FORBIDDEN', pattern: /学习目标|章节计划|验证方式|课程占位标记|占位合同|课程扩展/ },
]
const ARTICLE_HEADING_MAX_CHARS = 15
const ARTICLE_HEADING_SECTION_EXEMPTIONS = new Set(['常见问题', '参考资料'])
const ARTICLE_HEADING_CHAT_PATTERN = /^(?:Q\d+\s*[:：]\s*)?(?:为什么|如何|怎么|是否|是不是|能否|可以(?:否)?|有没有|什么是)/
const LEARN_TOPIC_FORBIDDEN_PUBLIC_HEADINGS = new Set([
  '本文职责', '正文大纲', '内容计划', '统一封面与文章收尾', '公开候选门禁',
  '视觉与闪卡设计', '自测与闪卡', '如何使用这套课程', '这条路线解决什么问题',
  '开始前需要什么', '学习阶段', '文章地图',
])
const REFERENCE_IMAGE_EXTENSIONS = /\.(?:avif|gif|ico|jpe?g|png|svg|webp)(?:[?#].*)?$/i
const REFERENCE_IMAGE_PATH_HINT = /(?:favicon|favicons|icon|icons|logo|brand|symbol|mark)(?:[._/-]|$)/i
const REFERENCE_GENERIC_IMAGE_PATH = /(?:^|[/_.-])(avatar|default|placeholder|cover|course-cover)(?:[/_.-]|$)/i
const REFERENCE_OFFICIAL_CDN_ALIASES = [
  {
    targetHost: /^developer\.chrome\.com$/i,
    imageHost: /^www\.google\.com$/i,
    imagePath: /\/chrome\/static\/images\/chrome-logo\.svg$/i,
  },
]
const LEARN_TOPIC_NAVIGATION_CARD_PATTERN = /从哪一篇|从第[一二三四五六七八九十]+篇|课程.{0,12}(?:开始|顺序)|(?:是否|会不会).{0,8}阻塞.{0,8}(?:实战|主线|路线)|如何使用(?:这套)?课程|哪一篇.{0,8}(?:开始|选学)/
const LEARN_TOPIC_LOCAL_ABSOLUTE_PATH_PATTERNS = [
  /(?<![A-Za-z0-9/:<])\/(?:Users|home|Volumes|private|tmp|var|etc|usr|opt|Library|System|Applications|bin|sbin|dev|proc|sys|mnt|root|run|srv)(?:\/[^\s`"'<>),;|]+)*/gi,
  /file:\/\/\/[^\s`"'<>),;|]+/gi,
  /(?<![A-Za-z0-9])[A-Za-z]:[\/\\][^\s`"'<>),;|]+/g,
  /(?<![A-Za-z0-9])\\\\[^\s`"'<>),;|]+/g,
]
const TAG_PLUGIN_EXPECTED_TAGS = [
  'audio', 'bdage', 'btns', 'bubble', 'carousel', 'cell', 'checkbox',
  'del', 'emp', 'folding', 'ghcard', 'ghcardgroup', 'icon', 'image',
  'inlineimage', 'issues', 'kbd', 'link', 'linkgroup', 'nota', 'p',
  'poem', 'progress', 'psw', 'radio', 'referfrom', 'referto', 'site',
  'sitegroup', 'span', 'tip', 'u', 'video', 'videos', 'wavy',
]
const TAG_PLUGIN_CONTAINER_TAGS = [
  'btns', 'carousel', 'folding', 'ghcardgroup', 'linkgroup', 'poem',
  'sitegroup', 'tip', 'videos',
]
const KNOWN_CONTAINER_TAGS = new Set([
  ...TAG_PLUGIN_CONTAINER_TAGS,
  'chartjs', 'flashcard', 'flink', 'gallery', 'hideBlock', 'hideToggle',
  'linkgroup', 'mermaid', 'note', 'score', 'tabs', 'timeline',
])
const FORBIDDEN_SOURCE_ARTIFACT_PATTERNS = [
  /^\.DS_Store$/,
  /~$/,
  /\.(?:bak|swp|tmp)$/i,
]
const REPOSITORY_IGNORED_DIRECTORIES = new Set([
  '.git', '.deploy_git', '.idea', '.playwright-cli', '.vscode',
  '.build-goals', 'logs', 'node_modules', 'output', 'public',
])
const REPOSITORY_IGNORED_ROOT_FILES = new Set(['db.json'])
const CODE_ROOTS = ['scripts', 'source/js', '.agents/skills/hexo-learn-topic/scripts']
const CONFIG_YAML_ROOTS = ['.github', '.agents/skills', 'source/_data']
const IMAGE_MIGRATION_MANIFEST = 'tools/hexo-blog/image-migration-map.json'
const OLD_IMAGE_HOST_URL_PATTERN = /https?:\/\/(?:cdn\.jsdelivr\.net\/gh\/koco-co\/picgo-images(?:@[^/\s)'"<>}]+)?|raw\.githubusercontent\.com\/koco-co\/picgo-images\/[^/\s)'"<>}]+|github\.com\/koco-co\/picgo-images\/raw\/[^/\s)'"<>}]+)\/[^\s)'"<>}]+/g
const LOCAL_IMAGE_URL_PATTERN = /\/img\/[^\s,)'"<>}]+/g

function finding(code, relativePath, message) {
  return { code, path: relativePath, message }
}

function reportFor(mode, facts = {}) {
  return {
    mode,
    status: 'pass',
    facts,
    warnings: [],
    errors: [],
    blockers: [],
  }
}

function finalize(report) {
  if (report.blockers.length > 0 || report.errors.length > 0) report.status = 'blocked'
  else if (report.warnings.length > 0) report.status = 'warning'
  else report.status = 'pass'
  return report
}

function safeRelative(root, target) {
  const relative = path.relative(root, target)
  return relative && !relative.startsWith('..') ? relative : path.basename(target)
}

function readText(target) {
  return readFileSync(target, 'utf8')
}

function readJson(target) {
  return JSON.parse(readText(target))
}

function parseYaml(text) {
  return yaml.load(text) || {}
}

function sameStringRecord(left, right) {
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false
  if (Array.isArray(left) || Array.isArray(right)) return false
  const leftEntries = Object.entries(left).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
  const rightEntries = Object.entries(right).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
  return JSON.stringify(leftEntries) === JSON.stringify(rightEntries)
}

function parseFrontMatter(text) {
  const match = text.match(/^\uFEFF?---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/)
  if (!match) return { data: null, error: { line: 1 } }

  try {
    const data = parseYaml(match[1])
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { data: null, error: { line: 1 } }
    }
    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: { line: Number(error?.mark?.line ?? 0) + 1 },
    }
  }
}

function rawFrontMatter(text) {
  return text.match(/^\uFEFF?---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/)?.[1] ?? ''
}

function frontMatterFieldSpansPhysicalLines(frontMatter, field) {
  const lines = frontMatter.split(/\r?\n/)
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const fieldPattern = new RegExp(`^${escapedField}\\s*:`)
  const index = lines.findIndex(line => fieldPattern.test(line))
  if (index < 0) return false

  const value = lines[index].replace(fieldPattern, '').trimStart()
  if (/^[>|]/.test(value)) return true

  const quote = value[0]
  if (quote === '"' || quote === "'") {
    let escaped = false
    let closed = false
    for (let position = 1; position < value.length; position += 1) {
      const character = value[position]
      if (quote === '"' && character === '\\' && !escaped) {
        escaped = true
        continue
      }
      if (character === quote && !escaped) {
        closed = true
        break
      }
      escaped = false
    }
    if (!closed) return true
  }

  return /^\s+\S/.test(lines[index + 1] ?? '')
}

function markdownBodyLines(text) {
  const lines = text.split(/\r?\n/)
  const visible = []
  let frontMatter = false
  let fence = null

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (index === 0 && /^\uFEFF?---\s*$/.test(line)) {
      frontMatter = true
      visible.push('')
      continue
    }
    if (frontMatter && /^---\s*$/.test(line)) {
      frontMatter = false
      visible.push('')
      continue
    }
    if (frontMatter) {
      visible.push('')
      continue
    }

    const marker = line.match(/^\s*(`{3,}|~{3,})/)
    if (marker) {
      const character = marker[1][0]
      const length = marker[1].length
      if (!fence) fence = { character, length }
      else if (fence.character === character && length >= fence.length) fence = null
      visible.push('')
      continue
    }
    visible.push(fence ? '' : line)
  }

  return visible
}

function isStructuralConnection(line) {
  const normalized = line.replace(/[`*_~]/g, '').trim()
  return normalized.length <= 40
    && /^(?:接下来|随后|然后|最后|综上|换句话说|在这个例子中|下面进入|下面转向|因此可以看到)[^。！？!?]{0,32}[。！？!?]?$/.test(normalized)
}

function isMarkdownListItem(line) {
  return /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line)
}

function isMarkdownTableRow(line) {
  const trimmed = line.trim()
  return (trimmed.startsWith('|') && trimmed.endsWith('|'))
    || /^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?$/.test(trimmed)
}

function isSingleTagLine(line) {
  return /^\s*\{%\s*[A-Za-z][A-Za-z0-9_-]*\b[^%]*%\}\s*$/.test(line)
}

function structuralLeadLineNumbers(text) {
  const lines = text.split(/\r?\n/)
  const leads = new Set()
  let frontMatter = false
  let fence = null

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (index === 0 && /^\uFEFF?---\s*$/.test(line)) {
      frontMatter = true
      continue
    }
    if (frontMatter) {
      if (/^---\s*$/.test(line)) frontMatter = false
      continue
    }

    const marker = line.match(/^\s*(`{3,}|~{3,})/)
    if (marker) {
      const character = marker[1][0]
      const length = marker[1].length
      if (!fence) fence = { character, length }
      else if (fence.character === character && length >= fence.length) fence = null
      continue
    }
    const normalized = line.replace(/[`*_~]/g, '').trim()
    if (fence
      || !/[：:]\s*$/.test(normalized)
      || normalized.length > 72
      || /[。！？!?]/.test(normalized.slice(0, -1))) continue

    let nextIndex = index + 1
    while (nextIndex < lines.length && !lines[nextIndex].trim()) nextIndex += 1
    const next = lines[nextIndex] ?? ''
    if (/^\s*(?:[-*+]\s+|\d+[.)]\s+|\||`{3,}|~{3,}|\{%\s*(?:mermaid|timeline|tabs|chartjs)\b)/.test(next)) {
      leads.add(index + 1)
    }
  }
  return leads
}

function learnTopicPlainBodyBlocks(text) {
  const rows = markdownBodyLines(text)
  const structuralLeads = structuralLeadLineNumbers(text)
  const blocks = []
  const stack = []
  let current = []
  let inList = false
  let inTable = false

  const flush = () => {
    if (current.length === 0) return
    if (!structuralLeads.has(current.at(-1).line)) {
      blocks.push({
        line: current[0].line,
        text: current.map(item => item.text.trim()).join(' / '),
      })
    }
    current = []
  }

  const updateStack = line => {
    const match = line.trim().match(/^\{%\s*([A-Za-z][A-Za-z0-9_-]*)\b[^%]*%\}$/)
    if (!match) return
    const name = match[1]
    if (KNOWN_CONTAINER_TAGS.has(name)) {
      stack.push(name)
      return
    }
    if (!name.startsWith('end')) return
    const containerName = name.slice(3)
    if (!KNOWN_CONTAINER_TAGS.has(containerName)) return
    const matchingIndex = stack.map(item => item).lastIndexOf(containerName)
    if (matchingIndex >= 0) stack.splice(matchingIndex, 1)
  }

  for (const [index, rawLine] of rows.entries()) {
    const line = { line: index + 1, text: rawLine }
    const trimmed = rawLine.trim()
    if (isSingleTagLine(rawLine)) {
      flush()
      updateStack(rawLine)
      inList = false
      inTable = false
      continue
    }
    if (stack.length > 0) {
      flush()
      continue
    }
    if (!trimmed || /^\s*<!--(?:[\s\S]*?)-->\s*$/.test(rawLine)) {
      flush()
      inList = false
      inTable = false
      continue
    }
    if (/^\s*#{1,6}\s+/.test(rawLine)) {
      flush()
      inList = false
      inTable = false
      continue
    }
    if (isMarkdownTableRow(rawLine)) {
      flush()
      inTable = true
      continue
    }
    if (inTable && rawLine.includes('|')) {
      flush()
      continue
    }
    inTable = false
    if (isMarkdownListItem(rawLine) || (inList && /^\s{2,}\S/.test(rawLine))) {
      flush()
      inList = true
      continue
    }
    inList = false
    if (/^\s*!\[[^\]]*\]\([^)]*\)\s*$/.test(rawLine) || isStructuralConnection(rawLine)) {
      flush()
      continue
    }
    current.push(line)
  }
  flush()
  return blocks
}

function learnTopicPublicCopyIssues(text) {
  const issues = []
  for (const [index, line] of markdownBodyLines(text).entries()) {
    if (isSingleTagLine(line)) continue
    for (const rule of LEARN_TOPIC_PUBLIC_COPY_RULES) {
      if (!rule.pattern.test(line)) continue
      issues.push({ code: rule.code, line: index + 1, text: line.trim() })
    }
  }
  return issues
}

function markdownHeadings(text) {
  const headings = []
  for (const [index, line] of markdownBodyLines(text).entries()) {
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/)
    if (heading) headings.push({ level: heading[1].length, text: heading[2], line: index + 1 })
  }
  return headings
}

function markdownH2Headings(text) {
  return markdownHeadings(text).filter(heading => heading.level === 2).map(heading => heading.text)
}

function hasCourseDraftBody(h2Headings) {
  const publicHeadings = h2Headings.filter(heading => !LEARN_TOPIC_PLACEHOLDER_HEADINGS.has(heading))
  return publicHeadings.length >= 2 && publicHeadings.at(-1) === '参考资料'
}

function markdownSection(text, headingText) {
  return markdownSectionInfo(text, headingText)?.text ?? ''
}

function markdownSectionInfo(text, headingText) {
  const lines = markdownBodyLines(text)
  const start = lines.findIndex(line => line.trim() === `## ${headingText}`)
  if (start < 0) return null
  let end = lines.length
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) {
      end = index
      break
    }
  }
  return {
    text: lines.slice(start + 1, end).join('\n'),
    startLine: start + 2,
    endLine: end,
  }
}

function headingLooksLikeCode(text) {
  const normalized = text.replace(/`/g, '').trim()
  return /^`[^`]+`$/.test(text.trim()) || /^\.?[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(normalized)
}

function headingStyleIssue(heading, currentH2) {
  if (![2, 3].includes(heading.level) || ARTICLE_HEADING_SECTION_EXEMPTIONS.has(currentH2)) return null
  if (LEARN_TOPIC_ENTRY_HEADINGS.includes(heading.text) || headingLooksLikeCode(heading.text)) return null
  const charCount = [...heading.text].length
  if (charCount > ARTICLE_HEADING_MAX_CHARS) {
    return `第 ${heading.line} 行的 H${heading.level}“${heading.text}”有 ${charCount} 个字符；标题应压缩为对象、动作或边界，解释移到正文、表格或图示。`
  }
  if (ARTICLE_HEADING_CHAT_PATTERN.test(heading.text)) {
    return `第 ${heading.line} 行的 H${heading.level}“${heading.text}”是聊天式问题；请改为简洁的主题短语，问题放入正文或“常见问题”。`
  }
  if (/[：:]/.test(heading.text) && charCount >= 12) {
    return `第 ${heading.line} 行的 H${heading.level}“${heading.text}”包含解释性副标题；请保留主题名，详细限定条件移到正文或图表。`
  }
  if (/[、，,]/.test(heading.text) && charCount >= 12 && (heading.text.match(/[、，,]/g) ?? []).length >= 1) {
    return `第 ${heading.line} 行的 H${heading.level}“${heading.text}”堆叠了多个概念；请拆成简洁主题或把比较维度放到表格。`
  }
  return null
}

function markdownFenceBlocks(text) {
  const blocks = []
  const lines = text.split(/\r?\n/)
  let frontMatter = false
  let fence = null
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (index === 0 && /^\uFEFF?---\s*$/.test(line)) {
      frontMatter = true
      continue
    }
    if (frontMatter && /^---\s*$/.test(line)) {
      frontMatter = false
      continue
    }
    if (frontMatter) continue
    const marker = line.match(/^\s*(`{3,}|~{3,})\s*([^\s`]*)/)
    if (!marker) continue
    const character = marker[1][0]
    const length = marker[1].length
    if (!fence) {
      fence = { character, length, info: marker[2].trim(), line: index + 1 }
      blocks.push(fence)
    } else if (fence.character === character && length >= fence.length) {
      fence = null
    }
  }
  return blocks
}

function unclosedMarkdownFence(text) {
  const lines = text.split(/\r?\n/)
  let frontMatter = false
  let fence = null
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (index === 0 && /^\uFEFF?---\s*$/.test(line)) {
      frontMatter = true
      continue
    }
    if (frontMatter && /^---\s*$/.test(line)) {
      frontMatter = false
      continue
    }
    if (frontMatter) continue
    const marker = line.match(/^\s*(`{3,}|~{3,})/)
    if (!marker) continue
    const candidate = { character: marker[1][0], length: marker[1].length, line: index + 1 }
    if (!fence) fence = candidate
    else if (candidate.character === fence.character && candidate.length >= fence.length) fence = null
  }
  return fence
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function frontMatterScalarValue(text, field) {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = rawFrontMatter(text).match(new RegExp(`^${escaped}\\s*:\\s*([^\\r\\n]*?)\\s*$`, 'm'))
  if (!match) return null
  let quote = null
  let escapedCharacter = false
  let end = match[1].length
  for (let index = 0; index < match[1].length; index += 1) {
    const character = match[1][index]
    if (quote) {
      if (character === quote && !escapedCharacter) quote = null
      escapedCharacter = quote === '"' && character === '\\' && !escapedCharacter
      if (character !== '\\') escapedCharacter = false
      continue
    }
    if (character === '"' || character === "'") quote = character
    else if (character === '#') {
      end = index
      break
    }
  }
  const value = match[1].slice(0, end).trim()
  if (!value) return null
  return ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
    ? value.slice(1, -1)
    : value
}

function isValidDateValue(value, sourceValue = null) {
  if (value instanceof Date && Number.isNaN(value.getTime())) return false
  const text = String(sourceValue ?? value ?? '').trim()
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\s*(?:Z|[+-]\d{2}:?\d{2}))?)?$/)
  if (!match) return false
  const [, year, month, day, hour = '00', minute = '00', second = '00'] = match
  const parts = [year, month, day, hour, minute, second].map(Number)
  const [yearNumber, monthNumber, dayNumber, hourNumber, minuteNumber, secondNumber] = parts
  if (monthNumber < 1 || monthNumber > 12 || hourNumber > 23 || minuteNumber > 59 || secondNumber > 59) return false
  const calendar = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber))
  if (calendar.getUTCFullYear() !== yearNumber || calendar.getUTCMonth() !== monthNumber - 1 || calendar.getUTCDate() !== dayNumber) return false
  return !Number.isNaN(Date.parse(text.replace(' ', 'T')))
}

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString)
}

function normalizeVersion(version) {
  const parts = String(version ?? '')
    .replace(/^v/i, '')
    .match(/\d+/g)
  return [0, 1, 2].map(index => Number(parts?.[index] ?? 0))
}

export function compareVersions(left, right) {
  const a = normalizeVersion(left)
  const b = normalizeVersion(right)
  for (let index = 0; index < 3; index += 1) {
    if (a[index] > b[index]) return 1
    if (a[index] < b[index]) return -1
  }
  return 0
}

function minimumVersion(engine) {
  const match = String(engine ?? '').match(/\d+(?:\.\d+){0,2}/)
  return match?.[0] ?? null
}

function topLevelFrontMatterKeys(text) {
  const match = text.match(/^\uFEFF?---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/)
  if (!match) return []
  return [...match[1].matchAll(/^([a-zA-Z][a-zA-Z0-9_-]*):/gm)].map(item => item[1])
}

function getPath(object, dottedPath) {
  return dottedPath.split('.').reduce((value, key) => value == null ? undefined : value[key], object)
}

function sanitizeUrl(value) {
  if (!isNonEmptyString(value)) return null
  const raw = value.trim()
  try {
    const url = new URL(raw)
    url.username = ''
    url.password = ''
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return raw
      .replace(/([a-z][a-z0-9+.-]*:\/\/)[^/@\s]+@/i, '$1')
      .replace(/[?#].*$/, '')
  }
}

function inspectGit(target) {
  if (!existsSync(target)) return { present: false, dirty: null, entries: 0 }
  if (!existsSync(path.join(target, '.git'))) return { present: false, dirty: null, entries: 0 }

  const result = spawnSync('git', ['-C', target, 'status', '--porcelain', '--untracked-files=normal'], {
    encoding: 'utf8',
  })
  if (result.status !== 0) return { present: true, dirty: null, entries: 0 }

  const entries = result.stdout.split(/\r?\n/).filter(Boolean).length
  return { present: true, dirty: entries > 0, entries }
}

function sensitiveKeyLocations(root, relativeFiles) {
  const locations = []
  for (const relativeFile of relativeFiles) {
    const target = path.join(root, relativeFile)
    if (!existsSync(target)) continue
    const text = readText(target)
    const pattern = new RegExp(SENSITIVE_KEY_PATTERN.source, SENSITIVE_KEY_PATTERN.flags)
    let match
    while ((match = pattern.exec(text)) !== null) {
      locations.push({
        file: relativeFile,
        line: text.slice(0, match.index).split(/\r?\n/).length,
        identifier: match[1].toLowerCase(),
      })
    }
  }
  return locations
}

function localInjectedAssets(config) {
  const inject = config?.inject || {}
  const values = [...(Array.isArray(inject.head) ? inject.head : []), ...(Array.isArray(inject.bottom) ? inject.bottom : [])]
  const assets = new Set()
  for (const value of values) {
    const text = String(value)
    for (const match of text.matchAll(/(?:href|src)=["'](\/(?:css|js)\/[^"'?#> ]+)/gi)) {
      assets.add(match[1])
    }
  }
  return [...assets].sort()
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function markdownFilesUnder(root) {
  const files = []
  if (!existsSync(root)) return files

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name)
    if (entry.isDirectory()) files.push(...markdownFilesUnder(target))
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(target)
  }
  return files.sort((left, right) => left.localeCompare(right, 'zh-CN'))
}

function isRenderedImageReference(line, index, frontMatter) {
  if (frontMatter) return true
  const before = line.slice(0, index)
  return /!\[[^\]]*\]\([^)]*$/.test(before)
    || /<img\b[^>]*(?:src|data-src)=["'][^"']*$/i.test(before)
    || /\{%\s*(?:galleryGroup|inlineImg|image|inlineimage|link|site|cell)\b/.test(line)
}

function isRemoteUrlPath(line, index) {
  return /(?:https?:)?\/\/[^\s'\"<>]*$/i.test(line.slice(0, index))
}

function markdownImageReferences(root) {
  const references = {
    markdownFileCount: 0,
    liveOldHost: [],
    tutorialOldHost: [],
    local: [],
  }
  const files = markdownFilesUnder(path.join(root, 'source'))
  references.markdownFileCount = files.length

  for (const target of files) {
    const relativeFile = safeRelative(root, target)
    const lines = readText(target).split(/\r?\n/)
    let fence = null
    let frontMatter = false
    let imageTagContinuation = false

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]
      if (index === 0 && /^---\s*$/.test(line)) {
        frontMatter = true
        continue
      }
      if (frontMatter && /^---\s*$/.test(line)) {
        frontMatter = false
        continue
      }

      const marker = line.match(/^\s*(`{3,}|~{3,})/)
      if (marker) {
        if (!fence) fence = marker[1][0]
        else if (fence === marker[1][0]) fence = null
        continue
      }

      const startsImageTag = /\{%\s*(?:galleryGroup|inlineImg|image|inlineimage|link|site|cell)\b/.test(line)
      const renderedTagLine = imageTagContinuation || startsImageTag
      const oldHostPattern = new RegExp(OLD_IMAGE_HOST_URL_PATTERN.source, OLD_IMAGE_HOST_URL_PATTERN.flags)
      for (const match of line.matchAll(oldHostPattern)) {
        const reference = { file: relativeFile, line: index + 1 }
        if (!fence && (renderedTagLine || isRenderedImageReference(line, match.index, frontMatter))) references.liveOldHost.push(reference)
        else references.tutorialOldHost.push(reference)
      }

      if (fence) continue
      const localPattern = new RegExp(LOCAL_IMAGE_URL_PATTERN.source, LOCAL_IMAGE_URL_PATTERN.flags)
      for (const match of line.matchAll(localPattern)) {
        if (isRemoteUrlPath(line, match.index)) continue
        if (!renderedTagLine && !isRenderedImageReference(line, match.index, frontMatter)) continue
        references.local.push({ file: relativeFile, line: index + 1, url: match[0] })
      }
      if (renderedTagLine) imageTagContinuation = !line.includes('%}')
    }
  }

  return references
}

function resolveLocalImage(root, imageUrl) {
  const cleanPath = imageUrl.replace(/[?#].*$/, '')
  let decoded
  try {
    decoded = decodeURIComponent(cleanPath)
  } catch {
    return null
  }
  const relativePath = decoded.replace(/^\/+/, '')
  const roots = [path.resolve(root, 'source'), path.resolve(root, 'themes/butterfly/source')]
  const candidates = roots.map(sourceRoot => ({ sourceRoot, target: path.resolve(sourceRoot, relativePath) }))
  if (candidates.some(({ sourceRoot, target }) => target !== sourceRoot && !target.startsWith(`${sourceRoot}${path.sep}`))) return null
  return candidates.find(({ target }) => existsSync(target))?.target ?? candidates[0].target
}

function sha256(target) {
  return createHash('sha256').update(readFileSync(target)).digest('hex')
}

export function auditAssets({ root = process.cwd() } = {}) {
  const projectRoot = path.resolve(root)
  const report = reportFor('assets', {
    manifestPath: IMAGE_MIGRATION_MANIFEST,
    sourceRepository: null,
    sourceCommit: null,
    expectedAssetCount: 0,
    expectedOccurrenceCount: 0,
    expectedTotalBytes: 0,
    verifiedAssetCount: 0,
    markdownFileCount: 0,
    liveOldHostReferenceCount: 0,
    tutorialOldHostExampleCount: 0,
    localImageReferenceCount: 0,
    checkedImageFileCount: 0,
    configurationImageReferenceCount: 0,
  })

  const manifestTarget = path.join(projectRoot, IMAGE_MIGRATION_MANIFEST)
  if (!existsSync(manifestTarget)) {
    report.errors.push(finding('IMAGE_MANIFEST_MISSING', IMAGE_MIGRATION_MANIFEST, '图片迁移清单不存在。'))
  } else {
    try {
      const manifest = readJson(manifestTarget)
      const assets = Array.isArray(manifest.assets) ? manifest.assets : []
      report.facts.sourceRepository = isNonEmptyString(manifest.sourceRepository) ? sanitizeUrl(manifest.sourceRepository) : null
      report.facts.sourceCommit = isNonEmptyString(manifest.sourceCommit) ? manifest.sourceCommit : null
      report.facts.expectedAssetCount = Number(manifest.assetCount ?? 0)
      report.facts.expectedOccurrenceCount = Number(manifest.occurrenceCount ?? 0)
      report.facts.expectedTotalBytes = Number(manifest.totalBytes ?? 0)

      if (assets.length === 0 || assets.length !== report.facts.expectedAssetCount) {
        report.errors.push(finding('IMAGE_MANIFEST_COUNT_INVALID', IMAGE_MIGRATION_MANIFEST, 'assetCount 与迁移条目数量不一致。'))
      }

      const targets = new Set()
      let actualTotalBytes = 0
      for (const asset of assets) {
        const targetPath = typeof asset?.targetPath === 'string' ? asset.targetPath : ''
        if (!targetPath.startsWith('source/img/picgo-images/') || targets.has(targetPath)) {
          report.errors.push(finding('IMAGE_MANIFEST_TARGET_INVALID', IMAGE_MIGRATION_MANIFEST, '迁移目标必须唯一且位于 source/img/picgo-images/。'))
          continue
        }
        targets.add(targetPath)
        const target = path.resolve(projectRoot, targetPath)
        if (!target.startsWith(`${path.resolve(projectRoot, 'source/img/picgo-images')}${path.sep}`) || !existsSync(target)) {
          report.errors.push(finding('MIGRATED_IMAGE_MISSING', targetPath, '迁移清单中的本地图片不存在。'))
          continue
        }
        const stat = statSync(target)
        const expectedBytes = Number(asset.bytes)
        actualTotalBytes += stat.size
        if (!stat.isFile() || stat.size !== expectedBytes) {
          report.errors.push(finding('MIGRATED_IMAGE_SIZE_MISMATCH', targetPath, '本地图片大小与迁移清单不一致。'))
          continue
        }
        if (!/^[a-f0-9]{64}$/.test(String(asset.sha256 ?? '')) || sha256(target) !== asset.sha256) {
          report.errors.push(finding('MIGRATED_IMAGE_HASH_MISMATCH', targetPath, '本地图片 SHA-256 与迁移清单不一致。'))
          continue
        }
        const expectedMediaType = imageMediaType(target)
        if (!expectedMediaType || asset.mediaType !== expectedMediaType || !imageSignatureMatches(target)) {
          report.errors.push(finding('MIGRATED_IMAGE_MEDIA_TYPE_MISMATCH', targetPath, '迁移清单 mediaType、目标扩展名与文件签名不一致。'))
          continue
        }
        report.facts.verifiedAssetCount += 1
      }

      if (actualTotalBytes !== report.facts.expectedTotalBytes) {
        report.errors.push(finding('IMAGE_MANIFEST_BYTES_INVALID', IMAGE_MIGRATION_MANIFEST, 'totalBytes 与迁移图片实际大小总和不一致。'))
      }
    } catch {
      report.errors.push(finding('JSON_PARSE_FAILED', IMAGE_MIGRATION_MANIFEST, '图片迁移清单无法解析。'))
    }
  }

  const references = markdownImageReferences(projectRoot)
  report.facts.markdownFileCount = references.markdownFileCount
  report.facts.liveOldHostReferenceCount = references.liveOldHost.length
  report.facts.tutorialOldHostExampleCount = references.tutorialOldHost.length
  report.facts.localImageReferenceCount = references.local.length

  for (const reference of references.liveOldHost) {
    report.errors.push(finding('OLD_IMAGE_HOST_LIVE_REFERENCE', reference.file, `第 ${reference.line} 行仍在真实渲染内容中引用旧图床。`))
  }
  for (const reference of references.local) {
    const target = resolveLocalImage(projectRoot, reference.url)
    if (!target || !existsSync(target)) {
      report.errors.push(finding('LOCAL_IMAGE_MISSING', reference.file, `第 ${reference.line} 行引用的本地图片不存在。`))
    }
  }

  const renderedAssetSources = repositoryEntries(projectRoot).filter(item => {
    if (!item.entry.isFile()) return false
    return /^_config(?:\.[^.]+)?\.ya?ml$/.test(item.relative)
      || item.relative.startsWith('source/css/')
      || item.relative.startsWith('source/js/')
  })
  for (const item of renderedAssetSources) {
    const text = readText(item.target)
    for (const match of text.matchAll(OLD_IMAGE_HOST_URL_PATTERN)) {
      report.errors.push(finding('OLD_IMAGE_HOST_RENDERED_SOURCE', item.relative, `第 ${lineForOffset(text, match.index)} 行仍在站点配置或前端源码中引用旧图床。`))
    }
    for (const match of text.matchAll(LOCAL_IMAGE_URL_PATTERN)) {
      const url = match[0].replace(/[;\]\}]+$/, '')
      if (!/\.(?:png|jpe?g|gif|webp|ico|svg)(?:[?#].*)?$/i.test(url)) continue
      report.facts.configurationImageReferenceCount += 1
      const target = resolveLocalImage(projectRoot, url)
      if (!target || !existsSync(target)) report.errors.push(finding('LOCAL_IMAGE_MISSING', item.relative, `第 ${lineForOffset(text, match.index)} 行引用的本地图片不存在。`))
    }
  }

  const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg'])
  const imageFiles = repositoryEntries(projectRoot).filter(item => {
    if (!item.entry.isFile() || !imageExtensions.has(path.extname(item.relative).toLowerCase())) return false
    return item.relative.startsWith('source/img/') || item.relative.includes('/assets/')
  })
  report.facts.checkedImageFileCount = imageFiles.length
  for (const item of imageFiles) {
    if (!imageSignatureMatches(item.target)) report.errors.push(finding('IMAGE_FILE_INVALID', item.relative, '图片为空、扩展名与文件签名不一致，或不是支持的图片格式。'))
  }

  return finalize(report)
}

function registeredTagNames(source) {
  const names = new Set()
  for (const match of source.matchAll(/(?:hexo\.extend\.)?tag\.register\(\s*['"]([^'"]+)['"]/g)) {
    names.add(match[1])
  }
  return [...names].sort()
}

function registeredContainerTagNames(source) {
  const names = new Set()
  for (const match of source.matchAll(/(?:hexo\.extend\.)?tag\.register\(\s*['"]([^'"]+)['"]/g)) {
    const open = source.indexOf('(', match.index)
    let depth = 0
    let quote = null
    let escaped = false
    let end = Math.min(source.length, match.index + 1000)
    for (let index = open; index < end; index += 1) {
      const character = source[index]
      if (quote) {
        if (character === quote && !escaped) quote = null
        escaped = character === '\\' && !escaped
        if (character !== '\\') escaped = false
        continue
      }
      if (character === '"' || character === "'" || character === '`') {
        quote = character
        continue
      }
      if (character === '(') depth += 1
      else if (character === ')') {
        depth -= 1
        if (depth === 0) {
          end = index + 1
          break
        }
      }
    }
    const registration = source.slice(match.index, end)
    if (/\{\s*ends\s*:\s*true\s*\}/.test(registration) || /,\s*true\s*\)/.test(registration)) names.add(match[1])
  }
  return [...names].sort()
}

function sourceFilesUnder(root, extensions, skippedDirectories = new Set()) {
  if (!existsSync(root)) return []
  const files = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name)
    if (entry.isDirectory() && !skippedDirectories.has(entry.name)) files.push(...sourceFilesUnder(target, extensions, skippedDirectories))
    else if (entry.isFile() && extensions.some(extension => entry.name.endsWith(extension))) files.push(target)
  }
  return files
}

function packageEntrySources(projectRoot, packageName) {
  const packageRoot = path.join(projectRoot, 'node_modules', packageName)
  const packageTarget = path.join(packageRoot, 'package.json')
  if (!existsSync(packageTarget)) return []
  let entry
  try {
    const packageData = readJson(packageTarget)
    entry = packageData.main || 'index.js'
  } catch {
    return []
  }

  const resolvedEntry = path.resolve(packageRoot, entry)
  const pending = [resolvedEntry]
  const visited = new Set()
  const candidates = ['', '.js', '.mjs', '.cjs', '/index.js', '/index.mjs', '/index.cjs']
  while (pending.length > 0) {
    const target = pending.pop()
    const resolved = candidates.map(suffix => `${target}${suffix}`).find(candidate => existsSync(candidate) && statSync(candidate).isFile())
    if (!resolved || visited.has(resolved) || !resolved.startsWith(`${packageRoot}${path.sep}`)) continue
    visited.add(resolved)
    const source = readText(resolved)
    const specifications = [
      ...source.matchAll(/\brequire\(\s*['"](\.[^'"]+)['"]\s*\)/g),
      ...source.matchAll(/\b(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"](\.[^'"]+)['"]/g),
      ...source.matchAll(/\bimport\(\s*['"](\.[^'"]+)['"]\s*\)/g),
    ].map(match => match[1])
    for (const specification of specifications) pending.push(path.resolve(path.dirname(resolved), specification))
  }
  return [...visited]
}

function installedHexoTagSources(root) {
  const projectRoot = path.resolve(root)
  const targets = [
    ...sourceFilesUnder(path.join(projectRoot, 'scripts'), ['.js', '.mjs', '.cjs']),
    ...sourceFilesUnder(path.join(projectRoot, 'themes/butterfly/scripts/tag'), ['.js', '.mjs', '.cjs']),
    ...sourceFilesUnder(path.join(projectRoot, 'node_modules/hexo/dist/plugins/tag'), ['.js', '.mjs', '.cjs']),
  ]

  const packageTarget = path.join(projectRoot, 'package.json')
  if (existsSync(packageTarget)) {
    try {
      const projectPackage = readJson(packageTarget)
      const dependencies = { ...(projectPackage.dependencies || {}), ...(projectPackage.devDependencies || {}) }
      for (const packageName of Object.keys(dependencies).filter(name => name.startsWith('hexo-'))) {
        targets.push(...packageEntrySources(projectRoot, packageName))
      }
    } catch {
      // package.json 的解析错误由 project/tags 审计给出；这里不制造重复错误。
    }
  }

  return [...new Set(targets)]
}

function installedTagRegistry(root) {
  const tags = new Set()
  const containers = new Set(KNOWN_CONTAINER_TAGS)
  for (const target of installedHexoTagSources(root)) {
    const source = readText(target)
    for (const name of registeredTagNames(source)) tags.add(name)
    for (const name of registeredContainerTagNames(source)) containers.add(name)
  }
  return { tags, containers }
}

function validateFlashcards(report, projectRoot, markdownFiles, tagCounts) {
  if (!tagCounts.has('flashcard') && !tagCounts.has('flashcard_ref')) return
  const parserTarget = path.join(projectRoot, 'node_modules', FLASHCARD_PLUGIN_PACKAGE, 'lib/parser.js')
  if (!existsSync(parserTarget)) {
    report.errors.push(finding('FLASHCARD_VALIDATOR_MISSING', parserTarget, '文章使用了闪卡标签，但已安装插件缺少 lib/parser.js，无法执行字段、唯一 ID 与引用校验。'))
    return
  }

  try {
    const { collectFlashcards } = require(parserTarget)
    if (typeof collectFlashcards !== 'function') throw new Error('collectFlashcards is unavailable')
    const documents = markdownFiles.map(target => {
      const raw = readText(target)
      const relativeFile = safeRelative(projectRoot, target)
      const data = parseFrontMatter(raw).data ?? {}
      return {
        raw,
        source: relativeFile,
        articleKey: relativeFile,
        articleTitle: isNonEmptyString(data.title) ? data.title : '',
        articlePath: relativeFile,
        defaultDeck: isNonEmptyString(data.flashcard_deck) ? data.flashcard_deck : '',
      }
    })
    collectFlashcards(documents)
  } catch (error) {
    const source = isNonEmptyString(error?.source) ? error.source : 'source'
    const field = isNonEmptyString(error?.field) ? `；字段 ${error.field}` : ''
    report.errors.push(finding('FLASHCARD_CONTENT_INVALID', source, `闪卡校验失败${field}：${error?.message || '插件解析器拒绝了当前内容。'}`))
  }
}

function renderedTagTokens(text) {
  const visibleText = markdownBodyLines(text)
    .map(line => line.replace(/(`+)(.*?)\1/g, ''))
    .join('\n')
  const tokens = []
  for (const match of visibleText.matchAll(/\{%\s*([A-Za-z][A-Za-z0-9_-]*)\b[^%]*%\}/g)) {
    tokens.push({
      name: match[1],
      line: visibleText.slice(0, match.index).split(/\r?\n/).length,
    })
  }
  return tokens
}

function checkTagContainers(report, relativeFile, tokens, registeredContainers = KNOWN_CONTAINER_TAGS) {
  const containers = new Set(registeredContainers)
  const stack = []

  for (const token of tokens) {
    if (containers.has(token.name)) {
      stack.push(token)
      continue
    }

    if (!token.name.startsWith('end')) continue
    const containerName = token.name.slice(3)
    if (!containers.has(containerName)) continue

    if (stack.length === 0) {
      report.errors.push(finding('TAG_CONTAINER_UNEXPECTED_END', relativeFile, `第 ${token.line} 行的 ${token.name} 没有对应的开始标签。`))
      continue
    }

    const openTag = stack.at(-1)
    if (openTag.name === containerName) {
      stack.pop()
      continue
    }

    report.errors.push(finding(
      'TAG_CONTAINER_MISMATCH',
      relativeFile,
      `第 ${token.line} 行的 ${token.name} 与第 ${openTag.line} 行的 ${openTag.name} 嵌套顺序不匹配。`,
    ))
    const matchingIndex = stack.map(item => item.name).lastIndexOf(containerName)
    if (matchingIndex >= 0) stack.splice(matchingIndex, 1)
  }

  for (const token of stack) {
    report.errors.push(finding('TAG_CONTAINER_UNCLOSED', relativeFile, `第 ${token.line} 行的 ${token.name} 缺少 end${token.name}。`))
  }
}

function contentFieldError(report, relativeFile, field, message) {
  report.errors.push(finding('FRONT_MATTER_FIELD_INVALID', relativeFile, `${field}: ${message}`))
}

function sameStringSet(left, right) {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return rightSet.size === right.length && left.every(value => rightSet.has(value))
}

function capabilityLedgerReferences(payload, articles) {
  const actualByOrder = new Map(articles.map(article => [article.order, article.title]))
  if (payload?.coverage_ledger && Array.isArray(payload.coverage_ledger)) {
    return payload.coverage_ledger.map(item => item?.article).filter(isNonEmptyString)
  }
  if (payload?.ledger?.fields && payload?.ledger?.items && !Array.isArray(payload.ledger.items)) {
    const fields = payload.ledger.fields
    const referenceIndex = fields.indexOf('article') >= 0 ? fields.indexOf('article') : fields.indexOf('target')
    if (referenceIndex < 0) return []
    return Object.values(payload.ledger.items).map(item => item?.[referenceIndex]).filter(isNonEmptyString).map(reference => {
      const orderCode = reference.match(/^A(\d{2})$/)?.[1]
      if (orderCode) return actualByOrder.get(Number(orderCode)) ?? reference
      return reference.split(' / ')[0]
    })
  }
  if (payload?.articles && payload?.ledger && Array.isArray(payload.ledger)) {
    return payload.ledger
      .map(item => payload.articles?.[item?.[2]])
      .filter(isNonEmptyString)
      .map(file => file.replace(/\.md$/, ''))
  }
  if (payload?.codec?.row_fields && payload?.dictionaries?.mainArticle) {
    const articleIndex = payload.codec.row_fields.indexOf('mainArticle')
    return payload.current
      .map(item => payload.dictionaries.mainArticle?.[item?.[articleIndex]])
      .filter(isNonEmptyString)
  }
  return []
}

function validateCapabilityLedger(report, contractPath, payload, articles) {
  const fail = message => report.errors.push(finding('LEARN_TOPIC_LEDGER_INVALID', contractPath, message))
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    fail('capability_ledger 必须是 JSON 对象。')
    return
  }

  let universeIds = []
  let ledgerIds = []
  let zeroChecks = []
  let reportedUniverse = null
  let reportedLedger = null
  let dispositions = []
  let hasInvalidArticleIndex = false
  let articleAssignments = []
  let manifestUniverse = null
  const hasSchemaVersion = isNonEmptyString(payload.schema_version) || Number.isInteger(payload.schema_version)
  if (!hasSchemaVersion) fail('capability_ledger 缺少有效 schema_version。')

  if (payload.capabilities && payload.ledger?.items) {
    if (!isObject(payload.source_manifest)) fail('能力账本缺少对象形式的 source_manifest。')
    universeIds = Object.keys(payload.capabilities)
    ledgerIds = Object.keys(payload.ledger.items)
    reportedUniverse = payload.summary?.official_capabilities
    reportedLedger = payload.summary?.ledger_entries
    const dispositionIndex = payload.ledger.fields?.indexOf('disposition') ?? -1
    const articleIndex = payload.ledger.fields?.indexOf('article') >= 0
      ? payload.ledger.fields.indexOf('article')
      : payload.ledger.fields?.indexOf('target') ?? -1
    dispositions = Object.values(payload.ledger.items).map(item => dispositionIndex >= 0 ? item?.[dispositionIndex] : null)
    articleAssignments = Object.values(payload.ledger.items).map(item => ({
      disposition: dispositionIndex >= 0 ? item?.[dispositionIndex] : null,
      reference: articleIndex >= 0 ? item?.[articleIndex] : null,
    }))
    zeroChecks = ['official_only', 'ledger_only', 'duplicates', 'unassigned']
      .filter(key => Object.hasOwn(payload.summary ?? {}, key))
      .map(key => [key, payload.summary[key]])
  } else if (Array.isArray(payload.official_capabilities) && Array.isArray(payload.coverage_ledger)) {
    if (!isObject(payload.source_manifest)) fail('能力账本缺少对象形式的 source_manifest。')
    universeIds = payload.official_capabilities.map(item => item?.id)
    ledgerIds = payload.coverage_ledger.map(item => item?.id)
    reportedUniverse = payload.collection_summary?.official
    reportedLedger = payload.collection_summary?.ledger
    dispositions = payload.coverage_ledger.map(item => item?.disposition)
    articleAssignments = payload.coverage_ledger.map(item => ({ disposition: item?.disposition, reference: item?.article }))
    zeroChecks = ['official_only', 'ledger_only', 'duplicate', 'undisposed'].map(key => [key, payload.collection_summary?.[key]])
  } else if (Array.isArray(payload.current_universe) && Array.isArray(payload.ledger)) {
    if (!isObject(payload.manifest) || !isObject(payload.sources)) fail('Playwright 压缩账本缺少对象形式的 manifest 或 sources。')
    universeIds = payload.current_universe.map(item => item?.[0])
    ledgerIds = payload.ledger.map(item => item?.[0])
    reportedUniverse = payload.set_summary?.official
    reportedLedger = payload.set_summary?.ledger
    dispositions = payload.ledger.map(item => item?.[1])
    hasInvalidArticleIndex = payload.ledger.some(item => {
      const excluded = item?.[1] === 'excluded' || item?.[1] === '明确不纳入'
      const code = item?.[2]
      return excluded
        ? isNonEmptyString(code) && !Object.hasOwn(payload.articles ?? {}, code)
        : !isNonEmptyString(code) || !Object.hasOwn(payload.articles ?? {}, code)
    })
    articleAssignments = payload.ledger.map(item => ({
      disposition: item?.[1],
      reference: payload.articles?.[item?.[2]] ?? null,
    }))
    zeroChecks = ['official_only', 'ledger_only', 'duplicate', 'undisposed'].map(key => [key, payload.set_summary?.[key]])
  } else if (Array.isArray(payload.current) && payload.codec?.row_fields) {
    if (!Array.isArray(payload.manifest) || payload.manifest.length === 0 || !Array.isArray(payload.sources)) {
      fail('Python 压缩账本缺少非空 manifest 数组或 sources 数组。')
    }
    const stableIdIndex = payload.codec.row_fields.indexOf('stableId')
    if (stableIdIndex < 0) {
      fail('Python 压缩账本缺少 stableId 字段定义。')
      return
    }
    universeIds = payload.current.map(item => item?.[stableIdIndex])
    ledgerIds = [...universeIds]
    reportedUniverse = payload.summary?.universeCount
    reportedLedger = payload.summary?.ledgerCount
    const dispositionIndex = payload.codec.row_fields.indexOf('disposition')
    const articleIndex = payload.codec.row_fields.indexOf('mainArticle')
    const dispositionDictionary = payload.dictionaries?.disposition ?? []
    const articleDictionary = payload.dictionaries?.mainArticle ?? []
    dispositions = payload.current.map(item => dispositionDictionary[item?.[dispositionIndex]])
    hasInvalidArticleIndex = articleIndex < 0 || payload.current.some(item => {
      const value = item?.[articleIndex]
      return !Number.isInteger(value) || value < 0 || !Object.hasOwn(articleDictionary, value)
    })
    articleAssignments = payload.current.map(item => ({
      disposition: dispositionDictionary[item?.[dispositionIndex]],
      reference: articleDictionary[item?.[articleIndex]] ?? null,
    }))
    if (Array.isArray(payload.manifest) && payload.manifest.length > 0 && payload.manifest.every(item => Number.isInteger(item?.count) && item.count >= 0)) {
      manifestUniverse = payload.manifest.reduce((total, item) => total + item.count, 0)
    } else {
      fail('Python 来源清单的每个入口都必须声明非负整数 count。')
    }
    zeroChecks = ['officialOnly', 'ledgerOnly', 'duplicates', 'unassigned'].map(key => [key, payload.summary?.[key]])
  } else {
    fail('capability_ledger 使用了尚未支持的历史格式。')
    return
  }

  if (!universeIds.every(isNonEmptyString) || !ledgerIds.every(isNonEmptyString)) {
    fail('能力全集或处置账本包含空 ID。')
  }
  if (new Set(universeIds).size !== universeIds.length || new Set(ledgerIds).size !== ledgerIds.length) {
    fail('能力全集或处置账本包含重复 ID。')
  }
  if (!sameStringSet(universeIds, ledgerIds)) {
    fail('能力全集与处置账本不是同一闭合集合。')
  }
  if (reportedUniverse !== universeIds.length || reportedLedger !== ledgerIds.length) {
    fail('账本汇总数量与实际条目数量不一致。')
  }
  for (const [key, value] of zeroChecks) {
    if (value !== 0) fail(`账本闭合指标 ${key} 必须为 0。`)
  }
  if (dispositions.length !== ledgerIds.length || !dispositions.every(isNonEmptyString)) {
    fail('处置账本存在未分类条目。')
  }
  if (hasInvalidArticleIndex) fail('能力账本包含无法解析到文章字典的引用。')
  const excludedDispositions = new Set(['excluded', '明确不纳入'])
  for (const assignment of articleAssignments) {
    const excluded = excludedDispositions.has(assignment.disposition)
    if (excluded && assignment.reference !== null && assignment.reference !== undefined && assignment.reference !== '') {
      fail(`处置为 ${assignment.disposition} 的能力不得指定课程文章。`)
    }
    if (!excluded && !isNonEmptyString(assignment.reference)) {
      fail(`处置为 ${assignment.disposition || '<空>'} 的能力必须指定唯一主文章。`)
    }
  }
  if (manifestUniverse !== null && manifestUniverse !== universeIds.length) {
    fail('来源清单 count 总和与能力全集条目数量不一致。')
  }

  const actualTitles = new Set(articles.map(article => article.title))
  for (const reference of new Set(capabilityLedgerReferences(payload, articles))) {
    if (!actualTitles.has(reference)) fail(`能力账本引用了课程中不存在的文章：${reference}`)
  }
}

function validateCourseContract(report, projectRoot, courseKey, articles, seriesNames) {
  const relativeContract = path.posix.join(LEARN_TOPIC_CONTRACT_ROOT, `${courseKey}.json`)
  const contractTarget = path.join(projectRoot, relativeContract)
  if (!existsSync(contractTarget)) {
    report.errors.push(finding('LEARN_TOPIC_CONTRACT_MISSING', relativeContract, '课程缺少第一轮学习大纲与能力账本契约。'))
    return
  }

  let contract
  try {
    contract = readJson(contractTarget)
  } catch {
    report.errors.push(finding('LEARN_TOPIC_CONTRACT_PARSE_FAILED', relativeContract, '课程契约不是有效 JSON。'))
    return
  }

  const fail = message => report.errors.push(finding('LEARN_TOPIC_CONTRACT_INVALID', relativeContract, message))
  if (contract?.schema_version !== 2 || !contract.course || typeof contract.course !== 'object') {
    fail('schema_version 必须为 2，且 course 必须是对象。')
    return
  }
  const course = contract.course
  const topics = course.topics
  const optionalArticles = course.optional_articles
  const declaredArticles = course.articles
  if (course.public_article_contract !== undefined && course.public_article_contract !== 'v1') {
    fail('course.public_article_contract 只能使用当前公开正文合同版本 v1。')
  }
  if (course.forbid_local_absolute_paths !== undefined && typeof course.forbid_local_absolute_paths !== 'boolean') {
    fail('course.forbid_local_absolute_paths 必须是布尔值。')
  }
  if (course.slug !== courseKey) fail('course.slug 必须与课程目录名一致。')
  if (!isNonEmptyString(course.series)) fail('course.series 必须是非空字符串。')
  if (seriesNames.size === 1 && !seriesNames.has(course.series)) fail('course.series 与文章 Front Matter 的 series 不一致。')
  if (!Array.isArray(topics) || topics.length === 0 || !topics.every(isNonEmptyString) || new Set(topics).size !== topics.length) {
    fail('course.topics 必须是非空且不重复的学习主题数组。')
    return
  }
  if (topics.some(topic => topic === LEARN_TOPIC_ENTRY_ARTICLE || topic === LEARN_TOPIC_ADVANCED_ARTICLE || LEARN_TOPIC_FINAL_ARTICLES.has(topic))) {
    fail('course.topics 只能包含第一轮学习主题，不得混入入门、进阶或收束篇。')
  }
  if (!Array.isArray(optionalArticles) || optionalArticles.length > 2 || !optionalArticles.every(isNonEmptyString)) {
    fail('course.optional_articles 必须是 0～2 个可选篇名称。')
    return
  }
  const advancedCount = optionalArticles.filter(name => name === LEARN_TOPIC_ADVANCED_ARTICLE).length
  const finalCount = optionalArticles.filter(name => LEARN_TOPIC_FINAL_ARTICLES.has(name)).length
  if (advancedCount > 1 || finalCount > 1 || optionalArticles.some(name => name !== LEARN_TOPIC_ADVANCED_ARTICLE && !LEARN_TOPIC_FINAL_ARTICLES.has(name))) {
    fail('可选篇最多一篇进阶路线和一篇综合实战、项目实战或知识总结。')
  }
  if (advancedCount === 1 && finalCount === 1 && optionalArticles[0] !== LEARN_TOPIC_ADVANCED_ARTICLE) {
    fail('同时存在两篇可选篇时，进阶路线必须排在收束篇之前。')
  }

  const suffixes = [LEARN_TOPIC_ENTRY_ARTICLE, ...topics, ...optionalArticles]
  if (suffixes.length < topics.length + 1 || suffixes.length > topics.length + 3) {
    fail('系列总数必须是第一轮 N 个主题加 1～3 篇。')
  }
  if (suffixes.length > CHINESE_SEQUENCE.length) {
    fail(`课程文章数量超过当前中文序号上限 ${CHINESE_SEQUENCE.length}。`)
    return
  }
  const expected = suffixes.map((suffix, index) => {
    const title = `${course.series}(${CHINESE_SEQUENCE[index]})${suffix}`
    const kind = index === 0 ? 'entry' : index <= topics.length ? 'topic' : suffix === LEARN_TOPIC_ADVANCED_ARTICLE ? 'advanced' : 'final'
    return { order: index + 1, title, file: `${title}.md`, kind }
  })
  if (!Array.isArray(declaredArticles) || declaredArticles.length !== expected.length) {
    fail('course.articles 必须逐篇声明完整文章清单。')
  } else {
    for (const [index, expectedArticle] of expected.entries()) {
      const declared = declaredArticles[index]
      if (!declared || declared.order !== expectedArticle.order || declared.title !== expectedArticle.title || declared.file !== expectedArticle.file || declared.kind !== expectedArticle.kind) {
        fail(`course.articles 第 ${index + 1} 项与 topics/optional_articles 推导结果不一致。`)
      }
    }
  }

  const actual = [...articles].sort((left, right) => left.order - right.order)
  if (actual.length !== expected.length) {
    fail(`实际课程文章数为 ${actual.length}，契约要求 ${expected.length}。`)
  }
  for (const [index, expectedArticle] of expected.entries()) {
    const actualArticle = actual[index]
    if (!actualArticle || actualArticle.order !== expectedArticle.order || actualArticle.title !== expectedArticle.title || path.basename(actualArticle.file) !== expectedArticle.file) {
      fail(`第 ${index + 1} 篇实际文件、标题或序号与课程契约不一致。`)
    }
  }

  validateCapabilityLedger(report, relativeContract, contract.capability_ledger, actual)
}

export function auditContent({ root = process.cwd(), release = false } = {}) {
  const projectRoot = path.resolve(root)
  const postsRoot = path.join(projectRoot, 'source/_posts')
  const report = reportFor('content', {
    releaseMode: Boolean(release),
    requiredFields: [...CONTENT_REQUIRED_FIELDS],
    postCount: 0,
    learnTopicPostCount: 0,
    checkedFiles: [],
  })

  if (!existsSync(postsRoot)) {
    report.errors.push(finding('POSTS_DIR_MISSING', 'source/_posts', '文章目录不存在。'))
    return finalize(report)
  }

  const files = markdownFilesUnder(postsRoot)

  report.facts.postCount = files.length
  report.facts.checkedFiles = files.map(target => safeRelative(projectRoot, target))
  if (files.length === 0) report.warnings.push(finding('NO_POSTS', 'source/_posts', '没有发现 Markdown 文章。'))

  const abbrlinks = new Map()
  const courseSequences = new Map()
  const courseSeriesNames = new Map()
  const courseArticles = new Map()
  const postTitles = new Map()
  for (const target of files) {
    const relativeFile = safeRelative(projectRoot, target)
    const text = readText(target)
    const parsed = parseFrontMatter(text)
    if (parsed.error) {
      report.errors.push(finding('FRONT_MATTER_PARSE_FAILED', relativeFile, `Front Matter 无法解析，约在第 ${parsed.error.line} 行。`))
      continue
    }

    const data = parsed.data
    if (!markdownBodyLines(text).join('\n').trim()) report.errors.push(finding('ARTICLE_BODY_EMPTY', relativeFile, '文章正文不得为空。'))
    const openFence = unclosedMarkdownFence(text)
    if (openFence) report.errors.push(finding('MARKDOWN_FENCE_UNCLOSED', relativeFile, `第 ${openFence.line} 行开始的代码围栏未闭合。`))
    for (const field of CONTENT_REQUIRED_FIELDS) {
      if (!(field in data)) contentFieldError(report, relativeFile, field, '缺少必需字段')
    }
    if ('title' in data && !isNonEmptyString(data.title)) contentFieldError(report, relativeFile, 'title', '必须是非空字符串')
    if ('description' in data && !isNonEmptyString(data.description)) contentFieldError(report, relativeFile, 'description', '必须是非空字符串')
    if ('tags' in data && !isNonEmptyStringArray(data.tags)) contentFieldError(report, relativeFile, 'tags', '必须是非空字符串数组')
    if ('categories' in data && !isNonEmptyStringArray(data.categories)) contentFieldError(report, relativeFile, 'categories', '必须是非空字符串数组')
    if ('date' in data && !isValidDateValue(data.date, frontMatterScalarValue(text, 'date'))) contentFieldError(report, relativeFile, 'date', '必须是有效的非空日期值')
    if ('published' in data && typeof data.published !== 'boolean') contentFieldError(report, relativeFile, 'published', '存在时必须是布尔值')

    if (isNonEmptyString(data.title)) {
      const normalizedTitle = data.title.trim()
      if (!postTitles.has(normalizedTitle)) postTitles.set(normalizedTitle, [])
      postTitles.get(normalizedTitle).push(relativeFile)
    }

    const headings = markdownHeadings(text)
    for (const heading of headings.filter(item => item.level === 1)) {
      report.errors.push(finding('ARTICLE_BODY_H1_FORBIDDEN', relativeFile, `第 ${heading.line} 行不得使用 H1；文章标题由 Front Matter title 提供。`))
    }
    let previousHeadingLevel = 1
    let currentH2 = ''
    for (const heading of headings) {
      if (heading.level > previousHeadingLevel + 1) {
        report.errors.push(finding('ARTICLE_HEADING_LEVEL_SKIPPED', relativeFile, `第 ${heading.line} 行标题从 H${previousHeadingLevel} 跳到 H${heading.level}。`))
      }
      if (heading.level === 2) currentH2 = heading.text
      const headingIssue = headingStyleIssue(heading, currentH2)
      if (headingIssue) report.errors.push(finding('ARTICLE_HEADING_STYLE_INVALID', relativeFile, headingIssue))
      previousHeadingLevel = heading.level
    }

    if (relativeFile.startsWith(LEGACY_LEARN_ROOT)) {
      report.errors.push(finding('LEARN_TOPIC_LEGACY_PATH', relativeFile, '系统课程必须迁移到 source/_posts/learn-topic/<主题路径段>/。'))
    }

    const isLearnTopic = relativeFile.startsWith(LEARN_TOPIC_ROOT)
    let isValidCoursePlaceholder = false
    let courseArticleKind = null
    if (isLearnTopic) {
      report.facts.learnTopicPostCount += 1
      for (const field of Object.keys(data).filter(field => field.startsWith(LEARN_TOPIC_INTERNAL_FRONT_MATTER_PREFIX))) {
        report.errors.push(finding(
          field === LEARN_TOPIC_LEGACY_LEDGER_FIELD ? 'LEARN_TOPIC_LEDGER_FRONT_MATTER_FORBIDDEN' : 'LEARN_TOPIC_INTERNAL_FRONT_MATTER_FORBIDDEN',
          relativeFile,
          `${field} 是课程内部规划字段，必须迁移到 ${LEARN_TOPIC_CONTRACT_ROOT}/<主题>.json，不得写入文章 Front Matter。`,
        ))
      }
      const pathParts = relativeFile.split('/')
      const courseKey = pathParts[3] ?? ''
      let enforcesPublishedArticleContract = false
      let forbidsLocalAbsolutePaths = false
      const courseContractTarget = path.join(projectRoot, LEARN_TOPIC_CONTRACT_ROOT, `${courseKey}.json`)
      if (existsSync(courseContractTarget)) {
        try {
          const courseContract = readJson(courseContractTarget)
          enforcesPublishedArticleContract = courseContract?.course?.public_article_contract === 'v1'
          forbidsLocalAbsolutePaths = courseContract?.course?.forbid_local_absolute_paths === true
        } catch {
          enforcesPublishedArticleContract = false
          forbidsLocalAbsolutePaths = false
        }
      }
      if (forbidsLocalAbsolutePaths) {
        for (const issue of learnTopicLocalAbsolutePathIssues(text)) {
          report.errors.push(finding(
            'LEARN_TOPIC_LOCAL_ABSOLUTE_PATH_FORBIDDEN',
            relativeFile,
            `第 ${issue.line} 行包含本机文件系统绝对路径 ${issue.text}；请改用 mktemp 变量、相对文件或标准输入输出。`,
          ))
        }
      }
      if (pathParts.length !== 5 || !courseKey) {
        report.errors.push(finding('LEARN_TOPIC_PATH_INVALID', relativeFile, '课程文章必须直接位于 source/_posts/learn-topic/<单个主题路径段>/，不得增加嵌套目录。'))
      }
      const fileName = path.basename(relativeFile)
      const rawFileMatch = fileName.match(/^(.+)\(([一二三四五六七八九十]+)\)([^\s].*)\.md$/)
      const rawTitleMatch = String(data.title ?? '').match(/^(.+)\(([一二三四五六七八九十]+)\)([^\s].*)$/)
      const fileMatch = rawFileMatch && !rawFileMatch[1].endsWith('文档') ? rawFileMatch : null
      const titleMatch = rawTitleMatch && !rawTitleMatch[1].endsWith('文档') ? rawTitleMatch : null
      if (!fileMatch) report.errors.push(finding('LEARN_TOPIC_FILENAME_INVALID', relativeFile, '文件名必须使用 主题(中文序号)简短主题.md，不保留“文档”前缀。'))
      if (!titleMatch) report.errors.push(finding('LEARN_TOPIC_TITLE_INVALID', relativeFile, 'title 必须使用 主题(中文序号)简短主题，不在右括号后留空格。'))
      if (fileMatch && titleMatch && (fileMatch[1] !== titleMatch[1] || fileMatch[2] !== titleMatch[2] || fileMatch[3] !== titleMatch[3])) {
        report.errors.push(finding('LEARN_TOPIC_SEQUENCE_MISMATCH', relativeFile, '文件名与 title 的系列名、中文序号或简短主题不一致。'))
      }
      if (fileMatch && courseKey) {
        const expectedOrder = CHINESE_SEQUENCE.indexOf(fileMatch[2]) + 1
        courseArticleKind = learnTopicArticleKind(expectedOrder, fileMatch[3])
        if (expectedOrder === 1 && fileMatch[3] !== '入门路线') {
          report.errors.push(finding('LEARN_TOPIC_ENTRY_ROUTE_INVALID', relativeFile, '系列第一篇必须命名为 主题(一)入门路线。'))
        }
        if (fileMatch[3] === '进阶内容') {
          report.errors.push(finding('LEARN_TOPIC_ADVANCED_ROUTE_INVALID', relativeFile, '可选进阶篇必须使用“进阶路线”，不得使用“进阶内容”。'))
        }
        if (!courseSequences.has(courseKey)) courseSequences.set(courseKey, [])
        courseSequences.get(courseKey).push(expectedOrder)
        if (!courseArticles.has(courseKey)) courseArticles.set(courseKey, [])
        courseArticles.get(courseKey).push({
          order: expectedOrder,
          title: String(data.title ?? ''),
          suffix: fileMatch[3],
          file: relativeFile,
        })

        if (!isNonEmptyString(data.series)) {
          report.errors.push(finding('LEARN_TOPIC_SERIES_INVALID', relativeFile, '课程文章必须声明非空 series。'))
        } else {
          if (!courseSeriesNames.has(courseKey)) courseSeriesNames.set(courseKey, new Set())
          courseSeriesNames.get(courseKey).add(data.series.trim())
        }

        if (!Number.isInteger(data.series_order) || data.series_order <= 0) {
          report.errors.push(finding('LEARN_TOPIC_SERIES_ORDER_INVALID', relativeFile, 'series_order 必须是正整数。'))
        } else if (data.series_order !== expectedOrder) {
          report.errors.push(finding('LEARN_TOPIC_SERIES_ORDER_MISMATCH', relativeFile, 'series_order 必须与文件名中的中文序号一致。'))
        }
      }

      const courseTags = renderedTagTokens(text)
      if (data.published === true && enforcesPublishedArticleContract && !courseTags.some(token => LEARN_TOPIC_SEMANTIC_BLOCK_TAGS.has(token.name))) {
        report.errors.push(finding('LEARN_TOPIC_VISUAL_COMPOSITION_MISSING', relativeFile, '公开课程正文必须至少包含一个承担真实信息结构的块级标签；仅有 course_series、资料链接、行内标签或纯 Markdown 正文不满足可读性合同。'))
      }
      const courseNavigationCount = courseTags.filter(token => token.name === 'course_series').length
      if (courseNavigationCount !== 1) {
        report.errors.push(finding('LEARN_TOPIC_COURSE_SERIES_MISSING', relativeFile, '课程文章正文必须且只能使用一次 {% course_series %}。'))
      }
      if (courseTags.some(token => token.name === 'series')) {
        report.errors.push(finding('LEARN_TOPIC_BUILTIN_SERIES_USED', relativeFile, '系统课程不得使用按标题或日期排序的 Butterfly {% series %}。'))
      }
      for (const fence of markdownFenceBlocks(text).filter(item => item.info.toLowerCase() === 'mermaid')) {
        report.errors.push(finding('LEARN_TOPIC_MERMAID_FENCE_FORBIDDEN', relativeFile, `第 ${fence.line} 行 Mermaid 必须使用 {% mermaid %} 与 {% endmermaid %}。`))
      }

      if (frontMatterFieldSpansPhysicalLines(rawFrontMatter(text), 'description')) {
        report.errors.push(finding('LEARN_TOPIC_DESCRIPTION_BLOCK', relativeFile, 'description 必须是单行普通 YAML 字符串。'))
      }
      if (!Object.hasOwn(data, 'published')) {
        report.errors.push(finding('LEARN_TOPIC_PUBLISHED_MISSING', relativeFile, '课程文章必须显式声明 published 布尔值。'))
      }
      const hasPlaceholderMarker = text.includes(LEARN_TOPIC_PLACEHOLDER_MARKER)
      if (data.published === false && !hasPlaceholderMarker) {
        report.errors.push(finding('LEARN_TOPIC_FALSE_WITHOUT_PLACEHOLDER', relativeFile, '只有带占位标记的课程占位文章可以使用 published: false。'))
      }
      if (data.published === true && hasPlaceholderMarker) {
        report.errors.push(finding('LEARN_TOPIC_PUBLISHED_PLACEHOLDER', relativeFile, '公开正文不得保留课程占位标记。'))
      }
      if (data.published === false && hasPlaceholderMarker) {
        const placeholderHeadings = markdownH2Headings(text)
        const hasPlaceholderContract = [...LEARN_TOPIC_PLACEHOLDER_HEADINGS].every(heading => placeholderHeadings.includes(heading))
        const hasDraftContract = hasCourseDraftBody(placeholderHeadings)
        if (!hasPlaceholderContract && !hasDraftContract) {
          report.errors.push(finding('LEARN_TOPIC_PLACEHOLDER_CONTRACT_MISSING', relativeFile, '课程占位文章必须包含“文章职责”“内容边界”“正文编排”“视觉与复习”和“验收证据”合同。'))
        } else {
          isValidCoursePlaceholder = true
        }
      }

      const h2Headings = markdownH2Headings(text)
      if (data.published === true && enforcesPublishedArticleContract) {
        for (const issue of learnTopicPublicCopyIssues(text)) {
          report.errors.push(finding(issue.code, relativeFile, `第 ${issue.line} 行包含不应出现在公开正文中的课程导航、进度、能力账本或内部合同文案：${issue.text}`))
        }
        for (const block of learnTopicPlainBodyBlocks(text)) {
          report.errors.push(finding(
            'LEARN_TOPIC_PLAIN_BODY_BLOCK',
            relativeFile,
            `第 ${block.line} 行起存在标签外的解释性正文块；请用语义块级标签承载，或改写为标题、代码、表格、列表或必要的结构连接：${block.text.slice(0, 120)}`,
          ))
        }
      }
      if (h2Headings.includes('来源') || h2Headings.includes('来源与核验范围')) {
        report.errors.push(finding('LEARN_TOPIC_SOURCE_HEADING', relativeFile, '公开课程统一使用“参考资料”，不得使用“来源”或“来源与核验范围”。'))
      }
      const publicInternalHeadings = new Set([
        ...LEARN_TOPIC_FORBIDDEN_PUBLIC_HEADINGS,
        ...LEARN_TOPIC_PLACEHOLDER_HEADINGS,
        ...LEARN_TOPIC_LEGACY_PLACEHOLDER_HEADINGS,
      ])
      for (const heading of markdownHeadings(text).filter(item => [2, 3].includes(item.level) && publicInternalHeadings.has(item.text))) {
        if ((data.published === true && enforcesPublishedArticleContract) || heading.text === '统一封面与文章收尾') {
          report.errors.push(finding('LEARN_TOPIC_META_HEADING_FORBIDDEN', relativeFile, `第 ${heading.line} 行的 H${heading.level}“${heading.text}”属于课程生产元信息或冗余路线文案；请改为主题相关的简洁标题。`))
        }
      }
      if (/核验于\s*\d{4}-\d{2}-\d{2}/.test(text)) {
        report.errors.push(finding('LEARN_TOPIC_VERIFICATION_COPY', relativeFile, '公开课程不得包含“核验于 YYYY-MM-DD”文案。'))
      }
      if (data.published === true && courseArticleKind === 'entry') {
        if (JSON.stringify(h2Headings) !== JSON.stringify(LEARN_TOPIC_ENTRY_HEADINGS)) {
          report.errors.push(finding('LEARN_TOPIC_ENTRY_HEADINGS_INVALID', relativeFile, `入门路线 H2 必须按顺序使用：${LEARN_TOPIC_ENTRY_HEADINGS.join('、')}。`))
        }
        const entryCards = renderedTagTokens(text).filter(token => token.name === 'flashcard' || token.name === 'flashcard_ref')
        if (entryCards.length > 0) {
          report.errors.push(finding('LEARN_TOPIC_ENTRY_FLASHCARD_FORBIDDEN', relativeFile, `入门路线不得包含 flashcard 或 flashcard_ref（第 ${entryCards[0].line} 行）。`))
        }
        if (!renderedTagTokens(text).some(token => token.name === 'mermaid')) {
          report.errors.push(finding('LEARN_TOPIC_ENTRY_MERMAID_REQUIRED', relativeFile, '入门路线必须用 Mermaid 展示学习路径，不得只用文字描述。'))
        }
        if (!renderedTagTokens(text).some(token => token.name === 'note')) {
          report.errors.push(finding('LEARN_TOPIC_ENTRY_NOTE_REQUIRED', relativeFile, '入门路线必须用 note 提示主题范围或学习边界。'))
        }
      } else if (data.published === true && courseArticleKind !== 'entry') {
        if (h2Headings.includes('常见问题')) {
          const faqTags = renderedTagTokens(markdownSection(text, '常见问题'))
          if (!faqTags.some(token => token.name === 'flashcard' || token.name === 'flashcard_ref')) {
            report.errors.push(finding('LEARN_TOPIC_FAQ_FLASHCARD_REQUIRED', relativeFile, '存在“常见问题”时必须使用 flashcard 或 flashcard_ref；没有真实复习题时请删除该章节。'))
          }
        }
        if (h2Headings.at(-1) !== '参考资料') {
          report.errors.push(finding('LEARN_TOPIC_REFERENCE_HEADING_REQUIRED', relativeFile, '公开主题文章和实战文章最后一个 H2 必须是“参考资料”。'))
        }
      }
      if (data.published === true) {
        for (const card of text.matchAll(/\{%\s*flashcard\b[\s\S]*?\{%\s*endflashcard\s*%\}/g)) {
          if (LEARN_TOPIC_NAVIGATION_CARD_PATTERN.test(card[0])) {
            report.errors.push(finding('LEARN_TOPIC_NAVIGATION_CARD_FORBIDDEN', relativeFile, `第 ${lineForOffset(text, card.index)} 行闪卡是课程导航问题，不属于主题复习内容。`))
          }
        }
        const referenceSection = markdownSection(text, '参考资料')
        const referenceTags = renderedTagTokens(referenceSection)
        const referenceLinks = courseReferenceLinks(text, projectRoot)
        if (!referenceTags.some(token => token.name === 'linkgroup') || !referenceTags.some(token => token.name === 'link')) {
          report.errors.push(finding('LEARN_TOPIC_REFERENCE_TAG_REQUIRED', relativeFile, '公开课程的“参考资料”必须使用 {% linkgroup %} 包裹至少一个 {% link %} 资料卡片。'))
        }
        if (referenceLinks.length === 0) {
          report.errors.push(finding('LEARN_TOPIC_REFERENCE_LINK_REQUIRED', relativeFile, '公开课程的“参考资料”必须包含至少一个 HTTP(S) 资料链接。'))
        }
        for (const reference of referenceLinks) {
          if (!isValidHttpUrl(reference.target)) {
            report.errors.push(finding('LEARN_TOPIC_REFERENCE_LINK_INVALID', relativeFile, `第 ${reference.line} 行“参考资料”中的 ${reference.kind} 链接不是有效的 HTTP(S) 地址。`))
          }
          if (reference.kind === 'tag' && (!reference.imageValid || reference.image === reference.target)) {
            report.errors.push(finding(
              'LEARN_TOPIC_REFERENCE_PREVIEW_INVALID',
              relativeFile,
              `第 ${reference.line} 行“${reference.title || '参考资料'}”必须提供与资料域名相关、可识别为图标的预览图；禁止省略图片、使用 avatar/cover/placeholder 或把资料页面本身当作图片。`,
            ))
          }
        }
      }
      if (data.published !== true) {
        for (const reference of courseReferenceLinks(text, projectRoot)) {
          if (!isValidHttpUrl(reference.target)) {
            report.errors.push(finding('LEARN_TOPIC_REFERENCE_LINK_INVALID', relativeFile, `第 ${reference.line} 行“参考资料”中的 ${reference.kind} 链接不是有效的 HTTP(S) 地址。`))
          }
          if (reference.kind === 'tag' && (!reference.imageValid || reference.image === reference.target)) {
            report.errors.push(finding(
              'LEARN_TOPIC_REFERENCE_PREVIEW_INVALID',
              relativeFile,
              `第 ${reference.line} 行“${reference.title || '参考资料'}”必须提供与资料域名相关、可识别为图标的预览图；禁止省略图片、使用 avatar/cover/placeholder 或把资料页面本身当作图片。`,
            ))
          }
        }
      }
    } else if (data.published === false) {
      report.errors.push(finding('PUBLISHED_FALSE_NOT_COURSE_PLACEHOLDER', relativeFile, 'published: false 只允许用于带占位合同和占位标记的系统课程文章。'))
    }

    if (!isLearnTopic) {
      for (const reference of courseReferenceLinks(text, projectRoot)) {
        if (!isValidHttpUrl(reference.target)) {
          report.errors.push(finding('REFERENCE_LINK_INVALID', relativeFile, `第 ${reference.line} 行“参考资料”中的 ${reference.kind} 链接不是有效的 HTTP(S) 地址。`))
        }
        if (reference.kind === 'tag' && (!reference.imageValid || reference.image === reference.target)) {
          report.errors.push(finding(
            'REFERENCE_PREVIEW_INVALID',
            relativeFile,
            `第 ${reference.line} 行“${reference.title || '参考资料'}”必须提供与资料域名相关、可识别为图标的预览图；禁止省略图片、使用 avatar/cover/placeholder 或把资料页面本身当作图片。`,
          ))
        }
      }
    }

    const abbrlink = data.abbrlink
    if (abbrlink === undefined || abbrlink === null || String(abbrlink).trim() === '') {
      if (isValidCoursePlaceholder) continue
      const item = finding(
        release ? 'ABBRLINK_MISSING' : 'ABBRLINK_PENDING',
        relativeFile,
        release ? '发布前必须由 hexo-abbrlink 生成 abbrlink。' : '当前可在构建前缺省；构建后需要重新校验。',
      )
      if (release) report.blockers.push(item)
      else report.warnings.push(item)
      continue
    }

    const normalized = String(abbrlink).trim()
    if (!abbrlinks.has(normalized)) abbrlinks.set(normalized, [])
    abbrlinks.get(normalized).push(relativeFile)
  }

  for (const filesWithSameLink of abbrlinks.values()) {
    if (filesWithSameLink.length < 2) continue
    for (const relativeFile of filesWithSameLink) {
      report.blockers.push(finding('ABBRLINK_DUPLICATE', relativeFile, 'abbrlink 与另一篇文章重复。'))
    }
  }

  for (const [title, filesWithSameTitle] of postTitles) {
    if (filesWithSameTitle.length < 2) continue
    for (const relativeFile of filesWithSameTitle) {
      report.errors.push(finding('ARTICLE_TITLE_DUPLICATE', relativeFile, `文章 title 与其他文件重复：${title}`))
    }
  }

  for (const [courseKey, sequence] of courseSequences) {
    const numbers = sequence.sort((left, right) => left - right)
    const expected = Array.from({ length: numbers.length }, (_, index) => index + 1)
    if (numbers.some((number, index) => number !== expected[index])) {
      report.errors.push(finding('LEARN_TOPIC_SEQUENCE_INVALID', `${LEARN_TOPIC_ROOT}${courseKey}`, '课程中文序号必须从一开始连续且不重复。'))
    }
  }

  for (const [courseKey, seriesNames] of courseSeriesNames) {
    if (seriesNames.size > 1) {
      report.errors.push(finding('LEARN_TOPIC_SERIES_MISMATCH', `${LEARN_TOPIC_ROOT}${courseKey}`, '同一课程的 series 必须保持一致。'))
    }
  }


  for (const [courseKey, articles] of courseArticles) {
    validateCourseContract(report, projectRoot, courseKey, articles, courseSeriesNames.get(courseKey) ?? new Set())
  }

  return finalize(report)
}

export function auditTags({ root = process.cwd() } = {}) {
  const projectRoot = path.resolve(root)
  const report = reportFor('tags', {
    plugin: {
      package: TAG_PLUGIN_PACKAGE,
      baselineVersion: TAG_PLUGIN_BASELINE_VERSION,
      declaredVersion: null,
      installedVersion: null,
      configurationSource: null,
      enabled: null,
      priority: null,
      issuesEnabled: null,
      rendererDeclared: false,
      registeredTags: [],
      containerTags: [...TAG_PLUGIN_CONTAINER_TAGS],
    },
    flashcardPlugin: {
      package: FLASHCARD_PLUGIN_PACKAGE,
      declaredVersion: null,
      installedVersion: null,
      configurationSource: null,
      path: null,
      assetPath: null,
    },
    usage: {
      markdownFileCount: 0,
      registeredTags: [],
      registeredContainerTags: [],
      usedPluginTags: [],
      usedFlashcardTags: [],
      tagCounts: {},
    },
  })

  const packageTarget = path.join(projectRoot, 'package.json')
  if (!existsSync(packageTarget)) {
    report.errors.push(finding('PACKAGE_JSON_MISSING', 'package.json', '无法核对外挂标签依赖。'))
  } else {
    try {
      const projectPackage = readJson(packageTarget)
      const dependencies = { ...(projectPackage.dependencies || {}), ...(projectPackage.devDependencies || {}) }
      report.facts.plugin.declaredVersion = dependencies[TAG_PLUGIN_PACKAGE] ?? null
      report.facts.flashcardPlugin.declaredVersion = dependencies[FLASHCARD_PLUGIN_PACKAGE] ?? null
      report.facts.plugin.rendererDeclared = Boolean(dependencies['hexo-renderer-kramed'])
      if (!report.facts.plugin.declaredVersion) {
        report.errors.push(finding('TAG_PLUGIN_DEPENDENCY_UNDECLARED', 'package.json', `${TAG_PLUGIN_PACKAGE} 未声明为项目依赖。`))
      }
      if (!report.facts.plugin.rendererDeclared) {
        report.warnings.push(finding('TAG_RENDERER_COMPATIBILITY_RISK', 'package.json', '未声明 hexo-renderer-kramed，复杂外挂标签可能与 Markdown 渲染器不兼容。'))
      }
    } catch {
      report.errors.push(finding('JSON_PARSE_FAILED', 'package.json', 'package.json 无法解析。'))
    }
  }

  const flashcardPackageTarget = path.join(projectRoot, 'node_modules', FLASHCARD_PLUGIN_PACKAGE, 'package.json')
  if (existsSync(flashcardPackageTarget)) {
    try {
      report.facts.flashcardPlugin.installedVersion = readJson(flashcardPackageTarget)?.version ?? null
    } catch {
      report.errors.push(finding('FLASHCARD_PLUGIN_PACKAGE_INVALID', path.posix.join('node_modules', FLASHCARD_PLUGIN_PACKAGE, 'package.json'), '闪卡插件包元数据无法解析。'))
    }
  } else if (report.facts.flashcardPlugin.declaredVersion) {
    report.errors.push(finding('FLASHCARD_PLUGIN_NOT_INSTALLED', path.posix.join('node_modules', FLASHCARD_PLUGIN_PACKAGE), '已声明闪卡插件但当前未安装。'))
  }

  const pluginPackageTarget = path.join(projectRoot, 'node_modules', TAG_PLUGIN_PACKAGE, 'package.json')
  const pluginSourceTarget = path.join(projectRoot, 'node_modules', TAG_PLUGIN_PACKAGE, 'index.js')
  if (!existsSync(pluginPackageTarget) || !existsSync(pluginSourceTarget)) {
    report.errors.push(finding('TAG_PLUGIN_NOT_INSTALLED', path.posix.join('node_modules', TAG_PLUGIN_PACKAGE), '未发现可检查的已安装外挂标签插件。'))
  } else {
    try {
      report.facts.plugin.installedVersion = readJson(pluginPackageTarget).version ?? null
    } catch {
      report.errors.push(finding('JSON_PARSE_FAILED', path.posix.join('node_modules', TAG_PLUGIN_PACKAGE, 'package.json'), '外挂标签插件元数据无法解析。'))
    }

    const registeredTags = registeredTagNames(readText(pluginSourceTarget))
    report.facts.plugin.registeredTags = registeredTags
    const missingTags = TAG_PLUGIN_EXPECTED_TAGS.filter(name => !registeredTags.includes(name))
    if (missingTags.length > 0) {
      report.errors.push(finding(
        'TAG_PLUGIN_REGISTRATION_MISSING',
        path.posix.join('node_modules', TAG_PLUGIN_PACKAGE, 'index.js'),
        `当前插件缺少 Skill 基线中的标签注册：${missingTags.join(', ')}。`,
      ))
    }
  }

  if (report.facts.plugin.installedVersion && report.facts.plugin.installedVersion !== TAG_PLUGIN_BASELINE_VERSION) {
    report.warnings.push(finding(
      'TAG_PLUGIN_VERSION_DRIFT',
      path.posix.join('node_modules', TAG_PLUGIN_PACKAGE, 'package.json'),
      `已安装版本为 ${report.facts.plugin.installedVersion}，使用标签前需要重新核对当前源码。`,
    ))
  }

  const hexoConfig = parseProjectYaml(report, projectRoot, '_config.yml', 'HEXO_CONFIG_MISSING')
  const butterflyConfig = parseProjectYaml(report, projectRoot, '_config.butterfly.yml', 'BUTTERFLY_CONFIG_MISSING')
  let tagPluginConfig = null
  if (isObject(hexoConfig?.tag_plugins)) {
    tagPluginConfig = hexoConfig.tag_plugins
    report.facts.plugin.configurationSource = '_config.yml'
  } else if (isObject(butterflyConfig?.tag_plugins)) {
    tagPluginConfig = butterflyConfig.tag_plugins
    report.facts.plugin.configurationSource = '_config.butterfly.yml'
  }

  if (!tagPluginConfig) {
    report.errors.push(finding('TAG_PLUGIN_CONFIG_MISSING', '_config.butterfly.yml', '未发现 tag_plugins 配置。'))
  } else {
    report.facts.plugin.enabled = tagPluginConfig.enable === true
    report.facts.plugin.priority = tagPluginConfig.priority ?? null
    report.facts.plugin.issuesEnabled = tagPluginConfig.issues === true
    if (!report.facts.plugin.enabled) {
      report.errors.push(finding('TAG_PLUGIN_DISABLED', report.facts.plugin.configurationSource, 'tag_plugins.enable 未开启。'))
    }
    if (!isObject(tagPluginConfig.CDN)) {
      report.errors.push(finding('TAG_PLUGIN_CDN_CONFIG_MISSING', report.facts.plugin.configurationSource, 'tag_plugins.CDN 必须是映射，插件生成阶段会读取该配置。'))
    }
    if (!isObject(tagPluginConfig.link) || !isNonEmptyString(tagPluginConfig.link.placeholder)) {
      report.errors.push(finding('TAG_PLUGIN_LINK_CONFIG_MISSING', report.facts.plugin.configurationSource, 'tag_plugins.link.placeholder 未配置。'))
    }
  }

  const flashcardConfig = hexoConfig?.flashcard
  if (isObject(flashcardConfig)) {
    report.facts.flashcardPlugin.configurationSource = '_config.yml'
    report.facts.flashcardPlugin.path = flashcardConfig.path ?? null
    report.facts.flashcardPlugin.assetPath = flashcardConfig.asset_path ?? null
  } else if (report.facts.flashcardPlugin.declaredVersion) {
    report.errors.push(finding('FLASHCARD_PLUGIN_CONFIG_MISSING', '_config.yml', '已声明闪卡插件但缺少 flashcard 配置。'))
  }

  const markdownFiles = markdownFilesUnder(path.join(projectRoot, 'source'))
  report.facts.usage.markdownFileCount = markdownFiles.length
  const tagCounts = new Map()
  const usedPluginTags = new Set()
  const expectedTags = new Set(TAG_PLUGIN_EXPECTED_TAGS)
  const registry = installedTagRegistry(projectRoot)
  report.facts.usage.registeredTags = [...registry.tags].sort()
  report.facts.usage.registeredContainerTags = [...registry.containers].sort()

  for (const target of markdownFiles) {
    const relativeFile = safeRelative(projectRoot, target)
    const tokens = renderedTagTokens(readText(target))
    checkTagContainers(report, relativeFile, tokens, registry.containers)

    for (const token of tokens) {
      tagCounts.set(token.name, (tagCounts.get(token.name) ?? 0) + 1)
      if (!token.name.startsWith('end') && !registry.tags.has(token.name)) {
        report.errors.push(finding('TAG_UNREGISTERED', relativeFile, `第 ${token.line} 行使用了未在当前 Hexo 项目注册的标签 ${token.name}。`))
      }
      if (expectedTags.has(token.name)) usedPluginTags.add(token.name)
      if (token.name === 'issues' && report.facts.plugin.issuesEnabled === false) {
        report.errors.push(finding('TAG_CAPABILITY_DISABLED', relativeFile, `第 ${token.line} 行使用了 issues，但 tag_plugins.issues 当前关闭。`))
      }
    }
  }

  if (tagCounts.has('mermaid') && butterflyConfig?.mermaid?.enable !== true) {
    report.errors.push(finding('TAG_CAPABILITY_DISABLED', '_config.butterfly.yml', '文章使用了 mermaid，但 mermaid.enable 未开启。'))
  }
  if (tagCounts.has('chartjs') && butterflyConfig?.chartjs?.enable !== true) {
    report.errors.push(finding('TAG_CAPABILITY_DISABLED', '_config.butterfly.yml', '文章使用了 chartjs，但 chartjs.enable 未开启。'))
  }

  report.facts.usage.usedPluginTags = [...usedPluginTags].sort()
  report.facts.usage.usedFlashcardTags = ['flashcard', 'flashcard_ref'].filter(name => tagCounts.has(name))
  report.facts.usage.tagCounts = Object.fromEntries([...tagCounts.entries()].sort(([left], [right]) => left.localeCompare(right)))
  validateFlashcards(report, projectRoot, markdownFiles, tagCounts)
  return finalize(report)
}

function parseProjectYaml(report, root, relativeFile, missingCode) {
  const target = path.join(root, relativeFile)
  if (!existsSync(target)) {
    report.errors.push(finding(missingCode, relativeFile, '必需配置文件不存在。'))
    return null
  }
  try {
    return parseYaml(readText(target))
  } catch (error) {
    report.errors.push(finding('YAML_PARSE_FAILED', relativeFile, `YAML 无法解析，约在第 ${Number(error?.mark?.line ?? 0) + 1} 行。`))
    return null
  }
}

export function auditProject({ root = process.cwd() } = {}) {
  const projectRoot = path.resolve(root)
  const report = reportFor('project', {
    projectRootType: existsSync(path.join(projectRoot, '.git')) ? 'git' : 'directory',
    runtime: { node: process.versions.node, requiredNode: null, compatible: null },
    packages: { hexo: null, butterfly: null },
    site: { url: null, theme: null },
    deploy: { type: null, repo: null, branch: null },
    activeFeatures: {},
    localInjectedAssets: [],
    sensitiveKeyLocations: [],
    git: {},
  })

  const requiredPaths = ['package.json', '_config.yml', '_config.butterfly.yml', 'scaffolds/post.md', 'scripts/course-series.js', 'source/_posts', 'themes/butterfly']
  for (const relativePath of requiredPaths) {
    if (!existsSync(path.join(projectRoot, relativePath))) {
      report.errors.push(finding('REQUIRED_PATH_MISSING', relativePath, '项目必需路径不存在。'))
    }
  }

  const packageTarget = path.join(projectRoot, 'package.json')
  if (existsSync(packageTarget)) {
    try {
      const projectPackage = readJson(packageTarget)
      report.facts.packages.declaredHexo = projectPackage?.dependencies?.hexo ?? null
    } catch {
      report.errors.push(finding('JSON_PARSE_FAILED', 'package.json', 'package.json 无法解析。'))
    }
  }

  const installedHexoTarget = path.join(projectRoot, 'node_modules/hexo/package.json')
  if (existsSync(installedHexoTarget)) {
    try {
      const installedHexo = readJson(installedHexoTarget)
      report.facts.packages.hexo = installedHexo.version ?? null
      report.facts.runtime.requiredNode = minimumVersion(installedHexo?.engines?.node)
      if (report.facts.runtime.requiredNode) {
        report.facts.runtime.compatible = compareVersions(process.versions.node, report.facts.runtime.requiredNode) >= 0
        if (!report.facts.runtime.compatible) {
          report.errors.push(finding('LOCAL_NODE_INCOMPATIBLE', 'node', '当前 Node.js 低于已安装 Hexo 的最低要求。'))
        }
      }
    } catch {
      report.errors.push(finding('JSON_PARSE_FAILED', 'node_modules/hexo/package.json', '已安装 Hexo 元数据无法解析。'))
    }
  } else {
    report.warnings.push(finding('DEPENDENCIES_NOT_INSTALLED', 'node_modules/hexo', '未发现已安装的 Hexo，无法核对本地运行时。'))
  }

  const themePackageTarget = path.join(projectRoot, 'themes/butterfly/package.json')
  if (existsSync(themePackageTarget)) {
    try {
      report.facts.packages.butterfly = readJson(themePackageTarget).version ?? null
    } catch {
      report.warnings.push(finding('JSON_PARSE_FAILED', 'themes/butterfly/package.json', '主题包元数据无法解析。'))
    }
  }

  const hexoConfig = parseProjectYaml(report, projectRoot, '_config.yml', 'HEXO_CONFIG_MISSING')
  if (hexoConfig) {
    report.facts.site.url = sanitizeUrl(hexoConfig.url)
    report.facts.site.theme = typeof hexoConfig.theme === 'string' ? hexoConfig.theme : null
    report.facts.deploy.type = typeof hexoConfig?.deploy?.type === 'string' ? hexoConfig.deploy.type : null
    report.facts.deploy.repo = sanitizeUrl(hexoConfig?.deploy?.repo)
    report.facts.deploy.branch = typeof hexoConfig?.deploy?.branch === 'string' ? hexoConfig.deploy.branch : null
  }

  const butterflyConfig = parseProjectYaml(report, projectRoot, '_config.butterfly.yml', 'BUTTERFLY_CONFIG_MISSING')
  if (butterflyConfig) {
    const featurePaths = {
      search: 'search.use',
      comments: 'comments.use',
      pjax: 'pjax.enable',
      lazyload: 'lazyload.enable',
      darkmode: 'darkmode.enable',
      readmode: 'readmode',
      translate: 'translate.enable',
      wordcount: 'wordcount.enable',
      series: 'series.enable',
      abcjs: 'abcjs.enable',
      mermaid: 'mermaid.enable',
      chartjs: 'chartjs.enable',
    }
    for (const [feature, dottedPath] of Object.entries(featurePaths)) {
      const value = getPath(butterflyConfig, dottedPath)
      if (typeof value === 'boolean' || typeof value === 'string') report.facts.activeFeatures[feature] = value
    }

    report.facts.localInjectedAssets = localInjectedAssets(butterflyConfig)
    for (const asset of report.facts.localInjectedAssets) {
      const target = path.join(projectRoot, 'source', asset.replace(/^\//, ''))
      if (!existsSync(target)) {
        report.warnings.push(finding('INJECTED_ASSET_MISSING', path.posix.join('source', asset), 'Butterfly 注入配置引用的本地资源不存在。'))
      }
    }
  }

  const scaffoldTarget = path.join(projectRoot, 'scaffolds/post.md')
  if (existsSync(scaffoldTarget)) {
    const keys = new Set(topLevelFrontMatterKeys(readText(scaffoldTarget)))
    const missing = CONTENT_REQUIRED_FIELDS.filter(field => !keys.has(field))
    if (missing.length > 0) {
      report.warnings.push(finding('SCAFFOLD_SCHEMA_DRIFT', 'scaffolds/post.md', `文章脚手架缺少 Skill 所需字段：${missing.join(', ')}。`))
    }
  }

  const workflowTarget = path.join(projectRoot, '.github/workflows/deploy.yml')
  if (existsSync(workflowTarget) && report.facts.runtime.requiredNode) {
    const workflowText = readText(workflowTarget)
    const match = workflowText.match(/node-version:\s*["']?(\d+(?:\.\d+){0,2})/i)
    if (match) {
      report.facts.runtime.ciNode = match[1]
      if (compareVersions(match[1], report.facts.runtime.requiredNode) < 0) {
        report.warnings.push(finding('CI_NODE_INCOMPATIBLE', '.github/workflows/deploy.yml', 'GitHub Actions 的 Node.js 版本低于已安装 Hexo 的最低要求。'))
      }
    }
  }

  const rootGit = inspectGit(projectRoot)
  const themeGit = inspectGit(path.join(projectRoot, 'themes/butterfly'))
  const deployGit = inspectGit(path.join(projectRoot, '.deploy_git'))
  report.facts.git = { root: rootGit, theme: themeGit, deploy: deployGit }

  if (!rootGit.present) report.warnings.push(finding('ROOT_NOT_GIT', '.', '项目根目录没有 Git 元数据，无法提供源码级回滚证据。'))
  if (!themeGit.present) report.warnings.push(finding('THEME_NOT_GIT', 'themes/butterfly', '主题目录不是可检查的独立 Git 工作树。'))
  else if (themeGit.dirty === null) report.warnings.push(finding('THEME_STATUS_UNKNOWN', 'themes/butterfly', '无法读取主题 Git 状态。'))
  else if (themeGit.dirty) report.warnings.push(finding('THEME_DIRTY', 'themes/butterfly', `主题工作树存在 ${themeGit.entries} 个未提交状态项。`))

  if (!deployGit.present) report.warnings.push(finding('DEPLOY_WORKTREE_MISSING', '.deploy_git', '没有发现可检查的部署 Git 工作树。'))
  else if (deployGit.dirty === null) report.warnings.push(finding('DEPLOY_STATUS_UNKNOWN', '.deploy_git', '无法读取部署 Git 状态。'))
  else if (deployGit.dirty) report.warnings.push(finding('DEPLOY_WORKTREE_DIRTY', '.deploy_git', `部署工作树存在 ${deployGit.entries} 个未提交状态项。`))

  const javascriptFiles = path.join(projectRoot, 'source/js')
  const sensitiveFiles = ['_config.yml', '_config.butterfly.yml']
  if (existsSync(javascriptFiles)) {
    sensitiveFiles.push(...readdirSync(javascriptFiles, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
      .map(entry => path.posix.join('source/js', entry.name)))
  }
  report.facts.sensitiveKeyLocations = sensitiveKeyLocations(projectRoot, sensitiveFiles)

  return finalize(report)
}

const COMMON_RELEASE_BLOCKERS = new Set([
  'ROOT_NOT_GIT',
  'THEME_NOT_GIT',
  'THEME_DIRTY',
  'THEME_STATUS_UNKNOWN',
  'LOCAL_NODE_INCOMPATIBLE',
])

function allEntriesUnder(root) {
  if (!existsSync(root)) return []
  const entries = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name)
    entries.push({ target, entry })
    if (entry.isDirectory()) entries.push(...allEntriesUnder(target))
  }
  return entries
}

function repositoryEntries(root, current = root) {
  if (!existsSync(current)) return []
  const entries = []
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    if (REPOSITORY_IGNORED_DIRECTORIES.has(entry.name)) continue
    if (current === root && REPOSITORY_IGNORED_ROOT_FILES.has(entry.name)) continue
    const target = path.join(current, entry.name)
    const relative = safeRelative(root, target)
    if (relative === 'themes/butterfly') continue
    entries.push({ target, entry, relative })
    if (entry.isDirectory()) entries.push(...repositoryEntries(root, target))
  }
  return entries
}

function symlinkTarget(target) {
  try {
    return readlinkSync(target)
  } catch {
    return null
  }
}

function lineForOffset(text, offset) {
  return text.slice(0, Math.max(0, offset)).split(/\r?\n/).length
}

function learnTopicLocalAbsolutePathIssues(text) {
  const issues = []
  for (const pattern of LEARN_TOPIC_LOCAL_ABSOLUTE_PATH_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      issues.push({ line: lineForOffset(text, match.index), text: match[0] })
    }
  }
  return issues.sort((left, right) => left.line - right.line || left.text.localeCompare(right.text))
}

function cssSyntaxError(text) {
  const frames = [{ kind: 'root', statementStart: 0 }]
  const pairs = []
  let quote = null
  let escaped = false
  let comment = false

  const clean = value => value.replace(/\/\*[\s\S]*?\*\//g, ' ').trim()
  const statementError = (frame, raw, offset) => {
    const statement = clean(raw)
    if (!statement) return null
    const line = lineForOffset(text, offset)
    if (frame.kind === 'style') {
      if (/^@[a-z-]+\b/i.test(statement)) return null
      const colon = statement.indexOf(':')
      if (colon < 1) return { line, reason: 'CSS 声明缺少属性与值之间的冒号' }
      const property = statement.slice(0, colon).trim()
      const value = statement.slice(colon + 1).trim()
      if (!/^(?:--[\w-]+|[-*_]?[a-zA-Z_][\w-]*)$/.test(property)) return { line, reason: `CSS 属性名无效：${property || '(空)'}` }
      if (!value) return { line, reason: `CSS 属性 ${property} 缺少值` }
      return null
    }
    if (frame.kind === 'root' || frame.kind === 'group') {
      if (!/^@[a-z-]+\b/i.test(statement)) return { line, reason: '样式表或分组规则中出现了未包裹在选择器内的声明' }
      return null
    }
    return { line, reason: '关键帧规则中出现了未包裹在关键帧选择器内的声明' }
  }

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const next = text[index + 1]
    if (comment) {
      if (character === '*' && next === '/') {
        comment = false
        index += 1
      }
      continue
    }
    if (quote) {
      if (character === quote && !escaped) quote = null
      escaped = character === '\\' && !escaped
      if (character !== '\\') escaped = false
      continue
    }
    if (character === '/' && next === '*') {
      comment = true
      index += 1
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '(' || character === '[') {
      pairs.push({ character, index })
      continue
    }
    if (character === ')' || character === ']') {
      const expected = character === ')' ? '(' : '['
      const opening = pairs.pop()
      if (!opening || opening.character !== expected) return { line: lineForOffset(text, index), reason: `出现了不匹配的 ${character}` }
      continue
    }
    if (pairs.length > 0) continue

    const frame = frames[frames.length - 1]
    if (character === ';') {
      const error = statementError(frame, text.slice(frame.statementStart, index), frame.statementStart)
      if (error) return error
      frame.statementStart = index + 1
      continue
    }
    if (character === '{') {
      const prelude = clean(text.slice(frame.statementStart, index))
      if (!prelude) return { line: lineForOffset(text, index), reason: 'CSS 规则缺少选择器或 at-rule 前导' }
      let kind = 'style'
      const atRule = prelude.match(/^@([a-z-]+)/i)?.[1]?.toLowerCase()
      if (atRule === 'keyframes' || atRule?.endsWith('keyframes')) kind = 'keyframes'
      else if (atRule && !['font-face', 'page', 'property', 'counter-style'].includes(atRule)) kind = 'group'
      frames.push({ kind, statementStart: index + 1 })
      continue
    }
    if (character === '}') {
      if (frames.length === 1) return { line: lineForOffset(text, index), reason: '出现了没有开始块的右花括号' }
      const closingFrame = frames[frames.length - 1]
      const error = statementError(closingFrame, text.slice(closingFrame.statementStart, index), closingFrame.statementStart)
      if (error) return error
      frames.pop()
      frames[frames.length - 1].statementStart = index + 1
    }
  }
  if (comment) return { line: text.split(/\r?\n/).length, reason: '块注释未闭合' }
  if (quote) return { line: text.split(/\r?\n/).length, reason: '字符串未闭合' }
  if (pairs.length > 0) return { line: lineForOffset(text, pairs.at(-1).index), reason: `CSS ${pairs.at(-1).character} 未闭合` }
  if (frames.length !== 1) return { line: text.split(/\r?\n/).length, reason: 'CSS 规则花括号未闭合' }
  const trailingError = statementError(frames[0], text.slice(frames[0].statementStart), frames[0].statementStart)
  if (trailingError) return trailingError
  return null
}

function imageMediaType(target) {
  const extension = path.extname(target).toLowerCase()
  if (extension === '.png') return 'image/png'
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.gif') return 'image/gif'
  if (extension === '.webp') return 'image/webp'
  if (extension === '.ico') return 'image/x-icon'
  if (extension === '.svg') return 'image/svg+xml'
  return null
}

function imageSignatureMatches(target) {
  const buffer = readFileSync(target)
  const extension = path.extname(target).toLowerCase()
  if (buffer.length === 0) return false
  if (extension === '.png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (extension === '.jpg' || extension === '.jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  if (extension === '.gif') return ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'))
  if (extension === '.webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  if (extension === '.ico') return buffer.subarray(0, 4).equals(Buffer.from([0x00, 0x00, 0x01, 0x00]))
  if (extension === '.svg') return /^\s*(?:<\?xml[^>]*>\s*)?<svg\b/i.test(buffer.toString('utf8'))
  return true
}

function markdownLocalLinks(text) {
  const links = []
  const lines = markdownBodyLines(text)
  for (const [index, line] of lines.entries()) {
    for (const match of line.matchAll(/!?\[[^\]]*\]\((<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\)/g)) {
      links.push({ target: match[1].replace(/^<|>$/g, ''), line: index + 1 })
    }
  }
  return links
}

function courseReferenceLinks(text, projectRoot = process.cwd()) {
  const links = []
  const section = markdownSectionInfo(text, '参考资料')
  if (!section) return links
  const markdown = section.text
  for (const match of markdown.matchAll(/\[[^\]]+\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/g)) {
    links.push({
      kind: 'markdown',
      target: match[1].replace(/^<|>$/g, ''),
      line: section.startLine - 1 + lineForOffset(markdown, match.index),
    })
  }
  for (const match of markdown.matchAll(/\{%\s*link\s+([^%]*)%\}/g)) {
    const argumentsList = match[1].split(',').map(value => value.trim())
    const image = argumentsList[2] ?? ''
    links.push({
      kind: 'tag',
      target: argumentsList[1] ?? '',
      image,
      title: argumentsList[0] ?? '',
      line: section.startLine - 1 + lineForOffset(markdown, match.index),
      imageValid: isValidReferencePreviewImage(projectRoot, image, argumentsList[1] ?? ''),
    })
  }
  return links
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname)
  } catch {
    return false
  }
}

function referenceDomain(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, '')
    const parts = hostname.split('.').filter(Boolean)
    return parts.length >= 2 ? parts.slice(-2).join('.') : hostname
  } catch {
    return ''
  }
}

function isRelatedReferenceImage(target, image) {
  if (!isValidHttpUrl(target) || !isValidHttpUrl(image)) return false
  try {
    const targetUrl = new URL(target)
    const imageUrl = new URL(image)
    const targetHost = targetUrl.hostname.toLowerCase()
    const imageHost = imageUrl.hostname.toLowerCase()
    const targetDomain = referenceDomain(target)
    const imageDomain = referenceDomain(image)
    if (targetHost === imageHost
      || targetDomain === imageDomain
      || imageHost.endsWith(`.${targetHost}`)
      || targetHost.endsWith(`.${imageHost}`)) return true
    return REFERENCE_OFFICIAL_CDN_ALIASES.some(alias => alias.targetHost.test(targetHost)
      && alias.imageHost.test(imageHost)
      && alias.imagePath.test(imageUrl.pathname))
  } catch {
    return false
  }
}

function isValidReferencePreviewImage(projectRoot, value, referenceTarget = '') {
  if (!isNonEmptyString(value) || REFERENCE_GENERIC_IMAGE_PATH.test(value)) return false
  if (value.startsWith('/img/')) {
    const target = resolveLocalImage(projectRoot, value)
    return Boolean(target && existsSync(target) && imageSignatureMatches(target))
  }
  if (!isValidHttpUrl(value)) return false
  try {
    const url = new URL(value)
    return (REFERENCE_IMAGE_EXTENSIONS.test(url.pathname) || REFERENCE_IMAGE_PATH_HINT.test(url.pathname))
      && isRelatedReferenceImage(referenceTarget, value)
  } catch {
    return false
  }
}

function learnTopicArticleKind(order, suffix) {
  if (order === 1 && suffix === LEARN_TOPIC_ENTRY_ARTICLE) return 'entry'
  if (suffix === LEARN_TOPIC_ADVANCED_ARTICLE) return 'advanced'
  if (LEARN_TOPIC_FINAL_ARTICLES.has(suffix)) return 'final'
  return 'topic'
}

function resolvedMarkdownLink(projectRoot, sourceFile, linkTarget) {
  if (/^(?:https?:|mailto:|tel:|data:|app:|#|\/)/i.test(linkTarget) || /\{\{.*\}\}/.test(linkTarget)) return null
  let decoded
  try {
    decoded = decodeURIComponent(linkTarget.split('#')[0].split('?')[0])
  } catch {
    return false
  }
  if (!decoded) return null
  const target = path.resolve(path.dirname(sourceFile), decoded)
  return target.startsWith(`${projectRoot}${path.sep}`) && existsSync(target)
}

export function auditStructure({ root = process.cwd() } = {}) {
  const projectRoot = path.resolve(root)
  const report = reportFor('structure', {
    checkedRoots: ['repository-owned files', 'source', LEARN_TOPIC_CONTRACT_ROOT],
    repositoryEntryCount: 0,
    sourceEntryCount: 0,
    contractCount: 0,
  })
  const requiredPaths = [
    'source/_posts',
    'source/img',
    'source/css',
    'source/js',
    LEARN_TOPIC_CONTRACT_ROOT,
    '.agents/scripts/audit.mjs',
    '.agents/scripts/audit.test.mjs',
    IMAGE_MIGRATION_MANIFEST,
  ]
  for (const relativePath of requiredPaths) {
    if (!existsSync(path.join(projectRoot, relativePath))) {
      report.errors.push(finding('REPOSITORY_REQUIRED_PATH_MISSING', relativePath, '全仓库 lint 所需路径不存在。'))
    }
  }
  for (const legacyScript of [
    'tools/hexo-blog/audit.mjs',
    'tools/hexo-blog/audit.test.mjs',
    '.agents/skills/hexo-learn-topic/scripts/audit.mjs',
    '.agents/skills/hexo-learn-topic/scripts/audit.test.mjs',
  ]) {
    if (existsSync(path.join(projectRoot, legacyScript))) {
      report.errors.push(finding('AUDIT_SCRIPT_LEGACY_LOCATION', legacyScript, '全仓库审计脚本必须只保存在项目根目录 .agents/scripts/。'))
    }
  }

  const ownedEntries = repositoryEntries(projectRoot)
  report.facts.repositoryEntryCount = ownedEntries.length
  const repositoryNamesByParent = new Map()
  for (const { target, entry, relative } of ownedEntries) {
    const parent = path.dirname(relative)
    const normalizedName = entry.name.normalize('NFC').toLocaleLowerCase('en-US')
    if (!repositoryNamesByParent.has(parent)) repositoryNamesByParent.set(parent, new Map())
    const siblings = repositoryNamesByParent.get(parent)
    if (siblings.has(normalizedName) && siblings.get(normalizedName) !== entry.name) {
      report.errors.push(finding('REPOSITORY_PATH_COLLISION', relative, `与同目录下的 ${siblings.get(normalizedName)} 发生大小写或 Unicode 规范化冲突。`))
    } else siblings.set(normalizedName, entry.name)
    if (/[\u0000-\u001F\u007F]/.test(entry.name) || entry.name !== entry.name.trim()) {
      report.errors.push(finding('REPOSITORY_PATH_INVALID', relative, '目录或文件名不得包含控制字符或首尾空白。'))
    }
    if (FORBIDDEN_SOURCE_ARTIFACT_PATTERNS.some(pattern => pattern.test(entry.name))) {
      report.errors.push(finding('REPOSITORY_ARTIFACT_FORBIDDEN', relative, '仓库维护范围内不得保留系统元数据、备份或临时文件。'))
    }
    if (entry.isDirectory() && readdirSync(target).length === 0) report.errors.push(finding('REPOSITORY_EMPTY_DIRECTORY', relative, '仓库维护目录不得为空。'))
    if (entry.isFile() && relative.startsWith('scripts/') && !relative.endsWith('.js')) report.errors.push(finding('HEXO_SCRIPT_FILE_INVALID', relative, 'Hexo 自动加载的 scripts/ 只允许 JavaScript 扩展。'))
    if (entry.isFile() && relative.startsWith('source/js/') && !relative.endsWith('.js')) report.errors.push(finding('SOURCE_JAVASCRIPT_FILE_INVALID', relative, 'source/js/ 只允许 JavaScript 文件。'))
    if (entry.isFile() && relative.startsWith('source/css/') && !relative.endsWith('.css')) report.errors.push(finding('SOURCE_STYLESHEET_FILE_INVALID', relative, 'source/css/ 只允许 CSS 文件。'))
    if (entry.isFile() && relative.startsWith('source/_data/') && !/\.(?:json|ya?ml)$/i.test(relative)) report.errors.push(finding('SOURCE_DATA_FILE_INVALID', relative, 'source/_data/ 只允许 JSON 或 YAML 数据文件。'))
  }

  const sourceRoot = path.join(projectRoot, 'source')
  const sourceEntries = allEntriesUnder(sourceRoot)
  report.facts.sourceEntryCount = sourceEntries.length
  const namesByParent = new Map()
  for (const { target, entry } of sourceEntries) {
    const relativePath = safeRelative(projectRoot, target)
    const parent = path.dirname(relativePath)
    const normalizedName = entry.name.normalize('NFC').toLocaleLowerCase('en-US')
    if (!namesByParent.has(parent)) namesByParent.set(parent, new Map())
    const siblings = namesByParent.get(parent)
    if (siblings.has(normalizedName) && siblings.get(normalizedName) !== entry.name) {
      report.errors.push(finding('SOURCE_PATH_CASE_COLLISION', relativePath, `与同目录下的 ${siblings.get(normalizedName)} 发生大小写或 Unicode 规范化冲突。`))
    } else {
      siblings.set(normalizedName, entry.name)
    }
    if (entry.name !== entry.name.trim() || /[\u0000-\u001f\u007f]/.test(entry.name)) {
      report.errors.push(finding('SOURCE_PATH_NAME_INVALID', relativePath, '目录或文件名不得包含首尾空白或控制字符。'))
    }
    if (entry.isFile() && relativePath.startsWith('source/_posts/') && !entry.name.endsWith('.md')) {
      report.errors.push(finding('POST_FILE_TYPE_INVALID', relativePath, 'source/_posts 只允许 Markdown 文章和课程目录。'))
    }
  }

  const pages = markdownFilesUnder(sourceRoot).filter(target => !safeRelative(projectRoot, target).startsWith('source/_posts/'))
  for (const target of pages) {
    const relativeFile = safeRelative(projectRoot, target)
    const text = readText(target)
    const parsed = parseFrontMatter(text)
    if (parsed.error) {
      report.errors.push(finding('PAGE_FRONT_MATTER_PARSE_FAILED', relativeFile, `页面 Front Matter 无法解析，约在第 ${parsed.error.line} 行。`))
      continue
    }
    if (!isNonEmptyString(parsed.data.title)) report.errors.push(finding('PAGE_TITLE_INVALID', relativeFile, 'Hexo 页面必须声明非空 title。'))
    if (!isValidDateValue(parsed.data.date, frontMatterScalarValue(text, 'date'))) report.errors.push(finding('PAGE_DATE_INVALID', relativeFile, 'Hexo 页面必须声明有效 date。'))
    const openFence = unclosedMarkdownFence(text)
    if (openFence) report.errors.push(finding('MARKDOWN_FENCE_UNCLOSED', relativeFile, `第 ${openFence.line} 行开始的代码围栏未闭合。`))
  }

  const learnRoot = path.join(projectRoot, LEARN_TOPIC_ROOT)
  if (existsSync(learnRoot)) {
    for (const entry of readdirSync(learnRoot, { withFileTypes: true })) {
      const relativePath = path.posix.join(LEARN_TOPIC_ROOT, entry.name)
      if (!entry.isDirectory() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name)) {
        report.errors.push(finding('LEARN_TOPIC_DIRECTORY_INVALID', relativePath, '课程路径段必须是唯一一层 kebab-case 小写目录。'))
      }
    }
  }

  const contractRoot = path.join(projectRoot, LEARN_TOPIC_CONTRACT_ROOT)
  if (existsSync(contractRoot)) {
    const contractEntries = readdirSync(contractRoot, { withFileTypes: true })
    report.facts.contractCount = contractEntries.filter(entry => entry.isFile() && entry.name.endsWith('.json')).length
    const courseKeys = new Set(existsSync(learnRoot) ? readdirSync(learnRoot, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name) : [])
    for (const entry of contractEntries) {
      const relativePath = path.posix.join(LEARN_TOPIC_CONTRACT_ROOT, entry.name)
      if (!entry.isFile() || !/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(entry.name)) {
        report.errors.push(finding('LEARN_TOPIC_CONTRACT_FILE_INVALID', relativePath, '课程数据目录只允许与课程 slug 同名的 JSON 契约。'))
        continue
      }
      if (!courseKeys.has(entry.name.replace(/\.json$/, ''))) {
        report.errors.push(finding('LEARN_TOPIC_CONTRACT_ORPHANED', relativePath, '契约没有对应的 source/_posts/learn-topic 课程目录。'))
      }
    }
  }

  return finalize(report)
}

export function auditConfig({ root = process.cwd() } = {}) {
  const projectRoot = path.resolve(root)
  const report = reportFor('config', {
    jsonFileCount: 0,
    yamlFileCount: 0,
    dependencyCount: 0,
  })
  const entries = repositoryEntries(projectRoot).filter(item => item.entry.isFile())
  const jsonFiles = entries.filter(item => item.relative.endsWith('.json'))
  const yamlFiles = entries.filter(item => {
    if (!/\.ya?ml$/i.test(item.relative)) return false
    return item.relative.startsWith('_config') || CONFIG_YAML_ROOTS.some(rootPath => item.relative === rootPath || item.relative.startsWith(`${rootPath}/`))
  })
  report.facts.jsonFileCount = jsonFiles.length
  report.facts.yamlFileCount = yamlFiles.length

  for (const item of jsonFiles) {
    try {
      readJson(item.target)
    } catch {
      report.errors.push(finding('JSON_PARSE_FAILED', item.relative, 'JSON 文件无法解析。'))
    }
  }
  for (const item of yamlFiles) {
    try {
      parseYaml(readText(item.target))
    } catch (error) {
      report.errors.push(finding('YAML_PARSE_FAILED', item.relative, `YAML 无法解析，约在第 ${Number(error?.mark?.line ?? 0) + 1} 行。`))
    }
  }

  const packageTarget = path.join(projectRoot, 'package.json')
  const lockTarget = path.join(projectRoot, 'package-lock.json')
  let packageData
  let lockData
  try {
    if (existsSync(packageTarget)) packageData = readJson(packageTarget)
    if (existsSync(lockTarget)) lockData = readJson(lockTarget)
  } catch {
    // 上面的逐文件解析已经给出具体错误。
  }
  if (packageData) {
    const requiredScripts = { build: 'hexo generate', clean: 'hexo clean', deploy: 'hexo deploy', server: 'hexo server' }
    for (const [name, command] of Object.entries(requiredScripts)) {
      if (packageData.scripts?.[name] !== command) report.errors.push(finding('PACKAGE_SCRIPT_INVALID', 'package.json', `scripts.${name} 必须保持为 ${command}。`))
    }
    if (packageData.private !== true) report.errors.push(finding('PACKAGE_PRIVATE_REQUIRED', 'package.json', '博客站点包必须声明 private: true，避免误发布到 npm。'))
    const dependencies = packageData.dependencies ?? {}
    report.facts.dependencyCount = Object.keys(dependencies).length
    const lockedDependencies = lockData?.packages?.['']?.dependencies
    if (!sameStringRecord(dependencies, lockedDependencies)) {
      report.errors.push(finding('PACKAGE_LOCK_DEPENDENCY_DRIFT', 'package-lock.json', '根依赖声明与 package.json 不一致。'))
    }
    for (const dependency of Object.keys(dependencies)) {
      if (!existsSync(path.join(projectRoot, 'node_modules', dependency, 'package.json'))) {
        report.errors.push(finding('DEPENDENCY_NOT_INSTALLED', 'node_modules', `package.json 声明的依赖 ${dependency} 未安装。`))
      }
    }
    if (existsSync(path.join(projectRoot, 'node_modules'))) {
      const npmResult = spawnSync('npm', ['ls', '--depth=0', '--json'], { cwd: projectRoot, encoding: 'utf8' })
      if (npmResult.status !== 0) report.errors.push(finding('DEPENDENCY_TREE_INVALID', 'node_modules', 'npm 顶层依赖树与 package.json/package-lock.json 不一致。'))
    }
  }

  const configTarget = path.join(projectRoot, '_config.yml')
  if (existsSync(configTarget)) {
    try {
      const config = parseYaml(readText(configTarget))
      if (!isNonEmptyString(config.url) || !/^https?:\/\//.test(config.url)) report.errors.push(finding('SITE_URL_INVALID', '_config.yml', 'url 必须是有效的 HTTP(S) 站点地址。'))
      if (!isNonEmptyString(config.theme) || !existsSync(path.join(projectRoot, 'themes', config.theme))) report.errors.push(finding('THEME_PATH_INVALID', '_config.yml', 'theme 必须指向 themes/ 下存在的主题目录。'))
      if (!isNonEmptyString(config.timezone)) report.errors.push(finding('TIMEZONE_MISSING', '_config.yml', 'timezone 必须显式声明。'))
    } catch {
      // YAML 解析错误已在上面报告。
    }
  }
  return finalize(report)
}

export function auditCode({ root = process.cwd() } = {}) {
  const projectRoot = path.resolve(root)
  const report = reportFor('code', { javascriptFileCount: 0, cssFileCount: 0, shellFileCount: 0 })
  const files = repositoryEntries(projectRoot).filter(item => item.entry.isFile())
  const javascriptFiles = files.filter(item => /\.(?:js|mjs|cjs)$/.test(item.relative) && CODE_ROOTS.some(rootPath => item.relative.startsWith(`${rootPath}/`)))
  const cssFiles = files.filter(item => item.relative.startsWith('source/css/') && item.relative.endsWith('.css'))
  const shellFiles = files.filter(item => item.relative.endsWith('.sh'))
  report.facts.javascriptFileCount = javascriptFiles.length
  report.facts.cssFileCount = cssFiles.length
  report.facts.shellFileCount = shellFiles.length

  for (const item of javascriptFiles) {
    const result = spawnSync(process.execPath, ['--check', item.target], { encoding: 'utf8' })
    if (result.status !== 0) {
      const line = `${result.stderr ?? ''}`.match(/:(\d+)(?:\r?\n|$)/)?.[1]
      report.errors.push(finding('JAVASCRIPT_SYNTAX_INVALID', item.relative, `JavaScript 无法通过 Node.js 语法检查${line ? `，约在第 ${line} 行` : ''}。`))
    }
  }
  for (const item of cssFiles) {
    const error = cssSyntaxError(readText(item.target))
    if (error) report.errors.push(finding('CSS_SYNTAX_INVALID', item.relative, `第 ${error.line} 行附近：${error.reason}。`))
  }
  for (const item of shellFiles) {
    const result = spawnSync('bash', ['-n', item.target], { encoding: 'utf8' })
    if (result.status !== 0) {
      const line = `${result.stderr ?? ''}`.match(/line (\d+)/i)?.[1]
      report.errors.push(finding('SHELL_SYNTAX_INVALID', item.relative, `Shell 脚本无法通过 bash -n${line ? `，约在第 ${line} 行` : ''}。`))
    }
  }
  return finalize(report)
}

export function auditSkills({ root = process.cwd() } = {}) {
  const projectRoot = path.resolve(root)
  const report = reportFor('skills', { skillCount: 0, checkedReferenceCount: 0, checkedSymlinkCount: 0 })
  const agentsFile = path.join(projectRoot, 'AGENTS.md')
  const claudeFile = path.join(projectRoot, 'CLAUDE.md')
  if (!existsSync(agentsFile)) report.errors.push(finding('AGENTS_FILE_MISSING', 'AGENTS.md', '项目指令唯一来源不存在。'))
  if (!existsSync(claudeFile) || symlinkTarget(claudeFile) !== 'AGENTS.md') {
    report.errors.push(finding('CLAUDE_SYMLINK_INVALID', 'CLAUDE.md', '必须是指向 AGENTS.md 的相对符号链接。'))
  } else report.facts.checkedSymlinkCount += 1

  const skillRoot = path.join(projectRoot, '.agents/skills')
  const mirrorRoot = path.join(projectRoot, '.claude/skills')
  const skillDirectories = existsSync(skillRoot)
    ? readdirSync(skillRoot, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
    : []
  report.facts.skillCount = skillDirectories.length
  for (const skillName of skillDirectories) {
    const relativeSkill = path.posix.join('.agents/skills', skillName)
    const skillDirectory = path.join(skillRoot, skillName)
    const skillFile = path.join(skillDirectory, 'SKILL.md')
    if (!existsSync(skillFile)) {
      report.errors.push(finding('SKILL_ENTRY_MISSING', path.posix.join(relativeSkill, 'SKILL.md'), 'Skill 目录缺少 SKILL.md。'))
      continue
    }
    const parsed = parseFrontMatter(readText(skillFile))
    if (parsed.error) report.errors.push(finding('SKILL_FRONT_MATTER_INVALID', path.posix.join(relativeSkill, 'SKILL.md'), 'Skill Front Matter 无法解析。'))
    else {
      if (parsed.data.name !== skillName) report.errors.push(finding('SKILL_NAME_MISMATCH', path.posix.join(relativeSkill, 'SKILL.md'), `name 必须与目录名 ${skillName} 一致。`))
      if (!isNonEmptyString(parsed.data.description)) report.errors.push(finding('SKILL_DESCRIPTION_MISSING', path.posix.join(relativeSkill, 'SKILL.md'), 'description 必须是非空字符串。'))
    }

    const mirror = path.join(mirrorRoot, skillName)
    const expectedTarget = path.posix.join('../..', '.agents/skills', skillName)
    if (!existsSync(mirror) || symlinkTarget(mirror) !== expectedTarget) {
      report.errors.push(finding('SKILL_MIRROR_INVALID', path.posix.join('.claude/skills', skillName), `必须是指向 ${expectedTarget} 的相对符号链接。`))
    } else report.facts.checkedSymlinkCount += 1

    const entries = allEntriesUnder(skillDirectory)
    const allowedDirectories = new Set(['agents', 'assets', 'checklists', 'data', 'examples', 'prompts', 'references', 'rules', 'scripts', 'templates', 'workflows'])
    for (const entry of readdirSync(skillDirectory, { withFileTypes: true })) {
      if (entry.isDirectory() && !allowedDirectories.has(entry.name)) report.errors.push(finding('SKILL_DIRECTORY_INVALID', path.posix.join(relativeSkill, entry.name), 'Skill 根目录包含职责未定义的目录。'))
      if (entry.isFile() && entry.name !== 'SKILL.md') report.errors.push(finding('SKILL_ROOT_FILE_INVALID', path.posix.join(relativeSkill, entry.name), 'Skill 根目录只允许 SKILL.md 和职责目录。'))
    }
    for (const item of entries) {
      const relativeFile = safeRelative(projectRoot, item.target)
      if (item.entry.isFile() && statSync(item.target).size === 0) report.errors.push(finding('SKILL_EMPTY_FILE', relativeFile, 'Skill 不得包含空文件。'))
      if (item.entry.isDirectory() && readdirSync(item.target).length === 0) report.errors.push(finding('SKILL_EMPTY_DIRECTORY', relativeFile, 'Skill 不得包含空目录。'))
      if (item.entry.isFile() && relativeFile.includes('/prompts/') && !relativeFile.endsWith('.agent.md')) report.errors.push(finding('SKILL_PROMPT_NAME_INVALID', relativeFile, 'Prompt 文件必须使用 .agent.md 后缀。'))
      if (item.entry.isFile() && relativeFile.includes('/workflows/') && !/^§\d{2}-.+\.md$/.test(item.entry.name)) report.errors.push(finding('SKILL_WORKFLOW_NAME_INVALID', relativeFile, '工作流文件必须使用 §NN-name.md。'))
      if (item.entry.isFile() && relativeFile.includes('/templates/') && !/\.template\.[^.]+$/.test(item.entry.name)) report.errors.push(finding('SKILL_TEMPLATE_NAME_INVALID', relativeFile, '模板文件必须使用 .template.<扩展名> 后缀。'))
      if (item.entry.isFile() && relativeFile.includes('/examples/') && !/\.example\.[^.]+$/.test(item.entry.name)) report.errors.push(finding('SKILL_EXAMPLE_NAME_INVALID', relativeFile, '示例文件必须使用 .example.<扩展名> 后缀。'))
      if (item.entry.isFile() && ['/checklists/', '/references/', '/rules/'].some(segment => relativeFile.includes(segment)) && !relativeFile.endsWith('.md')) report.errors.push(finding('SKILL_DOCUMENT_FILE_INVALID', relativeFile, 'Skill 清单、参考资料和规则文件必须使用 Markdown。'))
      if (item.entry.isFile() && relativeFile.includes('/data/') && !relativeFile.endsWith('.json')) report.errors.push(finding('SKILL_DATA_FILE_INVALID', relativeFile, 'Skill data/ 只允许 JSON 数据文件。'))
    }

    const markdownResources = [skillFile, ...entries
      .filter(item => item.entry.isFile() && item.target.endsWith('.md'))
      .map(item => item.target)]
    for (const markdownTarget of new Set(markdownResources)) {
      const markdownText = readText(markdownTarget)
      const relativeMarkdown = safeRelative(projectRoot, markdownTarget)
      for (const match of markdownText.matchAll(/`((?:workflows|rules|templates|examples|checklists|prompts|references|assets|scripts|data)\/[^`\s]+)`/g)) {
        report.facts.checkedReferenceCount += 1
        const reference = match[1]
        const dynamicReference = /[<>{}]/.test(reference)
        const skillResourceExists = existsSync(path.join(skillDirectory, reference))
        const projectResourceExists = existsSync(path.join(projectRoot, reference))
        if (!dynamicReference && !skillResourceExists && !projectResourceExists) {
          report.errors.push(finding('SKILL_REFERENCE_MISSING', relativeMarkdown, `引用的 Skill 或项目资源不存在：${reference}`))
        }
      }
    }
  }
  if (existsSync(mirrorRoot)) {
    for (const entry of readdirSync(mirrorRoot, { withFileTypes: true })) {
      if (!skillDirectories.includes(entry.name)) report.errors.push(finding('SKILL_MIRROR_ORPHANED', path.posix.join('.claude/skills', entry.name), 'Claude Skill 镜像没有对应的 .agents/skills 维护源。'))
    }
  }
  return finalize(report)
}

export function auditDocs({ root = process.cwd() } = {}) {
  const projectRoot = path.resolve(root)
  const report = reportFor('docs', { markdownFileCount: 0, localLinkCount: 0 })
  const markdownFiles = repositoryEntries(projectRoot)
    .filter(item => item.entry.isFile() && item.relative.endsWith('.md'))
    .filter(item => !item.relative.startsWith('source/'))
  report.facts.markdownFileCount = markdownFiles.length
  for (const item of markdownFiles) {
    const text = readText(item.target)
    const openFence = unclosedMarkdownFence(text)
    if (openFence) report.errors.push(finding('MARKDOWN_FENCE_UNCLOSED', item.relative, `第 ${openFence.line} 行开始的代码围栏未闭合。`))
    for (const link of markdownLocalLinks(text)) {
      const resolved = resolvedMarkdownLink(projectRoot, item.target, link.target)
      if (resolved === null) continue
      report.facts.localLinkCount += 1
      if (!resolved) report.errors.push(finding('MARKDOWN_LOCAL_LINK_MISSING', item.relative, `第 ${link.line} 行的本地链接无法解析：${link.target}`))
    }
  }
  return finalize(report)
}

export function auditLint({ root = process.cwd() } = {}) {
  const projectRoot = path.resolve(root)
  const checks = [
    auditProject({ root: projectRoot }),
    auditStructure({ root: projectRoot }),
    auditConfig({ root: projectRoot }),
    auditCode({ root: projectRoot }),
    auditSkills({ root: projectRoot }),
    auditDocs({ root: projectRoot }),
    auditContent({ root: projectRoot, release: true }),
    auditTags({ root: projectRoot }),
    auditAssets({ root: projectRoot }),
  ]
  const report = reportFor('lint', {
    checks: Object.fromEntries(checks.map(check => [check.mode, check.status])),
  })
  for (const check of checks) {
    for (const item of check.errors) report.errors.push({ ...item, code: `${check.mode.toUpperCase()}_${item.code}` })
    for (const item of check.blockers) report.blockers.push({ ...item, code: `${check.mode.toUpperCase()}_${item.code}` })
    for (const item of check.warnings) report.warnings.push({ ...item, code: `${check.mode.toUpperCase()}_${item.code}` })
  }
  return finalize(report)
}

export function auditRelease({ root = process.cwd(), route = 'local' } = {}) {
  const project = auditProject({ root })
  const content = auditContent({ root, release: true })
  const report = reportFor('release', {
    route,
    project: project.facts,
    content: content.facts,
  })

  if (!['local', 'ci'].includes(route)) {
    report.blockers.push(finding('ROUTE_INVALID', 'route', '发布路由必须是 local 或 ci。'))
  }

  for (const item of project.errors) report.blockers.push({ ...item, code: `PROJECT_${item.code}` })
  for (const item of content.errors) report.blockers.push({ ...item, code: `CONTENT_${item.code}` })
  for (const item of content.blockers) report.blockers.push(item)
  report.warnings.push(...content.warnings)

  for (const item of project.warnings) {
    const routeSpecificBlocker = route === 'ci' && item.code === 'CI_NODE_INCOMPATIBLE'
    const localSpecificBlocker = route === 'local' && ['DEPLOY_WORKTREE_MISSING', 'DEPLOY_WORKTREE_DIRTY', 'DEPLOY_STATUS_UNKNOWN'].includes(item.code)
    if (COMMON_RELEASE_BLOCKERS.has(item.code) || routeSpecificBlocker || localSpecificBlocker) report.blockers.push(item)
    else report.warnings.push(item)
  }

  if (!project.facts.deploy.type || !project.facts.deploy.repo || !project.facts.deploy.branch) {
    report.blockers.push(finding('DEPLOY_TARGET_MISSING', '_config.yml', '部署类型、远程仓库或分支配置不完整。'))
  }

  return finalize(report)
}

export function formatReport(report) {
  return JSON.stringify(report, null, 2)
}

function usage() {
  return [
    '用法：node .agents/scripts/audit.mjs <assets|code|config|content|docs|lint|project|release|skills|structure|tags> [选项]',
    '',
    '选项：',
    '  --root <path>           项目根目录，默认当前目录',
    '  --release               content 模式要求 abbrlink 已生成',
    '  --route <local|ci>      release 模式的发布路由，默认 local',
    '  --json                  输出 JSON（当前唯一稳定输出格式）',
    '  --help                  显示帮助',
  ].join('\n')
}

function parseArguments(argv) {
  const args = [...argv]
  const options = { mode: args.shift(), root: process.cwd(), release: false, route: 'local' }
  while (args.length > 0) {
    const argument = args.shift()
    if (argument === '--help' || argument === '-h') options.help = true
    else if (argument === '--json') options.json = true
    else if (argument === '--release') options.release = true
    else if (argument === '--root') options.root = args.shift()
    else if (argument === '--route') options.route = args.shift()
    else options.invalid = argument
  }
  return options
}

function runCli() {
  const options = parseArguments(process.argv.slice(2))
  if (options.help || !options.mode) {
    process.stdout.write(`${usage()}\n`)
    return 0
  }
  if (options.invalid || !options.root) {
    process.stderr.write('审计参数无效。请使用 --help 查看支持的参数。\n')
    return 1
  }

  let report
  if (options.mode === 'assets') report = auditAssets({ root: options.root })
  else if (options.mode === 'code') report = auditCode({ root: options.root })
  else if (options.mode === 'config') report = auditConfig({ root: options.root })
  else if (options.mode === 'content') report = auditContent({ root: options.root, release: options.release })
  else if (options.mode === 'docs') report = auditDocs({ root: options.root })
  else if (options.mode === 'lint') report = auditLint({ root: options.root })
  else if (options.mode === 'project') report = auditProject({ root: options.root })
  else if (options.mode === 'release') report = auditRelease({ root: options.root, route: options.route })
  else if (options.mode === 'skills') report = auditSkills({ root: options.root })
  else if (options.mode === 'structure') report = auditStructure({ root: options.root })
  else if (options.mode === 'tags') report = auditTags({ root: options.root })
  else {
    process.stderr.write('未知审计模式。请使用 assets、code、config、content、docs、lint、project、release、skills、structure 或 tags。\n')
    return 1
  }

  process.stdout.write(`${formatReport(report)}\n`)
  return report.status === 'pass' ? 0 : 2
}

const currentFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  try {
    process.exitCode = runCli()
  } catch {
    process.stderr.write('审计执行失败；请检查项目路径、依赖和文件格式。\n')
    process.exitCode = 1
  }
}
