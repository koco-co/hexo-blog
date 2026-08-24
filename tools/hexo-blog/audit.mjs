#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
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
const LEGACY_LEARN_ROOT = 'source/_posts/learn/'
const LEARN_TOPIC_PLACEHOLDER_MARKER = '<!-- learn-topic-placeholder -->'
const CHINESE_SEQUENCE = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']
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

function markdownH2Headings(text) {
  const headings = []
  let fence = null
  for (const line of text.split(/\r?\n/)) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)
    if (marker) {
      if (!fence) fence = marker[1][0]
      else if (fence === marker[1][0]) fence = null
      continue
    }
    if (fence) continue
    const heading = line.match(/^##\s+(.+?)\s*$/)
    if (heading) headings.push(heading[1])
  }
  return headings
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidDateValue(value) {
  return value instanceof Date || isNonEmptyString(value)
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
  const sourceRoot = path.resolve(root, 'source')
  const target = path.resolve(sourceRoot, decoded.replace(/^\/+/, ''))
  if (target !== sourceRoot && !target.startsWith(`${sourceRoot}${path.sep}`)) return null
  return target
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

  return finalize(report)
}

function registeredTagNames(source) {
  const names = new Set()
  for (const match of source.matchAll(/hexo\.extend\.tag\.register\(\s*['"]([^'"]+)['"]/g)) {
    names.add(match[1])
  }
  return [...names].sort()
}

function tagTokens(text) {
  const tokens = []
  for (const match of text.matchAll(/\{%\s*([A-Za-z][A-Za-z0-9_-]*)\b[^%]*%\}/g)) {
    tokens.push({
      name: match[1],
      line: text.slice(0, match.index).split(/\r?\n/).length,
    })
  }
  return tokens
}

function renderedTagTokens(text) {
  const tokens = []
  let fence = null
  let frontMatter = false
  const lines = text.split(/\r?\n/)

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
    if (marker) {
      if (!fence) fence = marker[1][0]
      else if (fence === marker[1][0]) fence = null
      continue
    }
    if (fence) continue

    for (const match of line.matchAll(/\{%\s*([A-Za-z][A-Za-z0-9_-]*)\b[^%]*%\}/g)) {
      tokens.push({ name: match[1], line: index + 1 })
    }
  }

  return tokens
}

function checkTagContainers(report, relativeFile, tokens) {
  const containers = new Set([...TAG_PLUGIN_CONTAINER_TAGS, 'flashcard'])
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
  for (const target of files) {
    const relativeFile = safeRelative(projectRoot, target)
    const text = readText(target)
    const parsed = parseFrontMatter(text)
    if (parsed.error) {
      report.errors.push(finding('FRONT_MATTER_PARSE_FAILED', relativeFile, `Front Matter 无法解析，约在第 ${parsed.error.line} 行。`))
      continue
    }

    const data = parsed.data
    for (const field of CONTENT_REQUIRED_FIELDS) {
      if (!(field in data)) contentFieldError(report, relativeFile, field, '缺少必需字段')
    }
    if ('title' in data && !isNonEmptyString(data.title)) contentFieldError(report, relativeFile, 'title', '必须是非空字符串')
    if ('description' in data && !isNonEmptyString(data.description)) contentFieldError(report, relativeFile, 'description', '必须是非空字符串')
    if ('tags' in data && !isNonEmptyStringArray(data.tags)) contentFieldError(report, relativeFile, 'tags', '必须是非空字符串数组')
    if ('categories' in data && !isNonEmptyStringArray(data.categories)) contentFieldError(report, relativeFile, 'categories', '必须是非空字符串数组')
    if ('date' in data && !isValidDateValue(data.date)) contentFieldError(report, relativeFile, 'date', '必须是有效的非空日期值')
    if ('published' in data && typeof data.published !== 'boolean') contentFieldError(report, relativeFile, 'published', '存在时必须是布尔值')

    if (relativeFile.startsWith(LEGACY_LEARN_ROOT)) {
      report.errors.push(finding('LEARN_TOPIC_LEGACY_PATH', relativeFile, '系统课程必须迁移到 source/_posts/learn-topic/<主题路径段>/。'))
    }

    const isLearnTopic = relativeFile.startsWith(LEARN_TOPIC_ROOT)
    let isValidCoursePlaceholder = false
    if (isLearnTopic) {
      report.facts.learnTopicPostCount += 1
      const pathParts = relativeFile.split('/')
      const courseKey = pathParts[3] ?? ''
      if (pathParts.length !== 5 || !courseKey) {
        report.errors.push(finding('LEARN_TOPIC_PATH_INVALID', relativeFile, '课程文章必须直接位于 source/_posts/learn-topic/<单个主题路径段>/，不得增加嵌套目录。'))
      }
      const fileName = path.basename(relativeFile)
      const fileMatch = fileName.match(/^(.+)文档\(([一二三四五六七八九十]+)\)([^\s].*)\.md$/)
      const titleMatch = String(data.title ?? '').match(/^(.+)文档\(([一二三四五六七八九十]+)\) ([^\s].*)$/)
      if (!fileMatch) report.errors.push(finding('LEARN_TOPIC_FILENAME_INVALID', relativeFile, '文件名必须使用 主题文档(中文序号)简短主题.md。'))
      if (!titleMatch) report.errors.push(finding('LEARN_TOPIC_TITLE_INVALID', relativeFile, 'title 必须使用 主题文档(中文序号) 简短主题。'))
      if (fileMatch && titleMatch && (fileMatch[1] !== titleMatch[1] || fileMatch[2] !== titleMatch[2] || fileMatch[3] !== titleMatch[3])) {
        report.errors.push(finding('LEARN_TOPIC_SEQUENCE_MISMATCH', relativeFile, '文件名与 title 的系列名、中文序号或简短主题不一致。'))
      }
      if (fileMatch && courseKey) {
        const expectedOrder = CHINESE_SEQUENCE.indexOf(fileMatch[2]) + 1
        if (!courseSequences.has(courseKey)) courseSequences.set(courseKey, [])
        courseSequences.get(courseKey).push(expectedOrder)

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
      const courseNavigationCount = courseTags.filter(token => token.name === 'course_series').length
      if (courseNavigationCount !== 1) {
        report.errors.push(finding('LEARN_TOPIC_COURSE_SERIES_MISSING', relativeFile, '课程文章正文必须且只能使用一次 {% course_series %}。'))
      }
      if (courseTags.some(token => token.name === 'series')) {
        report.errors.push(finding('LEARN_TOPIC_BUILTIN_SERIES_USED', relativeFile, '系统课程不得使用按标题或日期排序的 Butterfly {% series %}。'))
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
        if (!placeholderHeadings.includes('本文职责') || !placeholderHeadings.includes('正文大纲')) {
          report.errors.push(finding('LEARN_TOPIC_PLACEHOLDER_CONTRACT_MISSING', relativeFile, '课程占位文章必须包含“本文职责”和“正文大纲”合同。'))
        } else {
          isValidCoursePlaceholder = true
        }
      }

      const headings = markdownH2Headings(text)
      if (headings.includes('来源') || headings.includes('来源与核验范围')) {
        report.errors.push(finding('LEARN_TOPIC_SOURCE_HEADING', relativeFile, '公开课程统一使用“参考资料”，不得使用“来源”或“来源与核验范围”。'))
      }
      if (/核验于\s*\d{4}-\d{2}-\d{2}/.test(text)) {
        report.errors.push(finding('LEARN_TOPIC_VERIFICATION_COPY', relativeFile, '公开课程不得包含“核验于 YYYY-MM-DD”文案。'))
      }
      if (headings.length < 2 || headings.at(-2) !== '常见问题' || headings.at(-1) !== '参考资料') {
        report.errors.push(finding('LEARN_TOPIC_FINAL_HEADINGS', relativeFile, '最后两个 H2 必须依次为“常见问题”和“参考资料”。'))
      }
    } else if (data.published === false) {
      report.errors.push(finding('PUBLISHED_FALSE_NOT_COURSE_PLACEHOLDER', relativeFile, 'published: false 只允许用于带占位合同和占位标记的系统课程文章。'))
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

  for (const target of markdownFiles) {
    const relativeFile = safeRelative(projectRoot, target)
    const tokens = tagTokens(readText(target))
    checkTagContainers(report, relativeFile, tokens)

    for (const token of tokens) {
      tagCounts.set(token.name, (tagCounts.get(token.name) ?? 0) + 1)
      if (expectedTags.has(token.name)) usedPluginTags.add(token.name)
      if (token.name === 'issues' && report.facts.plugin.issuesEnabled === false) {
        report.errors.push(finding('TAG_CAPABILITY_DISABLED', relativeFile, `第 ${token.line} 行使用了 issues，但 tag_plugins.issues 当前关闭。`))
      }
    }
  }

  report.facts.usage.usedPluginTags = [...usedPluginTags].sort()
  report.facts.usage.usedFlashcardTags = ['flashcard', 'flashcard_ref'].filter(name => tagCounts.has(name))
  report.facts.usage.tagCounts = Object.fromEntries([...tagCounts.entries()].sort(([left], [right]) => left.localeCompare(right)))
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
    '用法：node tools/hexo-blog/audit.mjs <assets|content|project|release|tags> [选项]',
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
  else if (options.mode === 'content') report = auditContent({ root: options.root, release: options.release })
  else if (options.mode === 'project') report = auditProject({ root: options.root })
  else if (options.mode === 'release') report = auditRelease({ root: options.root, route: options.route })
  else if (options.mode === 'tags') report = auditTags({ root: options.root })
  else {
    process.stderr.write('未知审计模式。请使用 assets、content、project、release 或 tags。\n')
    return 1
  }

  process.stdout.write(`${formatReport(report)}\n`)
  return report.status === 'blocked' ? 2 : 0
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
