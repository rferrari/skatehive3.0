import { DefaultRenderer } from "@hiveio/content-renderer";

export function processMediaContent(content: string): string {
    // Replace markdown images with IPFS links
    content = content.replace(
        /!\[.*?\]\((https:\/\/(?:gateway\.pinata\.cloud|ipfs\.skatehive\.app)\/ipfs\/([\w-]+)).*?\)/g,
        (_, url, hash) => isLikelyVideoID(url)
            ? createSimpleVideoTag(hash)
            : createImageTag(hash)
    );
    // Replace iframes with embedded video if an IPFS hash is found
    content = content.replace(
        /<iframe.*?src=["']([^"']+)["'].*?<\/iframe>/g,
        (match, url) => {
            const ipfsHash = url.match(/\/ipfs\/([\w-]+)/)?.[1];
            return ipfsHash ? createSimpleVideoTag(ipfsHash) : match;
        }
    );
    return content;
}

export default function markdownRenderer(markdown: string): string {
    if (!markdown || markdown.trim() === "") return "";
    // Process media content before rendering markdown
    const processedMarkdown = processMediaContent(markdown);
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
        usertagUrlFn: (account: string) => "/" + "@" + account,
        hashtagUrlFn: (hashtag: string) => "/trending/" + hashtag,
        isLinkSafeFn: () => true,
        addExternalCssClassToMatchingLinksFn: () => true,
        ipfsPrefix: "https://ipfs.skatehive.app",
    });
    return renderer.render(processedMarkdown);
}

function isLikelyVideoID(url: string): boolean {
    return /\.(mp4|webm|mov|avi|wmv|flv|mkv)$/i.test(url);
}

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

function createImageTag(imageID: string): string {
    return `<div style="text-align: center; display: flex; justify-content: center; margin: 1rem 0;">
        <img src="https://ipfs.skatehive.app/ipfs/${imageID}" alt="IPFS Image" style="max-width: 100%; height: auto;">
    </div>`;
}