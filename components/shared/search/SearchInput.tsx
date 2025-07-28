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
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export default function SearchInput({
  query,
  onQueryChange,
  inputRef,
}: SearchInputProps) {
  return (
    <Box p={4} borderBottom="1px solid" borderColor="secondary">
      <InputGroup size="lg">
        <InputLeftElement pointerEvents="none">
          <Icon as={FaSearch} color="secondary" />
        </InputLeftElement>
        <Input
          ref={inputRef}
          placeholder="Search users or type / for pages..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          variant="unstyled"
          fontSize="md"
          pl="40px"
          color="primary"
          _placeholder={{ color: "secondary", opacity: 0.7 }}
        />
      </InputGroup>
    </Box>
  );
}
