import { DefaultRenderer } from "@hiveio/content-renderer";
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import VideoRenderer from '../../components/layout/VideoRenderer';

export default function markdownRenderer(markdown: string) {
    // Return early if the markdown is empty
    if (!markdown || markdown.trim() === "") return "";

    // Pre-process markdown to transform IPFS video links before rendering
    const preprocessedMarkdown = preProcessIpfsContent(markdown);

    const renderer = new DefaultRenderer({
        baseUrl: "https://hive.blog/",
        breaks: true,
        skipSanitization: true,
        allowInsecureScriptTags: true,
        addNofollowToLinks: true,
        doNotShowImages: false,
        assetsWidth: 540,
        assetsHeight: 380,
        imageProxyFn: (url: string) => url,
        usertagUrlFn: (account: string) => "/@" + account,
        hashtagUrlFn: (hashtag: string) => "/trending/" + hashtag,
        isLinkSafeFn: (url: string) => true,
        addExternalCssClassToMatchingLinksFn: (url: string) => true,
        ipfsPrefix: "https://ipfs.skatehive.app"
    });

    let safeHtmlStr = renderer.render(preprocessedMarkdown);
    // Post-process the rendered HTML to clean up any leftover IPFS video issues
    safeHtmlStr = transformIPFSContent(safeHtmlStr);

    return safeHtmlStr;
}

// Pre-process markdown to replace IPFS links with video tags
function preProcessIpfsContent(markdown: string): string {
    return markdown;
}

// Transform HTML after markdown rendering to clean up any remaining IPFS video references
function transformIPFSContent(content: string): string {
    let transformedContent = content.replace(
        /<img(.*?)>/gi,
        '<div style="text-align: center; display: flex; justify-content: center; margin: 1rem 0;"><img$1></div>'
    );

    return transformedContent;
}

// Check if the ID references a video file based on its extension
function isLikelyVideoID(id: string): boolean {
    return /\.(mp4|webm|mov|avi|wmv|flv|mkv)$/i.test(id);
}