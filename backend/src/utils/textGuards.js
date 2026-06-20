export function looksDegenerate(text, threshold = 0.3) {
  if (!text || text.length < 50) return false;
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 10) return false;
  const unique = new Set(words);
  return unique.size / words.length < threshold;
}

export function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

export function stripMarkdownNoise(text) {
  return normalizeText(text)
    .replace(/[🚀⚡✅❌⭐🎯💡🔧📊⚠️]/g, '')
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, ''))
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/__+/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
