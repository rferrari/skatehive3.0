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
  Text,
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
      e.preventDefault();
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
    <Box
      bg="#16191f"
      border="1px solid rgba(255,255,255,0.08)"
      p={4}
    >
      <Text
        letterSpacing="0.1em"
        fontSize="11px"
        color="#888"
        mb={3}
        fontWeight="600"
        textTransform="uppercase"
      >
        Hashtags
      </Text>
      <Flex width="100%" direction="row" alignItems="center" gap={4}>
        <Input
          placeholder="Type hashtag and press space..."
          value={hashtagInput}
          onChange={(e) => setHashtagInput(e.target.value)}
          onKeyDown={handleHashtagKeyDown}
          height="44px"
          flex="1"
          bg="#0d0e12"
          border="1px solid rgba(255,255,255,0.08)"
          color="#d8d8d8"
          _placeholder={{ color: "#666" }}
          _hover={{ borderColor: "rgba(255,255,255,0.15)" }}
          _focus={{
            borderColor: "#6a9e6a",
            boxShadow: "0 0 0 1px #6a9e6a",
          }}
          fontSize="15px"
        />
      </Flex>
      <Box mt={3}>
        <Wrap justify="flex-start">
          {hashtags.map((tag, index) => (
            <WrapItem key={index}>
              <Tag
                size="lg"
                borderRadius="20px"
                variant="outline"
                borderColor="rgba(106,158,106,0.3)"
                bg="rgba(106,158,106,0.05)"
                _hover={{
                  borderColor: "#6a9e6a",
                  bg: "rgba(106,158,106,0.1)",
                }}
              >
                <TagLabel color="#6a9e6a" fontWeight="500">#{tag}</TagLabel>
                <TagCloseButton
                  onClick={() => removeHashtag(index)}
                  color="#666"
                  _hover={{ color: "#fff" }}
                />
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      </Box>
    </Box>
  );
}
