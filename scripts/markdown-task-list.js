'use strict'

const TASK_LIST_ITEM_PATTERN = /<li([^>]*)>(\s*(?:<p>)?)\[( |x|X)\](?=\s)/g

function addClass(attributes, className) {
  const classAttribute = attributes.match(/\sclass=(['"])(.*?)\1/i)
  if (!classAttribute) return `${attributes} class="${className}"`

  const classes = classAttribute[2].split(/\s+/).filter(Boolean)
  if (!classes.includes(className)) classes.push(className)

  return attributes.replace(classAttribute[0], ` class=${classAttribute[1]}${classes.join(' ')}${classAttribute[1]}`)
}

function renderTaskLists(html) {
  if (typeof html !== 'string' || !html.includes('[ ]') && !html.includes('[x]') && !html.includes('[X]')) {
    return html
  }

  return html.replace(TASK_LIST_ITEM_PATTERN, (match, attributes, prefix, state) => {
    const checked = state.toLowerCase() === 'x'
    const itemAttributes = addClass(attributes, 'task-list-item')
    const checkboxAttributes = [
      'class="task-list-checkbox"',
      'type="checkbox"',
      checked ? 'checked' : '',
      'disabled',
      `aria-label="${checked ? '已完成' : '未完成'}"`,
    ].filter(Boolean).join(' ')

    return `<li${itemAttributes}>${prefix}<input ${checkboxAttributes}>`
  })
}

hexo.extend.filter.register('after_render:html', renderTaskLists, 90)
