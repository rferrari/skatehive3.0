import { visit } from 'unist-util-visit';
import type { Literal, Parent } from 'unist';

export default function rehypeMentionLinks() {
  return (tree: any) => {
    visit(tree, 'text', (node: Literal, index: number | undefined, parent: Parent) => {
      if (!node.value || typeof index !== 'number') return;
      // If parent is a link, do not transform
      if (parent && (parent as any).tagName === 'a') return;
      const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
      let match;
      let lastIndex = 0;
      const newNodes = [];
      while ((match = mentionRegex.exec(node.value as string)) !== null) {
        if (match.index > lastIndex) {
          newNodes.push({
            type: 'text',
            value: (node.value as string).slice(lastIndex, match.index),
          });
        }
        const username = match[1];
        newNodes.push({
          type: 'element',
          tagName: 'span',
          properties: {
            style: 'display:inline-flex;align-items:center;gap:4px;',
          },
          children: [
            {
              type: 'element',
              tagName: 'img',
              properties: {
                src: `https://images.hive.blog/u/${username}/avatar/small`,
                alt: `@${username}`,
                style: 'width:20px;height:20px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:4px;',
                loading: 'lazy',
              },
              children: [],
            },
            {
              type: 'element',
              tagName: 'a',
              properties: {
                href: `/@${username}`,
                style: 'color:#3182ce;text-decoration:underline;',
              },
              children: [{ type: 'text', value: `@${username}` }],
            },
          ],
        });
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < (node.value as string).length) {
        newNodes.push({
          type: 'text',
          value: (node.value as string).slice(lastIndex),
        });
      }
      if (newNodes.length) {
        parent.children.splice(index, 1, ...newNodes);
      }
    });
  };
} 