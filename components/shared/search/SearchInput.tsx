"use client";

import React from "react";
import {
  Box,
  Input,
  Icon,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { FaSearch } from "react-icons/fa";

interface SearchInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export default function SearchInput({
  query,
  onQueryChange,
  inputRef,
}: SearchInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent arrow keys from moving cursor when we want to navigate results
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
    }
  };

  return (
    <Box borderBottom="1px solid" borderColor="accent">
      <InputGroup size="lg">
        <InputLeftElement
          pointerEvents="none"
          width="48px"
          height="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={FaSearch} color="accent" boxSize="16px" />
        </InputLeftElement>
        <Input
          ref={inputRef}
          placeholder="Search users or type / for pages..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="unstyled"
          fontSize="md"
          px={4}
          py={4}
          pl="52px"
          height="56px"
          color="primary"
          _placeholder={{ color: "accent", opacity: 0.7 }}
          _focus={{ outline: "none" }}
        />
      </InputGroup>
    </Box>
  );
}
