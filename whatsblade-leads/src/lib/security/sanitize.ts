const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button', 'select', 'img', 'svg', 'video', 'audio', 'source', 'link', 'meta', 'base', 'head', 'body', 'html'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect', 'onkeydown', 'onkeyup', 'onkeypress'],
  ADD_ATTR: ['rel'],
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
};

export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
}

export function sanitizeHtml(input: string): string {
  const sanitized = sanitizeText(input);

  const allowedTags = new Set(PURIFY_CONFIG.ALLOWED_TAGS);
  const allowedAttrs = new Set(PURIFY_CONFIG.ALLOWED_ATTR);

  let result = sanitized;

  result = result.replace(/<(\w+)([^>]*)>/g, (_match, tag, attrs) => {
    if (!allowedTags.has(tag)) return '';

    const cleanAttrs = attrs.replace(/(\w+)="([^"]*)"/g, (_attrMatch: string, name: string, value: string) => {
      if (allowedAttrs.has(name) && !value.toLowerCase().includes('javascript:') && !value.toLowerCase().includes('data:')) {
        return `${name}="${value}"`;
      }
      return '';
    });

    return `<${tag}${cleanAttrs}>`;
  });

  result = result.replace(/<\/(\w+)>/g, (_match, tag) => {
    if (!allowedTags.has(tag)) return '';
    return `</${tag}>`;
  });

  return result;
}

export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();

  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);

    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      return '';
    }

    return parsed.toString();
  } catch {
    return '';
  }
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+\-() ]/g, '').trim();
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[<>]/g, '');
}

export function isValidEmail(email: string): boolean {
  const sanitized = sanitizeEmail(email);
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(sanitized);
}

export function truncateInput(input: string, maxLength: number = 500): string {
  return sanitizeText(input).slice(0, maxLength);
}
