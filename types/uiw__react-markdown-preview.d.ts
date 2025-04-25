declare module "@uiw/react-markdown-preview" {
  import React from "react";

  export interface Components {
    [key: string]: React.ElementType;
  }

  const MarkdownPreview: React.FC<{
    source: string;
    components?: Components;
  }>;

  export default MarkdownPreview;
}
