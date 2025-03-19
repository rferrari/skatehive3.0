'use client';
import { FC } from "react";
import { getFileSignature, uploadImage } from '@/lib/hive/client-functions';
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  imagePlugin,
  InsertImage,
  DiffSourceToggleWrapper,
  diffSourcePlugin,
  BlockTypeSelect,
  tablePlugin,
  InsertTable,
  CodeToggle,
  linkDialogPlugin,
  CreateLink,
  ListsToggle,
  InsertThematicBreak,
  codeMirrorPlugin,
  codeBlockPlugin,
} from '@mdxeditor/editor';
import { UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin } from '@mdxeditor/editor';
import { Box } from '@chakra-ui/react';
import '@mdxeditor/editor/style.css';

interface EditorProps {
  markdown: string;
  editorRef?: React.MutableRefObject<MDXEditorMethods | null>;
  setMarkdown: (markdown: string) => void;
}

const Editor: FC<EditorProps> = ({ markdown, editorRef, setMarkdown }) => {
  async function imageUploadHandler(image: File) {
    const signature = await getFileSignature(image);
    const uploadUrl = await uploadImage(image, signature);
    return uploadUrl;
  }

  const transformYoutubeLink = (url: string) => {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|[^/]+[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/g;
    const match = url.match(youtubeRegex);
    if (match) {
      const youtubeId = match[0].split('v=')[1] || match[0].split('/').pop();
      return `https://www.youtube.com/embed/${youtubeId}`;
    }
    return url;
  }

  const handleMarkdownChange = (newMarkdown: string) => {
    // Transform YouTube links in the markdown content
    const transformedMarkdown = newMarkdown.replace(
      /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|[^/]+[?&]v=)|youtu\.be\/)([^"&?/ ]{11}))/g,
      (match) => `<iframe width="560" height="315" src="${transformYoutubeLink(match)}" frameborder="0" allowfullscreen></iframe>`
    );
    setMarkdown(transformedMarkdown);
  }

  return (
    <Box
      className="w-full h-full bg-background min-h-screen" // Ensure full height
      sx={{
        color: 'primary',
        '& .mdx-editor-content': {
          color: 'primary',
          backgroundColor: 'rgb(37, 37, 37)',
          minHeight: '100vh', // Ensure content occupies the full viewport height
          display: 'flex', // Flexbox for alignment
          flexDirection: 'column',
          justifyContent: 'flex-start', // Align content to the top
          '& h1': { fontSize: '4xl' },
          '& h2': { fontSize: '3xl' },
          '& h3': { fontSize: '2xl' },
          '& h4': { fontSize: 'xl' },
          '& h5': { fontSize: 'lg' },
          '& h6': { fontSize: 'md' },
          fontFamily: 'body',
          '& blockquote': {
            borderLeft: '4px solid',
            borderColor: 'primary',
            paddingLeft: 4,
            margin: 0,
          },
          // style for links
          '& a': {
            color: 'blue',
            textDecoration: 'underline',
          },
        },
        '& .mdxeditor-toolbar': {
          backgroundColor: 'primary',
          color: 'secondary',
          borderRadius: 'md',
          padding: 2,
          '& button': {
            color: 'background', // Inverted: Use hover color as normal
            backgroundColor: 'primary', // Inverted: Use hover background as normal
            border: '1px solid',
            borderColor: 'secondary',
            '&:hover': {
              backgroundColor: 'accent', // Inverted: Use normal background as hover
              color: 'accent', // Inverted: Use normal color as hover
            },
            '&[data-state="on"]': {
              backgroundColor: 'accent',
              color: 'background',
            },
            '& svg': {
              fill: 'currentColor', // Ensure SVG icons use the button's text color
            },
          },
          '& ._toolbarToggleItem_uazmk_206': {
            borderRadius: 'md',
          },
          '& ._toolbarToggleSingleGroup_uazmk_222': {
            display: 'flex',
            gap: '0.5rem', // Add spacing between buttons
            '& button': {
              // Remove individual button styles to ensure uniformity
            },
          },
        },
      }}
    >
      <MDXEditor
        placeholder="Create your own page of Skatehive Magazine here..."
        contentEditableClassName="mdx-editor-content"
        onChange={handleMarkdownChange}
        ref={editorRef}
        markdown={markdown}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          tablePlugin(),
          linkDialogPlugin(),
          codeBlockPlugin(),
          codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', txt: 'text', tsx: 'TypeScript' } }),
          imagePlugin({ imageUploadHandler }),
          diffSourcePlugin({
            diffMarkdown: markdown,
            viewMode: 'rich-text',
            readOnlyDiff: false,
          }),
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <UndoRedo />
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <InsertTable />
                <CodeToggle />
                <ListsToggle />
                <CreateLink />
                <InsertThematicBreak />
                <InsertImage />
              </DiffSourceToggleWrapper>
            ),
          }),
        ]}
      />
    </Box>
  );
};

export default Editor;
