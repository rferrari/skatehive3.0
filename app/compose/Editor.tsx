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
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles
} from '@mdxeditor/editor';
import { Box, Button, Input } from '@chakra-ui/react';
import '@mdxeditor/editor/style.css';
import { useRef } from 'react';

interface EditorProps {
  markdown: string;
  editorRef?: React.MutableRefObject<MDXEditorMethods | null>;
  setMarkdown: (markdown: string) => void;
}

const Editor: FC<EditorProps> = ({ markdown, editorRef, setMarkdown }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function imageUploadHandler(image: File) {
    const signature = await getFileSignature(image);
    const uploadUrl = await uploadImage(image, signature);
    return uploadUrl;
  }

  async function videoUploadHandler(video: File) {
    console.log('Starting video upload handler...');
    const formData = new FormData();
    formData.append('file', video);

    try {
      console.log('Sending video to Pinata API...');
      const response = await fetch('/api/pinata', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.error) {
        console.error('Error from Pinata API:', result.error);
        throw new Error(result.error);
      }
      console.log('Video uploaded successfully. CID:', result.IpfsHash);
      // Use skatehive's IPFS gateway instead of Pinata's gateway
      return `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;
    } catch (error) {
      console.error('Failed to upload video to Pinata:', error);
      throw error;
    }
  }

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Video upload input triggered');
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected for upload:', file.name);
      try {
        const videoUrl = await videoUploadHandler(file);
        console.log('Video URL generated:', videoUrl);

        // Create a direct video tag
        const videoTag = `<video width="100%" height="auto" controls>
  <source src="${videoUrl}" type="video/mp4">
  Your browser does not support the video tag.
</video>`;

        // Append the video tag to the markdown
        setMarkdown((prevMarkdown) => `${prevMarkdown}\n\n${videoTag}`);

        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Force the editor to refresh by toggling the markdown
        if (editorRef?.current) {
          const currentMarkdown = `${markdown}\n\n${videoTag}`;
          editorRef.current.setMarkdown(currentMarkdown);
        }
      } catch (error) {
        console.error('Error uploading video:', error);
      }
    } else {
      console.warn('No file selected for upload');
    }
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

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
    const transformedMarkdown = newMarkdown.replace(
      /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|[^/]+[?&]v=)|youtu\.be\/)([^"&?/ ]{11}))/g,
      (match) => `<iframe width="560" height="315" src="${transformYoutubeLink(match)}" frameborder="0" allowfullscreen></iframe>`
    );
    setMarkdown(transformedMarkdown);
  }

  return (
    <Box
      className="w-full h-full bg-background min-h-screen"
      sx={{
        color: 'primary',
        '& .mdx-editor-content': {
          color: 'primary',
          backgroundColor: 'rgb(37, 37, 37)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
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
            color: 'background',
            backgroundColor: 'primary',
            border: '1px solid',
            borderColor: 'secondary',
            '&:hover': {
              backgroundColor: 'accent',
              color: 'accent',
            },
            '&[data-state="on"]': {
              backgroundColor: 'accent',
              color: 'background',
            },
            '& svg': {
              fill: 'currentColor',
            },
          },
          '& ._toolbarToggleItem_uazmk_206': {
            borderRadius: 'md',
          },
          '& ._toolbarToggleSingleGroup_uazmk_222': {
            display: 'flex',
            gap: '0.5rem',
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
        // Enable HTML rendering
        suppressHtmlProcessing={false}
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
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <InsertTable />
                <CodeToggle />
                <ListsToggle />
                <CreateLink />
                <InsertThematicBreak />
                <InsertImage />
                <Button
                  onClick={openFilePicker}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                  }}
                  title="Insert Video"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M17 10.5V7c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-3.5l4 4v-11l-4 4z"></path>
                  </svg>
                </Button>
                <Input
                  type="file"
                  accept="video/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleVideoUpload}
                />
              </>
            ),
          }),
        ]}
      />
    </Box>
  );
};

export default Editor;
