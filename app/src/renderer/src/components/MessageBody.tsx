import { useState, useMemo } from 'react'
import type { Message } from '../types'

function sanitizeHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Remove dangerous tags that can exfiltrate data, redirect, or execute code:
  // - script/iframe/object/embed/form: execution vectors
  // - style: CSS url() can beacon external trackers bypassing image blocking
  // - meta: http-equiv="refresh" can redirect the frame
  // - base: alters all relative link destinations
  // - link: can load external stylesheets or trigger requests
  const scripts = doc.querySelectorAll(
    'script, iframe, object, embed, form, style, meta, base, link'
  )
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
      // Remove attributes whose value starts with a dangerous URI scheme.
      // - javascript:/vbscript: execute code in the renderer
      // - data: can encode HTML/JS payloads (e.g. data:text/html,<script>...)
      //   that execute when clicked or loaded as a resource
      if (
        value.startsWith('javascript:') ||
        value.startsWith('vbscript:') ||
        value.startsWith('data:')
      ) {
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
        className="inline-flex items-center gap-1.5 px-2 py-1 text-2xs font-medium text-text-tertiary bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors duration-[120ms]"
        aria-expanded={expanded}
        title={expanded ? 'Collapse quoted text' : 'Show quoted text'}
      >
        {/* Three-dots icon for quoted text (common mail client convention) */}
        <svg className="w-3 h-3" viewBox="0 0 12 4" fill="currentColor">
          <circle cx="1.5" cy="2" r="1.5" />
          <circle cx="6" cy="2" r="1.5" />
          <circle cx="10.5" cy="2" r="1.5" />
        </svg>
        {expanded ? 'Hide quoted text' : 'Show quoted text'}
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

  // Check sanitizedHtml (not raw body) so that data: URI images already stripped
  // by the sanitizer don't produce a spurious "Show images" banner.
  const hasImages = useMemo(() => {
    if (message.bodyType !== 'html') return false
    return /<img[^>]+src=["']/i.test(sanitizedHtml)
  }, [sanitizedHtml, message.bodyType])

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
          <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-border rounded-md">
            <svg className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="1" width="14" height="14" rx="2" />
              <path d="M1 11l4-4 3 3 3-4 4 5" />
              <circle cx="5.5" cy="5.5" r="1" fill="currentColor" stroke="none" />
            </svg>
            <span className="text-2xs text-text-secondary flex-1">
              Images are blocked to protect your privacy
            </span>
            <button
              onClick={() => setShowImages(true)}
              className="text-2xs font-medium text-accent-600 hover:text-accent-700 transition-colors duration-[120ms] whitespace-nowrap"
            >
              Show images
            </button>
          </div>
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
