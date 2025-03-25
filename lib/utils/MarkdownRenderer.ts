import { DefaultRenderer } from "@hiveio/content-renderer";

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
    // Replace IPFS video iframes with proper video elements
    return markdown.replace(
        /<iframe.*?src=["'](https:\/\/ipfs\.skatehive\.app\/ipfs\/[a-zA-Z0-9-_?=&]+)["'].*?<\/iframe>/gi,
        (_, videoUrl) => {
            return createSimpleVideoTag(videoUrl.replace("https://ipfs.skatehive.app/ipfs/", ""));
        }
    ).replace(
        /https:\/\/ipfs\.skatehive\.app\/ipfs\/([a-zA-Z0-9-_?=&]+)/gi,
        (_, videoID) => {
            if (isLikelyVideoID(videoID)) {
                return createSimpleVideoTag(videoID);
            }
            return `https://ipfs.skatehive.app/ipfs/${videoID}`;
        }
    );
}

// Transform HTML after markdown rendering to clean up any remaining IPFS video references
function transformIPFSContent(content: string): string {
    let transformedContent = content.replace(
        /<iframe.*?src=["'](https:\/\/ipfs\.skatehive\.app\/ipfs\/[a-zA-Z0-9-_?=&]+)["'].*?<\/iframe>/gi,
        (_, videoUrl) => {
            console.log("Transforming iframe to video tag for URL:", videoUrl); // Debug log
            return createSimpleVideoTag(videoUrl.replace("https://ipfs.skatehive.app/ipfs/", ""));
        }
    ).replace(
        /https:\/\/ipfs\.skatehive\.app\/ipfs\/([a-zA-Z0-9-_?=&]+)/gi,
        (_, videoID) => {
            if (isLikelyVideoID(videoID)) {
                console.log("Transforming raw IPFS link to video tag for ID:", videoID); // Debug log
                return createSimpleVideoTag(videoID);
            }
            return `https://ipfs.skatehive.app/ipfs/${videoID}`;
        }
    );

    // Center all images by wrapping them in a div with center alignment
    transformedContent = transformedContent.replace(
        /<img(.*?)>/gi,
        '<div style="text-align: center; display: flex; justify-content: center; margin: 1rem 0;"><img$1></div>'
    );

    return transformedContent;
}

// Check if the ID references a video file based on its extension
function isLikelyVideoID(id: string): boolean {
    return /\.(mp4|webm|mov|avi|wmv|flv|mkv)$/i.test(id);
}

// Generate a clean video tag for embedding
function createSimpleVideoTag(videoID: string): string {
    return `<video width="100%" height="auto" controls preload="none" playsinline webkit-playsinline>
  <source src="https://ipfs.skatehive.app/ipfs/${videoID}" type="video/mp4">
  <source src="https://ipfs.skatehive.app/ipfs/${videoID}" type="video/webm">
  Your browser doesn't support HTML5 video. <a href="https://ipfs.skatehive.app/ipfs/${videoID}" target="_blank">Click here to view the video</a>.
</video>`;
}