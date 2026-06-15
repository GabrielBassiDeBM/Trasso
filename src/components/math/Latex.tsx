import katex from "katex";

interface LatexProps {
  text: string;
  className?: string;
}

type Segment =
  | { kind: "text"; value: string }
  | { kind: "inline"; value: string }
  | { kind: "block"; value: string };

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /\$\$([^$]+)\$\$|\$([^$\n]+)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      segments.push({ kind: "block", value: match[1] });
    } else {
      segments.push({ kind: "inline", value: match[2] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return segments;
}

function renderMath(value: string, displayMode: boolean): string {
  try {
    return katex.renderToString(value, { throwOnError: false, displayMode });
  } catch {
    return value;
  }
}

/** Renders plain text with inline `$...$` / block `$$...$$` LaTeX via KaTeX. */
export function Latex({ text, className }: LatexProps) {
  const segments = parseSegments(text ?? "");

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.kind === "text") {
          const lines = segment.value.split("\n");
          return (
            <span key={index}>
              {lines.map((line, lineIndex) => (
                <span key={lineIndex}>
                  {line}
                  {lineIndex < lines.length - 1 && <br />}
                </span>
              ))}
            </span>
          );
        }
        return (
          <span
            key={index}
            dangerouslySetInnerHTML={{ __html: renderMath(segment.value, segment.kind === "block") }}
          />
        );
      })}
    </span>
  );
}
