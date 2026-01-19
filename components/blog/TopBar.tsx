"use client";
import {
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Tooltip,
  ButtonGroup,
} from "@chakra-ui/react";
import { FaTh, FaBars, FaPen, FaSort } from "react-icons/fa";
import { FiBook } from "react-icons/fi";
import { useRouter, usePathname } from "next/navigation";
import { useAioha } from "@aioha/react-ui";
import { QueryType, ViewMode } from "@/config/blog.config";

interface TopBarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  setQuery: (query: QueryType) => void;
  onQueryChange?: (query: QueryType) => void;
}

export default function TopBar({
  viewMode,
  setViewMode,
  setQuery,
  onQueryChange,
}: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAioha();
  const isMagazinePage = pathname === "/magazine";

  const buttonStyle = {
    "&:hover": {
      boxShadow: "4px 4px 6px var(--chakra-colors-primary-alpha)",
    },
    "&:active": {
      transform: "translate(2px, 2px)",
      boxShadow: "2px 2px 3px var(--chakra-colors-primary-alpha)",
    },
  };

  const handleQueryChange = (query: QueryType) => {
    setQuery(query);
    onQueryChange?.(query);
  };

  return (
    <Flex
      justifyContent="space-between"
      mb={4}
      alignItems="center"
      pt={4}
      pl={8}
      pr={4}
    >
      <Flex flex="1" alignItems="center" gap={4}>
        {user && (
          <Button
            leftIcon={<FaPen />}
            onClick={() => router.push("/compose")}
            variant="outline"
            borderColor="primary"
            bg="background"
            color="primary"
            size="md"
            fontWeight="bold"
            px={6}
            py={2}
            borderRadius="md"
            boxShadow="0 2px 8px var(--chakra-colors-primary-alpha)"
            _hover={{
              borderColor: "primary",
              bg: "primary",
              color: "background",
              boxShadow: "0 4px 12px var(--chakra-colors-primary-alpha)",
            }}
            _active={{
              borderColor: "primary",
              bg: "primary",
              color: "background",
              boxShadow: "0 2px 4px var(--chakra-colors-primary-alpha)",
            }}
          >
            Create a Page
          </Button>
        )}
        <Button
          leftIcon={<FiBook />}
          onClick={() => {
            if (isMagazinePage) {
              router.push("/blog?view=magazine");
            } else {
              setViewMode("magazine");
            }
          }}
          variant="outline"
          borderColor="primary"
          bg="background"
          color="primary"
          size="md"
          fontWeight="bold"
          px={6}
          py={2}
          borderRadius="md"
          boxShadow="0 2px 8px var(--chakra-colors-primary-alpha)"
          display={{ base: "none", md: "flex" }}
          _hover={{
            borderColor: "primary",
            bg: "primary",
            color: "background",
            boxShadow: "0 4px 12px var(--chakra-colors-primary-alpha)",
          }}
          _active={{
            borderColor: "primary",
            bg: "primary",
            color: "background",
            boxShadow: "0 2px 4px var(--chakra-colors-primary-alpha)",
          }}
          isActive={viewMode === "magazine"}
        >
          Read Magazine
        </Button>
      </Flex>
      <Flex flex="1" justifyContent="flex-end" alignItems="center">
        {/* Hide grid/list toggle on mobile */}
        <ButtonGroup
          size="sm"
          isAttached
          variant="outline"
          colorScheme="green"
          display={{ base: "none", md: "flex" }}
        >
          <Tooltip label="Grid View" hasArrow>
            <IconButton
              aria-label="Grid View"
              icon={<FaTh />}
              onClick={() => {
                if (isMagazinePage) {
                  router.push("/blog?view=grid");
                } else {
                  setViewMode("grid");
                }
              }}
              isActive={viewMode === "grid"}
              sx={buttonStyle}
            />
          </Tooltip>
          <Tooltip label="List View" hasArrow>
            <IconButton
              aria-label="List View"
              icon={<FaBars />}
              onClick={() => {
                if (isMagazinePage) {
                  router.push("/blog?view=list");
                } else {
                  setViewMode("list");
                }
              }}
              isActive={viewMode === "list"}
              sx={buttonStyle}
            />
          </Tooltip>
        </ButtonGroup>
        <Menu>
          <MenuButton
            as={Button}
            aria-label="Sort Options"
            leftIcon={<FaSort />}
            variant="outline"
            ml={4}
            bg="background"
            color="primary"
            _hover={{ bg: "muted", color: "primary" }}
            _active={{ bg: "muted", color: "primary" }}
          >
            Sort
          </MenuButton>
          <MenuList
            zIndex="popover"
            bg="background"
            color="primary"
            borderColor="primary"
          >
            <MenuItem
              bg="background"
              color="primary"
              _hover={{ bg: "muted", color: "primary" }}
              onClick={() => handleQueryChange("created")}
            >
              Recent
            </MenuItem>
            <MenuItem
              bg="background"
              color="primary"
              _hover={{ bg: "muted", color: "primary" }}
              onClick={() => handleQueryChange("trending")}
            >
              Trending
            </MenuItem>
            <MenuItem
              bg="background"
              color="primary"
              _hover={{ bg: "muted", color: "primary" }}
              onClick={() => handleQueryChange("highest_paid")}
            >
              Highest Paid
            </MenuItem>
            <MenuItem
              bg="background"
              color="primary"
              _hover={{ bg: "muted", color: "primary" }}
              onClick={() => handleQueryChange("goat")}
            >
              GOAT
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
  );
}
