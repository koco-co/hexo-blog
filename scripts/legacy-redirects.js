const fs = require('node:fs');
const path = require('node:path');

const ABBRLINK_PATTERN = /^[a-z0-9]+$/i;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeAbbrlink(value, field) {
  if (typeof value !== 'string' || !ABBRLINK_PATTERN.test(value)) {
    throw new Error(`legacy redirects: ${field} must be an alphanumeric abbrlink`);
  }
  return value.toLowerCase();
}

function postValues(posts) {
  if (!posts) return [];
  if (typeof posts.toArray === 'function') return posts.toArray();
  if (Array.isArray(posts)) return posts;
  if (Array.isArray(posts.data)) return posts.data;
  return [];
}

function sourceRelative(value) {
  return String(value || '').replaceAll('\\', '/').replace(/^\.\//, '').replace(/^source\//, '');
}

function validateManifest(manifest, posts, options = {}) {
  if (!Array.isArray(manifest)) {
    throw new Error('legacy redirects: manifest must be a JSON array');
  }

  const publishedPosts = postValues(posts);
  const postByAbbrlink = new Map();
  for (const post of publishedPosts) {
    if (post.published === false || post.abbrlink === undefined) continue;
    const abbrlink = normalizeAbbrlink(String(post.abbrlink), 'post abbrlink');
    if (postByAbbrlink.has(abbrlink)) {
      throw new Error(`legacy redirects: duplicate published route /posts/${abbrlink}/`);
    }
    postByAbbrlink.set(abbrlink, post);
  }

  const fromSet = new Set();
  const normalized = manifest.map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`legacy redirects: row ${index + 1} must be an object`);
    }
    const fromAbbrlink = normalizeAbbrlink(row.fromAbbrlink, 'fromAbbrlink');
    const toAbbrlink = normalizeAbbrlink(row.toAbbrlink, 'toAbbrlink');
    if (fromSet.has(fromAbbrlink)) {
      throw new Error(`legacy redirects: duplicate old route /posts/${fromAbbrlink}/`);
    }
    if (fromAbbrlink === toAbbrlink) {
      throw new Error(`legacy redirects: self redirect /posts/${fromAbbrlink}/`);
    }
    fromSet.add(fromAbbrlink);
    return { ...row, fromAbbrlink, toAbbrlink };
  });

  for (const row of normalized) {
    if (fromSet.has(row.toAbbrlink)) {
      throw new Error(`legacy redirects: redirect chains or cycles are forbidden at /posts/${row.toAbbrlink}/`);
    }
    if (postByAbbrlink.has(row.fromAbbrlink)) {
      throw new Error(`legacy redirects: source route still exists /posts/${row.fromAbbrlink}/`);
    }
    const target = postByAbbrlink.get(row.toAbbrlink);
    if (!target) {
      throw new Error(`legacy redirects: target is missing or unpublished /posts/${row.toAbbrlink}/`);
    }
    if (row.toFile && target.source && sourceRelative(target.source) !== sourceRelative(row.toFile)) {
      throw new Error(`legacy redirects: target file mismatch for /posts/${row.toAbbrlink}/`);
    }
    if (options.baseDir) {
      if (typeof row.fromFile !== 'string' || !row.fromFile.startsWith('source/')) {
        throw new Error(`legacy redirects: fromFile is required for /posts/${row.fromAbbrlink}/`);
      }
      const sourcePath = path.resolve(options.baseDir, row.fromFile);
      const sourceRoot = path.resolve(options.baseDir, 'source');
      if (sourcePath !== sourceRoot && !sourcePath.startsWith(`${sourceRoot}${path.sep}`)) {
        throw new Error(`legacy redirects: fromFile escapes source directory for /posts/${row.fromAbbrlink}/`);
      }
      if (fs.existsSync(sourcePath)) {
        throw new Error(`legacy redirects: source file still exists ${row.fromFile}`);
      }
    }
    row.targetRoute = target.path || `posts/${row.toAbbrlink}/index.html`;
  }
  return normalized;
}

function rootedRoute(route, root = '/') {
  const cleanRoot = `/${String(root || '/').replace(/^\/+|\/+$/g, '')}`.replace('//', '/');
  const prefix = cleanRoot === '/' ? '/' : `${cleanRoot}/`;
  return `${prefix}${String(route).replace(/^\/+/, '')}`;
}

function redirectHtml(targetPath, canonicalUrl = targetPath) {
  const escapedTarget = escapeHtml(targetPath);
  const escapedCanonical = escapeHtml(canonicalUrl);
  const jsTarget = JSON.stringify(targetPath).replaceAll('<', '\\u003c');
  return `<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="robots" content="noindex">\n<link rel="canonical" href="${escapedCanonical}">\n<meta http-equiv="refresh" content="0; url=${escapedTarget}">\n<title>页面已迁移</title>\n</head>\n<body>\n<p>页面已迁移到 <a href="${escapedTarget}">${escapedTarget}</a>。</p>\n<script>location.replace(${jsTarget} + location.search + location.hash);</script>\n</body>\n</html>\n`;
}

function redirectRoutes(rows, config = {}) {
  const siteUrl = String(config.url || '').replace(/\/$/, '');
  const siteOrigin = siteUrl ? new URL(siteUrl).origin : '';
  return rows.map((row) => {
    const targetPath = rootedRoute(row.targetRoute, config.root);
    return {
      path: `posts/${row.fromAbbrlink}/index.html`,
      data: redirectHtml(targetPath, siteOrigin ? `${siteOrigin}${targetPath}` : targetPath),
    };
  });
}

function install(hexoInstance) {
  let validatedRows = null;
  hexoInstance.extend.filter.register('before_generate', () => {
    const manifest = hexoInstance.locals.get('data')?.['legacy-redirects'] ?? [];
    validatedRows = validateManifest(manifest, hexoInstance.locals.get('posts'), {
      baseDir: hexoInstance.base_dir,
    });
  });
  hexoInstance.extend.filter.register('after_generate', () => {
    if (validatedRows === null) {
      throw new Error('legacy redirects: before_generate validation did not run');
    }
    const routes = redirectRoutes(validatedRows, hexoInstance.config);
    const occupied = new Set(hexoInstance.route.list());
    for (const route of routes) {
      if (occupied.has(route.path)) {
        throw new Error(`legacy redirects: generated route already exists /${route.path}`);
      }
    }
    for (const route of routes) hexoInstance.route.set(route.path, route.data);
  });
}

module.exports = { escapeHtml, install, redirectHtml, redirectRoutes, rootedRoute, validateManifest };

if (typeof hexo !== 'undefined') install(hexo);
