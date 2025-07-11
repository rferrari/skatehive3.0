import React from "react";
import {
    Box,
    Flex,
    Input,
    Tag,
    TagCloseButton,
    TagLabel,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";

interface HashtagInputProps {
    hashtags: string[];
    hashtagInput: string;
    setHashtagInput: (value: string) => void;
    setHashtags: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function HashtagInput({
    hashtags,
    hashtagInput,
    setHashtagInput,
    setHashtags,
}: HashtagInputProps) {
    const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (
            (e.key === " " || e.key === "Enter" || e.key === ",") &&
            hashtagInput.trim()
        ) {
            setHashtags((prev) => [...prev, hashtagInput.trim()]);
            setHashtagInput("");
        } else if (e.key === "Backspace" && !hashtagInput && hashtags.length) {
            setHashtags((prev) => prev.slice(0, -1));
        }
    };

    const removeHashtag = (index: number) => {
        setHashtags((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <Flex width="100%" direction="row" alignItems="center" mt={4} mb={2}>
            <Box flex="1">
                <Wrap justify="flex-start">
                    {hashtags.map((tag, index) => (
                        <WrapItem key={index}>
                            <Tag
                                size="md"
                                borderRadius="base"
                                variant="solid"
                                colorScheme="blue"
                            >
                                <TagLabel>{tag}</TagLabel>
                                <TagCloseButton onClick={() => removeHashtag(index)} />
                            </Tag>
                        </WrapItem>
                    ))}
                </Wrap>
            </Box>
            <Box>
                <Input
                    placeholder="Enter hashtags"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={handleHashtagKeyDown}
                    borderRadius="base"
                    width="200px"
                />
            </Box>
        </Flex>
    );
}
