import React from "react";
import markdownRenderer from "@/lib/utils/MarkdownRenderer";

interface HiveMarkdownProps {
  markdown: string;
  className?: string;
  style?: React.CSSProperties;
}

const HiveMarkdown: React.FC<HiveMarkdownProps> = ({ markdown, className = "markdown-body", style }) => (
  <div
    className={className}
    style={style}
    dangerouslySetInnerHTML={{ __html: markdownRenderer(markdown) }}
  />
);

export default HiveMarkdown; 