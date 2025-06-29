import React from "react";
import markdownRenderer from "@/lib/utils/MarkdownRenderer";
import { Image } from "@chakra-ui/react";

interface HiveMarkdownProps {
  markdown: string;
  className?: string;
  style?: React.CSSProperties;
}

// Mention component for inline rendering
const Mention: React.FC<{ username: string }> = ({ username }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
    <Image
      src={`https://images.hive.blog/u/${username}/avatar/small`}
      alt={`@${username}`}
      style={{
        width: 25,
        height: 25,
        borderRadius: "50%",
        objectFit: "cover",
        verticalAlign: "middle",
        display: "inline-block",
        marginRight: 4,
      }}
      loading="lazy"
    />
    <a
      href={`/@${username}`}
      style={{
        textDecoration: "underline",
        color: "#3182ce",
      }}
    >
      @{username}
    </a>
  </span>
);

const HiveMarkdown: React.FC<HiveMarkdownProps> = ({
  markdown,
  className = "markdown-body",
  style,
}) => {
  const rawHtml = markdownRenderer(markdown);

  // Replace <mention data-username="username">@username</mention> with <Mention />
  const processMentions = (html: string) => {
    const regex =
      /<mention data-username="([a-zA-Z0-9._-]+)">@([a-zA-Z0-9._-]+)<\/mention>/g;
    const parts: Array<string | React.ReactElement> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      const fullMatch = match[0];
      const username = match[1];
      // Push preceding HTML
      if (match.index > lastIndex) {
        parts.push(html.slice(lastIndex, match.index));
      }
      parts.push(<Mention key={username + match.index} username={username} />);
      lastIndex = match.index + fullMatch.length;
    }
    // Push remaining HTML
    if (lastIndex < html.length) {
      parts.push(html.slice(lastIndex));
    }
    return parts;
  };

  // If there are mentions, process them, else just dangerouslySetInnerHTML
  if (rawHtml.includes("<mention")) {
    return (
      <div className={className} style={style}>
        {processMentions(rawHtml).map((part, i) =>
          typeof part === "string" ? (
            <span key={i} dangerouslySetInnerHTML={{ __html: part }} />
          ) : (
            part
          )
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: rawHtml }}
    />
  );
};

export default HiveMarkdown;
