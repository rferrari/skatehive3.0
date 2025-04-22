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

// Pre-process markdown to replace IPFS links with appropriate tags
function preProcessIpfsContent(markdown: string): string {
    // Convert direct IPFS links to appropriate tags based on content type
    return markdown.replace(
        /!\[.*?\]\((https:\/\/(?:gateway\.pinata\.cloud|ipfs\.skatehive\.app)\/ipfs\/([a-zA-Z0-9]+)).*?\)/g,
        (_, url, hash) => {
            if (isLikelyVideoID(url)) {
                return createSimpleVideoTag(hash);
            } else {
                return createImageTag(hash);
            }
        }
    );
}

// Transform HTML after markdown rendering to clean up any remaining IPFS references
function transformIPFSContent(content: string): string {
    // First handle images
    let transformedContent = content.replace(
        /<img(.*?)>/gi,
        '<div style="text-align: center; display: flex; justify-content: center; margin: 1rem 0;"><img$1></div>'
    );

    // Handle any Pinata gateway URLs and convert them to our IPFS gateway
    transformedContent = transformedContent.replace(
        /https:\/\/gateway\.pinata\.cloud\/ipfs\/([\w-]+)/g,
        'https://ipfs.skatehive.app/ipfs/$1'
    );

    // Handle video embeds - both iframes and existing video tags
    transformedContent = transformedContent.replace(
        /<div class="video-embed".*?(?:<iframe.*?src="(.*?)"|<video.*?<source src="(.*?)".*?).*?(?:<\/iframe>|<\/video>).*?<\/div>/g,
        (match, iframeSrc, videoSrc) => {
            const url = iframeSrc || videoSrc;
            if (!url) return match;

            const ipfsHash = url.match(/\/ipfs\/([\w-]+)/)?.[1];
            if (ipfsHash && isLikelyVideoID(url)) {
                return `<div class="video-embed" data-ipfs-hash="${ipfsHash}">
                    <video 
                        width="100%" 
                        height="400" 
                        controls 
                        preload="none" 
                        playsinline 
                        webkit-playsinline 
                        muted
                        poster="https://ipfs.skatehive.app/ipfs/${ipfsHash}?format=preview">
                        <source src="https://ipfs.skatehive.app/ipfs/${ipfsHash}" type="video/mp4">
                        <source src="https://ipfs.skatehive.app/ipfs/${ipfsHash}" type="video/webm">
                        Your browser doesn't support HTML5 video.
                    </video>
                </div>`;
            }
            return match;
        }
    );

    return transformedContent;
}

// Check if the URL references a video file based on its extension
function isLikelyVideoID(url: string): boolean {
    return /\.(mp4|webm|mov|avi|wmv|flv|mkv)$/i.test(url);
}

// Generate a clean video tag for embedding
function createSimpleVideoTag(videoID: string): string {
    return `<div class="video-embed" data-ipfs-hash="${videoID}">
        <video 
            width="100%" 
            height="auto" 
            controls 
            preload="none" 
            playsinline 
            webkit-playsinline 
            muted
            poster="https://ipfs.skatehive.app/ipfs/${videoID}?format=preview">
            <source src="https://ipfs.skatehive.app/ipfs/${videoID}" type="video/mp4">
            <source src="https://ipfs.skatehive.app/ipfs/${videoID}" type="video/webm">
            Your browser doesn't support HTML5 video.
        </video>
    </div>`;
}

// Generate a clean image tag for embedding
function createImageTag(imageID: string): string {
    return `<div style="text-align: center; display: flex; justify-content: center; margin: 1rem 0;">
        <img src="https://ipfs.skatehive.app/ipfs/${imageID}" alt="IPFS Image" style="max-width: 100%; height: auto;">
    </div>`;
}