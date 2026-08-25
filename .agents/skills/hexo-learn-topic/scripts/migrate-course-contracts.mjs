#!/usr/bin/env node

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const yaml = require('js-yaml')

const FIELD = 'learn_topic_capability_ledger'
const COURSE_ROOT = 'source/_posts/learn-topic'
const CONTRACT_ROOT = '.agents/skills/hexo-learn-topic/data'
const ADVANCED = '进阶路线'
const FINALS = new Set(['综合实战', '项目实战', '知识总结'])

function parseMarkdown(target) {
  const text = readFileSync(target, 'utf8')
  const match = text.match(/^(\uFEFF?---[\t ]*\r?\n)([\s\S]*?)(\r?\n---[\t ]*(?:\r?\n|$))/)
  if (!match) throw new Error(`${target}: Front Matter 缺失`)
  const data = yaml.load(match[2]) || {}
  return { text, match, data }
}

function removeTopLevelField(frontMatter, field) {
  const lines = frontMatter.split(/\r?\n/)
  const start = lines.findIndex(line => new RegExp(`^${field}\\s*:`).test(line))
  if (start < 0) return frontMatter
  let end = start + 1
  while (end < lines.length && !/^[A-Za-z][A-Za-z0-9_-]*\s*:/.test(lines[end])) end += 1
  lines.splice(start, end - start)
  return lines.join('\n').replace(/\n{3,}/g, '\n\n')
}

function articleKind(index, topicCount, suffix) {
  if (index === 0) return 'entry'
  if (index <= topicCount) return 'topic'
  return suffix === ADVANCED ? 'advanced' : 'final'
}

function migrateCourse(projectRoot, slug, apply) {
  const directory = path.join(projectRoot, COURSE_ROOT, slug)
  const markdownFiles = readdirSync(directory).filter(name => name.endsWith('.md'))
  const articles = markdownFiles.map(file => {
    const target = path.join(directory, file)
    const parsed = parseMarkdown(target)
    const title = String(parsed.data.title ?? '')
    const titleMatch = title.match(/^(.+)\(([一二三四五六七八九十]+)\)([^\s].*)$/)
    if (!titleMatch || !Number.isInteger(parsed.data.series_order)) throw new Error(`${target}: 课程标题或 series_order 无效`)
    return {
      target,
      file,
      parsed,
      title,
      series: String(parsed.data.series ?? ''),
      order: parsed.data.series_order,
      suffix: titleMatch[3],
    }
  }).sort((left, right) => left.order - right.order)

  const entry = articles[0]
  if (!entry || entry.suffix !== '入门路线' || !Object.hasOwn(entry.parsed.data, FIELD)) return null
  const rawLedger = entry.parsed.data[FIELD]
  const capabilityLedger = typeof rawLedger === 'string' ? JSON.parse(rawLedger) : rawLedger
  if (!capabilityLedger || typeof capabilityLedger !== 'object' || Array.isArray(capabilityLedger)) {
    throw new Error(`${entry.target}: ${FIELD} 不是有效 JSON 对象`)
  }
  const optionalStart = articles.findIndex((article, index) => index > 0 && (article.suffix === ADVANCED || FINALS.has(article.suffix)))
  const topicArticles = optionalStart < 0 ? articles.slice(1) : articles.slice(1, optionalStart)
  const optionalArticles = optionalStart < 0 ? [] : articles.slice(optionalStart)
  if (optionalArticles.some(article => article.suffix !== ADVANCED && !FINALS.has(article.suffix))) {
    throw new Error(`${directory}: 可选篇结构无效`)
  }

  const contract = {
    schema_version: 2,
    course: {
      slug,
      series: entry.series,
      topics: topicArticles.map(article => article.suffix),
      optional_articles: optionalArticles.map(article => article.suffix),
      articles: articles.map((article, index) => ({
        order: article.order,
        title: article.title,
        file: article.file,
        kind: articleKind(index, topicArticles.length, article.suffix),
      })),
    },
    capability_ledger: capabilityLedger,
  }

  if (!apply) return { slug, articleCount: articles.length, topicCount: topicArticles.length }

  const rewrittenFrontMatter = removeTopLevelField(entry.parsed.match[2], FIELD)
  const rewritten = entry.parsed.text.replace(entry.parsed.match[0], `${entry.parsed.match[1]}${rewrittenFrontMatter}${entry.parsed.match[3]}`)
  writeFileSync(entry.target, rewritten, 'utf8')
  const contractTarget = path.join(projectRoot, CONTRACT_ROOT, `${slug}.json`)
  mkdirSync(path.dirname(contractTarget), { recursive: true })
  writeFileSync(contractTarget, `${JSON.stringify(contract, null, 2)}\n`, 'utf8')

  const after = parseMarkdown(entry.target)
  if (Object.hasOwn(after.data, FIELD)) throw new Error(`${entry.target}: 旧字段删除失败`)
  const persisted = JSON.parse(readFileSync(contractTarget, 'utf8'))
  if (JSON.stringify(persisted.capability_ledger) !== JSON.stringify(capabilityLedger)) {
    throw new Error(`${contractTarget}: ledger 往返校验失败`)
  }
  return { slug, articleCount: articles.length, topicCount: topicArticles.length }
}

function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const rootIndex = args.indexOf('--root')
  const projectRoot = path.resolve(rootIndex >= 0 ? args[rootIndex + 1] : process.cwd())
  const courseRoot = path.join(projectRoot, COURSE_ROOT)
  const slugs = readdirSync(courseRoot, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
  const migrated = slugs.map(slug => migrateCourse(projectRoot, slug, apply)).filter(Boolean)
  process.stdout.write(`${JSON.stringify({ mode: apply ? 'apply' : 'preview', migrated }, null, 2)}\n`)
}

try {
  main()
} catch (error) {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
}
