import { DefaultRenderer } from "@hiveio/content-renderer";
import DOMPurify from "dompurify";

// Create a cache for processed markdown
const markdownCache = new Map<string, string>();
const processedContentCache = new Map<string, string>();

// Simple function to get DOMPurify instance, only sanitize on client side
function getSanitizedHTML(html: string): string {
    // Only sanitize in browser environment
    if (typeof window === 'undefined') {
        // Server-side: skip sanitization, it will be sanitized on client
        return html;
    }
    
    // Client-side: use DOMPurify
    const purify = DOMPurify;
    
    // Define the hook function to validate iframe sources
    const iframeHook = function (node: Node, data: any) {
        // Allow iframes from trusted video platforms
        if (data && data.tagName === 'iframe' && node instanceof HTMLElement) {
            const src = node.getAttribute('src');
            if (src) {
                // Define trusted domains with more specific patterns
                const trustedPatterns = [
                    /^https:\/\/(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]{11}(\?.*)?$/,
                    /^https:\/\/youtu\.be\/[a-zA-Z0-9_-]{11}(\?.*)?$/,
                    /^https:\/\/player\.vimeo\.com\/video\/[0-9]+(\?.*)?$/,
                    /^https:\/\/3speak\.tv\/embed\?v=.+$/,
                    /^https:\/\/odysee\.com\/.+$/,
                    /^https:\/\/ipfs\.skatehive\.app\/ipfs\/.+$/,
                    /^https:\/\/gateway\.pinata\.cloud\/ipfs\/.+$/
                ];
                
                const isAllowed = trustedPatterns.some(pattern => pattern.test(src));
                
                if (!isAllowed && node.parentNode) {
                    console.warn(`Blocked untrusted iframe src: ${src}`);
                    node.parentNode.removeChild(node);
                }
            }
        }
    };
    
    // Add hook before sanitization
    purify.addHook('beforeSanitizeElements', iframeHook);
    
    // Configure DOMPurify to allow SkateHive specific features
    const clean = purify.sanitize(html, {
        ALLOWED_TAGS: [
            'div', 'span', 'p', 'br', 'strong', 'em', 'u', 'strike', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'video', 'source', 'iframe', 'mention', 'code', 'pre',
            'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'sup', 'sub', 'small', 'mark', 'del', 'ins'
        ],
        ALLOWED_ATTR: [
            'href', 'src', 'alt', 'title', 'width', 'height', 'style', 'class', 'id', 'data-username', 
            'data-ipfs-hash', 'controls', 'preload', 'autoplay', 'playsinline', 'webkit-playsinline', 
            'muted', 'poster', 'type', 'frameborder', 'allow', 'allowfullscreen', 'loading', 'target',
            'rel'
        ],
        // More permissive URI regex that allows our trusted video platforms
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        ADD_TAGS: ['mention'],
        ADD_ATTR: ['data-username', 'data-ipfs-hash', 'webkit-playsinline', 'playsinline'],
        FORBID_TAGS: ['script', 'object', 'embed', 'applet', 'base', 'link'],
        FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onreset', 'onselect', 'onchange'],
        WHOLE_DOCUMENT: false,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_TRUSTED_TYPE: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        CUSTOM_ELEMENT_HANDLING: {
            tagNameCheck: /^mention$/,
            attributeNameCheck: /^data-username$/,
            allowCustomizedBuiltInElements: false,
        }
    });
    
    // Remove the hook after sanitization to prevent memory leaks
    purify.removeHook('beforeSanitizeElements');
    
    return clean;
}

export function processMediaContent(content: string): string {
    // Check cache first
    if (processedContentCache.has(content)) {
        return processedContentCache.get(content)!;
    }

    let processedContent = content;
    // Handle 3Speak videos with better validation
    processedContent = processedContent.replace(
        /\[!\[.*?\]\(.*?\)\]\((https?:\/\/3speak\.tv\/watch\?v=([\w\-/]+))\)/g,
        (match, url, videoId) => {
            // Validate videoId is a proper string
            if (!videoId || typeof videoId !== 'string' || videoId.includes('[object') || videoId === '[object Object]') {
                return match; // Return original match if invalid
            }
            return create3SpeakEmbed(videoId);
        }
    );
    // Replace markdown images with IPFS links, but only treat as video if the URL ends with a video extension
    processedContent = processedContent.replace(
        /!\[.*?\]\((https:\/\/(?:gateway\.pinata\.cloud|ipfs\.skatehive\.app)\/ipfs\/([\w-]+)(\.[a-zA-Z0-9]+)?)[^)]*\)/g,
        (_, url, hash, ext) => {
            if (isLikelyVideoID(url)) {
                return createSimpleVideoTag(hash);
            } else {
                // Center the image with a styled div
                return `<div style="display: flex; justify-content: center; align-items: center; margin: 1.5rem 0;"><img src='${url}' alt='IPFS Image' style='max-width: 100%; height: auto; box-shadow: 0 2px 16px rgba(0,0,0,0.12);'/></div>`;
            }
        }
    );
    // Replace iframes with embedded video if an IPFS hash is found
    processedContent = processedContent.replace(
        /<iframe.*?src=["']([^"']+)["'].*?<\/iframe>/g,
        (match, url) => {
            const ipfsHash = url.match(/\/ipfs\/([\w-]+)/)?.[1];
            return ipfsHash ? createSimpleVideoTag(ipfsHash) : match;
        }
    );
    // Instagram post URL to embed - simplified approach
    processedContent = processedContent.replace(
        /^https?:\/\/(www\.)?instagram\.com\/p\/([\w-]+)\/?[^\s]*$/gim,
        (match) => {
            return `[[INSTAGRAM:${match}]]`;
        }
    );
    // Odysee iframe or direct link to embed
    processedContent = processedContent.replace(
        /<iframe[^>]*src=["'](https?:\/\/odysee.com\/[^"]+)["'][^>]*><\/iframe>/gim,
        (_match, url) => `[[ODYSEE:${url}]]`
    );
    // Odysee direct links (optionally, if you want to support them)
    processedContent = processedContent.replace(
        /^https?:\/\/odysee.com\/\$\/embed\/[\w@:%._\+~#=\/-]+/gim,
        (match) => `[[ODYSEE:${match}]]`
    );
    // YouTube iframe embeds
    processedContent = processedContent.replace(
        /<iframe[^>]*src=["'](?:https?:)?\/\/(?:www\.)?(?:youtube\.com|youtu.be)\/embed\/([a-zA-Z0-9_-]{11})[^"']*["'][^>]*><\/iframe>/gim,
        (_match, videoId) => `[[YOUTUBE:${videoId}]]`
    );
    // YouTube direct links
    processedContent = processedContent.replace(
        /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu.be\/)([a-zA-Z0-9_-]{11})[\S]*/gim,
        (_match, videoId) => `[[YOUTUBE:${videoId}]]`
    );
    // Vimeo iframe embeds
    processedContent = processedContent.replace(
        /<iframe[^>]*src=["'](?:https?:)?\/\/(?:player\.)?vimeo.com\/video\/([0-9]+)[^"']*["'][^>]*><\/iframe>/gim,
        (_match, videoId) => `[[VIMEO:${videoId}]]`
    );
    // Vimeo direct links
    processedContent = processedContent.replace(
        /^https?:\/\/(?:www\.)?(?:vimeo.com\/(?:channels\/[\w]+\/)?|player.vimeo.com\/video\/)([0-9]+)[\S]*/gim,
        (_match, videoId) => `[[VIMEO:${videoId}]]`
    );

    // Cache the result
    processedContentCache.set(content, processedContent);
    return processedContent;
}

export default function markdownRenderer(markdown: string): string {
    if (!markdown || markdown.trim() === "") return "";
    
    // Check cache first
    if (markdownCache.has(markdown)) {
        return markdownCache.get(markdown)!;
    }
    
    try {
        // Process media content before rendering markdown
        const processedMarkdown = processMediaContent(markdown);
        const renderer = new DefaultRenderer({
            baseUrl: "https://hive.blog/",
            breaks: true,
            skipSanitization: false,
            allowInsecureScriptTags: false,
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
        const html = renderer.render(processedMarkdown);
        
        // Sanitize the HTML (only on client side)
        const clean = getSanitizedHTML(html);
        
        // Replace user mention links with <mention> tags
        const mentionLinkRegex = /<a [^>]*href="\/@([a-z0-9\-.]+)"[^>]*>@([a-z0-9\-.]+)<\/a>/gi;
        const htmlWithMentions = clean.replace(mentionLinkRegex, (_match: string, username: string) => {
            return `<mention data-username="${username}">@${username}</mention>`;
        });
        
        // Cache the result
        markdownCache.set(markdown, htmlWithMentions);
        return htmlWithMentions;
    } catch (error) {
        console.warn('Content renderer error handled by SkateHive:', error);
        
        // Return a safe fallback message
        const errorMessage = `
            <div style="
                padding: 1rem; 
                border: 2px solid #f56565; 
                border-radius: 8px; 
                background: #feb2b2; 
                color: #742a2a; 
                text-align: center;
                font-family: 'Joystix', 'VT323', 'Fira Mono', monospace;
            ">
                🛹 Content filtered for safety - SkateHive devs were gnarlier! 🛹
            </div>
        `;
        
        // Cache the error result to avoid repeated processing
        markdownCache.set(markdown, errorMessage);
        return errorMessage;
    }
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
            autoplay
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
        return `<div>Invalid video ID: ${safeVideoID}</div>`;
    }

    // Generate the final embed URL
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