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
      if (name.startsWith('on') || name === 'javascript' || name === 'vbscript') {
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

  const renderedHtml = useMemo(() => {
    if (message.bodyType !== 'html') return ''
    return replaceImageSources(sanitizedHtml, showImages)
  }, [sanitizedHtml, showImages, message.bodyType])

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
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    )
  }

  return (
    <pre className="text-sm font-mono text-text-primary leading-relaxed whitespace-pre-wrap bg-neutral-50 rounded-md p-3">
      {message.body}
    </pre>
  )
}
