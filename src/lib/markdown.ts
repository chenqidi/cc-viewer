import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';

const markdownValidator = unified().use(remarkParse).use(remarkGfm);

const markdownFormatter = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkStringify, {
    bullet: '-',
    fences: true,
    incrementListMarker: false,
    listItemIndent: 'one',
  });

export function isValidMarkdown(text: string): boolean {
  if (!text.trim()) {
    return true;
  }

  try {
    markdownValidator.parse(text);
    return true;
  } catch {
    return false;
  }
}

export function repairMarkdown(text: string): string | null {
  if (!text.trim()) {
    return text;
  }

  try {
    const file = markdownFormatter.processSync(text);
    return String(file);
  } catch {
    return null;
  }
}
