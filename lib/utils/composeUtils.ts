import { extractImageUrls } from "@/lib/utils/extractImageUrls";

export const ensureGifFilename = (url: string): string => {
    if (url.match(/\.gif($|\?)/i) && !url.includes("?filename=")) {
        return url + (url.includes("?") ? "&" : "?") + "filename=skatehive.gif";
    }
    return url;
};

export const generatePermlink = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-") // replace invalid chars with dash
        .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
        .slice(0, 255); // max length for Hive permlink
};

export const insertAtCursor = (
    content: string,
    markdown: string,
    setMarkdown: (value: string) => void
) => {
    const textarea = document.querySelector(
        ".w-md-editor-text-input"
    ) as HTMLTextAreaElement;
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = markdown;
        const before = text.substring(0, start);
        const after = text.substring(end);
        setMarkdown(`${before}${content}${after}`);
        // Reset cursor position after React re-render
        setTimeout(() => {
            textarea.focus();
            const newPosition = start + content.length;
            textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
    }
};

export const prepareImageArray = (
    markdown: string,
    selectedThumbnail: string | null
): string[] => {
    const allImages = extractImageUrls(markdown);
    let imageArray: string[] = [];

    if (selectedThumbnail) {
        imageArray = [
            ensureGifFilename(selectedThumbnail),
            ...allImages
                .filter((url) => url !== selectedThumbnail)
                .map(ensureGifFilename),
        ];
    } else {
        imageArray = allImages.map(ensureGifFilename);
    }

    return imageArray;
};

export const uploadToIPFS = async (
    blob: Blob,
    fileName: string
): Promise<string> => {
    const formData = new FormData();
    formData.append("file", blob, fileName);

    const response = await fetch("/api/pinata", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Failed to upload file to IPFS");
    }

    const result = await response.json();
    return `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;
};
