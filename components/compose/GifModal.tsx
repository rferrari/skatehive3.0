import React from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    Image,
} from "@chakra-ui/react";
import { uploadToIpfs } from "@/lib/markdown/composeUtils";
import GIFMakerWithSelector, {
    GIFMakerRef as GIFMakerWithSelectorRef,
} from "../homepage/GIFMakerWithSelector";

interface GifModalProps {
    isOpen: boolean;
    onClose: () => void;
    gifMakerWithSelectorRef: React.RefObject<GIFMakerWithSelectorRef | null>;
    handleGifUpload: (url: string | null, caption?: string) => void;
    isProcessingGif: boolean;
    gifUrl: string | null;
    gifSize: number | null;
    isUploadingGif: boolean;
    setIsUploadingGif: (uploading: boolean) => void;
    insertAtCursor: (content: string) => void;
    gifCaption: string;
    setGifUrl: (url: string | null) => void;
    setGifSize: (size: number | null) => void;
    setIsProcessingGif: (processing: boolean) => void;
}

export default function GifModal({
    isOpen,
    onClose,
    gifMakerWithSelectorRef,
    handleGifUpload,
    isProcessingGif,
    gifUrl,
    gifSize,
    isUploadingGif,
    setIsUploadingGif,
    insertAtCursor,
    gifCaption,
    setGifUrl,
    setGifSize,
    setIsProcessingGif,
}: GifModalProps) {
    const handleUploadToIPFS = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (isUploadingGif || !gifUrl) return;

        setIsUploadingGif(true);
        try {
            const blob = await fetch(gifUrl).then((res) => res.blob());
            const safeCaption = gifCaption
                ? gifCaption.replace(/[^a-zA-Z0-9-_]/g, "-")
                : "skatehive-gif";
            const filename = `${safeCaption}.gif`;

            const ipfsUrl = await uploadToIpfs(blob, filename);

            insertAtCursor(`\n![${filename}](${ipfsUrl})\n`);
            gifMakerWithSelectorRef.current?.reset();
            setGifUrl(null);
            setGifSize(null);
            setIsProcessingGif(false);
            onClose();
        } catch (err) {
            alert("Failed to upload GIF to IPFS.");
        } finally {
            setIsUploadingGif(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
            <ModalOverlay />
            <ModalContent bg="background" color="text">
                <ModalHeader>GIF Maker by web-gnar</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <div style={{ maxWidth: 480, margin: "0 auto", padding: 12 }}>
                        {!gifUrl && (
                            <p style={{ marginBottom: 16, color: "#bbb" }}>
                                Upload a video (3-30 seconds), select a 3-second segment,
                                and convert it to a GIF!
                            </p>
                        )}

                        <GIFMakerWithSelector
                            ref={gifMakerWithSelectorRef}
                            onUpload={handleGifUpload}
                            isProcessing={isProcessingGif}
                        />

                        {gifUrl && (
                            <div
                                style={{
                                    marginTop: 32,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                }}
                            >
                                <h2
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 600,
                                        marginBottom: 12,
                                        textAlign: "center",
                                    }}
                                >
                                    GIF Preview (Selected Segment)
                                </h2>
                                <Image
                                    src={gifUrl}
                                    alt="Generated GIF"
                                    style={{
                                        maxWidth: 320,
                                        borderRadius: 8,
                                        border: "1px solid #eee",
                                        display: "block",
                                        margin: "0 auto",
                                    }}
                                />
                                {gifSize !== null && (
                                    <div
                                        style={{
                                            marginTop: 8,
                                            color: "#666",
                                            fontSize: 14,
                                            textAlign: "center",
                                        }}
                                    >
                                        File size: {Math.round(gifSize / 1024)} KB
                                    </div>
                                )}
                                <a
                                    href="#"
                                    style={{
                                        marginTop: 18,
                                        color: "#3182ce",
                                        textDecoration: "underline",
                                        fontWeight: 600,
                                        fontSize: 16,
                                        cursor: isUploadingGif ? "not-allowed" : "pointer",
                                        opacity: isUploadingGif ? 0.6 : 1,
                                    }}
                                    onClick={handleUploadToIPFS}
                                >
                                    {isUploadingGif ? "Uploading..." : "Add to blog"}
                                </a>
                            </div>
                        )}
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
