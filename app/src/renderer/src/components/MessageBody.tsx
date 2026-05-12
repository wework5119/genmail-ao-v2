import { useState, useMemo } from 'react'
import type { Message } from '../types'

function sanitizeHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const scripts = doc.querySelectorAll('script, iframe, object, embed, form')
  scripts.forEach((el) => el.remove())

  const allElements = doc.querySelectorAll('*')
  allElements.forEach((el) => {
    const attrs = el.attributes
    for (let i = attrs.length - 1; i >= 0; i--) {
      const name = attrs[i].name.toLowerCase()
      const value = attrs[i].value.toLowerCase().trimStart()
      // Remove event-handler attributes (onclick, onload, etc.)
      if (name.startsWith('on')) {
        el.removeAttribute(attrs[i].name)
        continue
      }
      // Remove attributes whose value contains a javascript:/vbscript: URI
      // (covers href="javascript:alert(1)", src="javascript:...", etc.)
      if (value.startsWith('javascript:') || value.startsWith('vbscript:')) {
        el.removeAttribute(attrs[i].name)
      }
    }
  })

  const links = doc.querySelectorAll('a[href]')
  links.forEach((el) => {
    el.setAttribute('target', '_blank')
    el.setAttribute('rel', 'noopener noreferrer')
  })

  return doc.body.innerHTML
}

function replaceImageSources(html: string, showImages: boolean): string {
  if (!showImages) {
    return html.replace(/<img[^>]+>/gi, (match) => {
      return match.replace(/src=["'][^"']*["']/gi, '')
    })
  }
  return html
}

/**
 * Split HTML body into main content + quoted reply (blockquote at end or
 * Gmail-style div.gmail_quote). Returns { main, quoted } where quoted may
 * be undefined if no quoted block is detected.
 */
function splitQuotedContent(html: string): { main: string; quoted: string | undefined } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const body = doc.body

  // Gmail / Outlook quoted markers
  const gmailQuote = body.querySelector('.gmail_quote, .yahoo_quoted, blockquote[type="cite"]')
  if (gmailQuote && gmailQuote.parentElement === body) {
    const quotedHtml = gmailQuote.outerHTML
    gmailQuote.remove()
    const mainHtml = body.innerHTML.trim()
    if (mainHtml.length > 0 && quotedHtml.length > 0) {
      return { main: mainHtml, quoted: quotedHtml }
    }
  }

  // Last top-level blockquote heuristic
  const topBlockquotes = Array.from(body.children).filter(
    (el) => el.tagName === 'BLOCKQUOTE'
  )
  const lastBlockquote = topBlockquotes[topBlockquotes.length - 1]
  if (lastBlockquote && topBlockquotes.length >= 1) {
    const quotedHtml = lastBlockquote.outerHTML
    lastBlockquote.remove()
    const mainHtml = body.innerHTML.trim()
    if (mainHtml.length > 0) {
      return { main: mainHtml, quoted: quotedHtml }
    }
  }

  return { main: html, quoted: undefined }
}

function ExpandableQuotedText({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-medium text-text-tertiary bg-neutral-100 hover:bg-neutral-200 rounded transition-colors duration-[120ms]"
        aria-expanded={expanded}
        title={expanded ? 'Collapse quoted text' : 'Show quoted text'}
      >
        <svg
          className={`w-2.5 h-2.5 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
          viewBox="0 0 8 8"
          fill="currentColor"
        >
          <path d="M2 1l4 3-4 3V1z" />
        </svg>
        {expanded ? 'Hide quote' : 'Show quote'}
      </button>
      {expanded && (
        <div
          className="mt-2 message-body text-sm text-text-secondary leading-relaxed border-l-2 border-neutral-200 pl-3"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  )
}

interface MessageBodyProps {
  message: Message
}

export default function MessageBody({ message }: MessageBodyProps) {
  const [showImages, setShowImages] = useState(false)

  const sanitizedHtml = useMemo(() => {
    if (message.bodyType !== 'html') return ''
    return sanitizeHtml(message.body)
  }, [message.body, message.bodyType])

  const hasImages = useMemo(() => {
    if (message.bodyType !== 'html') return false
    return /<img[^>]+src=["']/i.test(message.body)
  }, [message.body, message.bodyType])

  const { mainHtml, quotedHtml } = useMemo(() => {
    if (message.bodyType !== 'html') return { mainHtml: '', quotedHtml: undefined }
    const { main, quoted } = splitQuotedContent(sanitizedHtml)
    return { mainHtml: main, quotedHtml: quoted }
  }, [sanitizedHtml, message.bodyType])

  const renderedMain = useMemo(() => {
    if (message.bodyType !== 'html') return ''
    return replaceImageSources(mainHtml, showImages)
  }, [mainHtml, showImages, message.bodyType])

  const renderedQuoted = useMemo(() => {
    if (!quotedHtml) return undefined
    return replaceImageSources(quotedHtml, showImages)
  }, [quotedHtml, showImages])

  if (message.bodyType === 'html') {
    return (
      <div>
        {hasImages && !showImages && (
          <button
            onClick={() => setShowImages(true)}
            className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-accent-blue bg-accent-blueLight rounded-full hover:bg-blue-100 transition-colors duration-[120ms]"
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2.5A1.5 1.5 0 013.5 1h9A1.5 1.5 0 0114 2.5v11a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 13.5v-11zM3.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h9a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-9z" />
              <path d="M4 4h8v1H4V4zm0 2h8v1H4V6zm0 2h5v1H4V8zm0 2h8v1H4v-1z" />
            </svg>
            Show images
          </button>
        )}
        <div
          className="message-body text-sm text-text-primary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderedMain }}
        />
        {renderedQuoted && <ExpandableQuotedText html={renderedQuoted} />}
      </div>
    )
  }

  return (
    <pre className="text-sm font-mono text-text-primary leading-relaxed whitespace-pre-wrap bg-neutral-50 rounded-md p-3">
      {message.body}
    </pre>
  )
}
