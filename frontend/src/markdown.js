/**
 * Lightweight Markdown → safe HTML renderer.
 * Supports: # ## ###, **bold**, *italic*, `code`, lists, paragraphs.
 * Escapes HTML to prevent XSS.
 */

const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
}

function renderInline(text) {
  // order matters: code first to protect content
  const codeSpans = [];
  let s = text.replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(`<code>${escapeHtml(code)}</code>`);
    return `\u0000${codeSpans.length - 1}\u0000`;
  });
  s = escapeHtml(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => codeSpans[Number(i)]);
  return s;
}

export function renderMarkdown(md) {
  if (!md) return '';
  const lines = md.split('\n');
  const out = [];
  let inList = false;
  let paragraph = [];

  function flushPara() {
    if (paragraph.length) {
      out.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  }
  function flushList() {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  }

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const h3 = line.match(/^###\s+(.*)/);
    const li = line.match(/^[-*]\s+(.*)/);
    if (h1) {
      flushPara(); flushList();
      out.push(`<h1>${renderInline(h1[1])}</h1>`);
    } else if (h2) {
      flushPara(); flushList();
      out.push(`<h2>${renderInline(h2[1])}</h2>`);
    } else if (h3) {
      flushPara(); flushList();
      out.push(`<h3>${renderInline(h3[1])}</h3>`);
    } else if (li) {
      flushPara();
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${renderInline(li[1])}</li>`);
    } else if (line.trim() === '') {
      flushPara(); flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushPara(); flushList();
  return out.join('\n');
}
