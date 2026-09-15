import type { ReactNode } from 'react';

/** Minimal markdown: paragraphs, **bold**, *italic*, `code`, - lists, numbered lists. */
export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n\n+/);
  return (
    <div className="md">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        const isUl = lines.every((l) => /^[-*]\s+/.test(l) || l.trim() === '');
        const isOl = lines.every((l) => /^\d+\.\s+/.test(l) || l.trim() === '');
        if (isUl) {
          return (
            <ul key={i}>
              {lines.filter((l) => l.trim()).map((l, j) => (
                <li key={j}>{inline(l.replace(/^[-*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        if (isOl) {
          return (
            <ol key={i}>
              {lines.filter((l) => l.trim()).map((l, j) => (
                <li key={j}>{inline(l.replace(/^\d+\.\s+/, ''))}</li>
              ))}
            </ol>
          );
        }
        return <p key={i}>{inline(lines.join(' '))}</p>;
      })}
    </div>
  );
}

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else {
      parts.push(<code key={key++}>{token.slice(1, -1)}</code>);
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
