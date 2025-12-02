import React from 'react'

function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n?/g, '\n').split('\n')
  let html = ''
  let inCode = false
  let codeLang = ''
  let listType: 'ul' | 'ol' | '' = ''
  for (let raw of lines) {
    const line = raw
    if (line.trim().startsWith('```')) {
      if (!inCode) {
        inCode = true
        codeLang = line.trim().slice(3).trim()
        html += `<pre><code class="lang-${codeLang}">`
      } else {
        inCode = false
        codeLang = ''
        html += `</code></pre>`
      }
      continue
    }
    if (inCode) {
      html += line.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '\n'
      continue
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      const text = h[2]
      if (listType) { html += `</${listType}>`; listType = '' }
      html += `<h${level}>${text}</h${level}>`
      continue
    }
    const olm = line.match(/^\s*\d+\.\s+(.*)$/)
    const ulm = line.match(/^\s*[-*]\s+(.*)$/)
    if (olm) {
      if (listType !== 'ol') { if (listType) html += `</${listType}>`; html += '<ol>'; listType = 'ol' }
      html += `<li>${olm[1]}</li>`
      continue
    }
    if (ulm) {
      if (listType !== 'ul') { if (listType) html += `</${listType}>`; html += '<ul>'; listType = 'ul' }
      html += `<li>${ulm[1]}</li>`
      continue
    }
    if (listType) { html += `</${listType}>`; listType = '' }
    let text = line
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')
    text = text.replace(/`([^`]+?)`/g, '<code>$1</code>')
    text = text.replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    if (text.trim() === '') { html += '<br/>' } else { html += `<p>${text}</p>` }
  }
  if (listType) { html += `</${listType}>`; listType = '' }
  if (inCode) { html += `</code></pre>`; inCode = false }
  return html
}

export default function Markdown({ content }: { content?: string }) {
  const html = mdToHtml(content || '')
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

