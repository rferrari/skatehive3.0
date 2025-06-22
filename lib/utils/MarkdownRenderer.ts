import { DefaultRenderer } from "@hiveio/content-renderer";

export function processMediaContent(content: string): string {
    // Handle 3Speak videos with better validation
    content = content.replace(
        /\[!\[.*?\]\(.*?\)\]\((https?:\/\/3speak\.tv\/watch\?v=([\w\-/]+))\)/g,
        (match, url, videoId) => {
            // Validate videoId is a proper string
            if (!videoId || typeof videoId !== 'string' || videoId.includes('[object') || videoId === '[object Object]') {
                console.error('Invalid 3Speak videoId detected:', { videoId, match, url });
                return match; // Return original match if invalid
            }
            return create3SpeakEmbed(videoId);
        }
    );
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

function create3SpeakEmbed(videoID: string): string {
    
    // Ensure videoID is a string and not an object
    const safeVideoID = typeof videoID === 'string' ? videoID : String(videoID);
    
    // Additional validation to prevent [object Object] in URLs
    if (safeVideoID.includes('[object') || safeVideoID === '[object Object]') {
        console.error('create3SpeakEmbed: Invalid videoID detected:', { originalVideoID: videoID, safeVideoID });
        return `<div>Invalid video ID: ${safeVideoID}</div>`;
    }
    
    // Log the final embed URL
    const embedUrl = `https://3speak.tv/embed?v=${safeVideoID}`;
    
    return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1rem 0;">
        <iframe
            src="${embedUrl}"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
            frameborder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
        ></iframe>
    </div>`;
}