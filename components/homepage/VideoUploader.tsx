import React, { useRef } from 'react';
import { IconButton, Spinner } from '@chakra-ui/react';
import { FaVideo } from 'react-icons/fa6';

interface VideoUploaderProps {
    onUpload: (url: string | null) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onUpload }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            console.log('No file selected.');
            return;
        }

        console.log('File selected:', file.name, 'Type:', file.type);

        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log('Uploading file to Pinata...');
            const response = await fetch('/api/pinata', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to upload video. Response:', errorText);
                onUpload(null);
                return;
            }

            const result = await response.json();
            const videoUrl = `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;
            console.log('File uploaded successfully. IPFS URL:', videoUrl);
            onUpload(videoUrl);
        } catch (error) {
            console.error('Error during file upload:', error);
            onUpload(null);
        }
    };

    const triggerFileInput = () => {
        console.log('Triggering file input...');
        if (inputRef.current) {
            inputRef.current.click();
        }
    };

    return (
        <>
            <input
                type="file"
                accept="video/*"
                ref={inputRef}
                style={{ display: 'none' }}
                onChange={handleVideoUpload}
            />
            <div onClick={triggerFileInput} />
        </>
    );
};

export default VideoUploader;
