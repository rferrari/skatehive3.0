'use client';
import React, { FC, useMemo, useRef, useState } from "react"; // Explicitly import React and useState
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
  BoldItalicUnderlineToggles,
  diffSourcePlugin
} from '@mdxeditor/editor';
import { Box, Button, Input, Skeleton } from '@chakra-ui/react';
import '@mdxeditor/editor/style.css';

interface EditorProps {
  markdown: string;
  editorRef?: React.MutableRefObject<MDXEditorMethods | null>;
  setMarkdown: (markdown: string) => void;
}

const Editor: FC<EditorProps> = ({ markdown, editorRef, setMarkdown }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  async function imageUploadHandler(image: File) {
    const signature = await getFileSignature(image);
    const uploadUrl = await uploadImage(image, signature);
    return uploadUrl;
  }

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Video upload input triggered');
    const file = event.target.files?.[0];
    if (!file) {
      console.warn('No file selected for upload');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      console.error('Invalid file type. Please upload a video file.');
      return;
    }

    console.log('File selected for upload:', file.name);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Sending video to Pinata API...');
      const response = await fetch('/api/pinata', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.error || !result.IpfsHash) {
        throw new Error(result.error || 'No IPFS hash returned');
      }

      console.log('Video uploaded successfully. CID:', result.IpfsHash);
      
      // Use skatehive's IPFS gateway with proper content type handling
      const videoUrl = `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;
      
      // Insert the video using our custom VideoRenderer component
      const videoTag = `<div class="video-embed" data-ipfs-hash="${result.IpfsHash}">
        <video 
          width="100%" 
          height="400" 
          controls 
          preload="none" 
          playsinline 
          webkit-playsinline 
          muted
          poster="https://ipfs.skatehive.app/ipfs/${result.IpfsHash}?format=preview">
          <source src="${videoUrl}" type="video/mp4">
          <source src="${videoUrl}" type="video/webm">
          Your browser doesn't support HTML5 video.
        </video>
      </div>`;

      // Update the markdown with the video tag
      const updatedMarkdown = `${markdown}\n${videoTag}`;
      setMarkdown(updatedMarkdown);
      console.log('Markdown updated with video tag');

      // Force the editor to refresh
      if (editorRef?.current) {
        setTimeout(() => {
          setMarkdown(updatedMarkdown);
        }, 100);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      // Here you could add a toast notification or other user feedback
    } finally {
      setIsLoading(false);
      // Clear the file input for future uploads
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      (match) => `<div class="video-embed">&#8203;<iframe width="560" height="315" src="${transformYoutubeLink(match)}" frameborder="0" allowfullscreen></iframe>&#8203;</div>`
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
      {isLoading ? (
        <Skeleton height="100vh" width="100%" />
      ) : (
        <MDXEditor
          placeholder="Create your own page of Skatehive Magazine here..."
          contentEditableClassName="mdx-editor-content"
          onChange={handleMarkdownChange}
          ref={editorRef}
          autoFocus
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
                <>
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
                  </DiffSourceToggleWrapper>
                </>
              ),
            }),
          ]}
        />
      )}
    </Box>
  );
};

export default Editor;
