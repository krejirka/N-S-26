import type { ReactNode } from "react";

/**
 * Jednoduché inline **tučné** (Markdown-like).
 * Neescapuje HTML — jen plain text + strong.
 */
export function InlineRichText({
  text,
  className,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  as?: "span" | "p" | "li";
}): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Tag className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </Tag>
  );
}

export default InlineRichText;
