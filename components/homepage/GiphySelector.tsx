import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Input,
  Center,
  Spinner,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { Grid } from "@giphy/react-components";
import { GiphyFetch, GifsResult } from "@giphy/js-fetch-api";
import { IGif } from "@giphy/js-types";
import { FaSearch } from "react-icons/fa";

interface GiphySelectorProps {
  apiKey: string;
  onSelect: (gif: IGif, e: React.SyntheticEvent<HTMLElement>) => void;
}

const GiphySelector: React.FC<GiphySelectorProps> = ({ apiKey, onSelect }) => {
  const gf = useMemo(() => new GiphyFetch(apiKey), [apiKey]);
  const [searchTerm, setSearchTerm] = useState("skateboard funny");
  const [isLoading, setIsLoading] = useState(false);
  const [showGrid, setShowGrid] = useState(true); // Controls Giphy grid visibility

  const fetchGifs = useCallback(
    async (offset: number): Promise<GifsResult> => {
      setIsLoading(true);
      const result = searchTerm
        ? await gf.search(searchTerm, { offset, limit: 10 })
        : await gf.trending({ offset, limit: 10 });
      setIsLoading(false);
      return result;
    },
    [gf, searchTerm]
  );

  const handleSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value);
    setShowGrid(true); // Show grid when user types
  }, []);

  const handleSearchIconClick = useCallback(() => {
    setShowGrid((prev) => !prev); // Toggle grid visibility
  }, []);

  const handleGifClick = useCallback(
    (gif: IGif, e: React.SyntheticEvent<HTMLElement>) => {
      onSelect(gif, e);
    },
    [onSelect]
  );

  useEffect(() => {
    // Only fetch gifs when component mounts, let the Grid component handle search updates
    if (showGrid) {
      fetchGifs(0);
    }
  }, [fetchGifs, showGrid]);

  return (
    <>
      <InputGroup>
        <InputRightElement>
          {isLoading ? (
            <Spinner />
          ) : (
            <FaSearch cursor="pointer" onClick={handleSearchIconClick} />
          )}
        </InputRightElement>
        <Input
          pr="4.5rem"
          placeholder="Type to search..."
          value={searchTerm}
          onChange={(e) => handleSearchTermChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              fetchGifs(0); // Allows pressing Enter to search
              setShowGrid(true); // Show grid on Enter
            }
          }}
        />
      </InputGroup>
      {showGrid && (
        <Center mt={4}>
          <Grid
            width={450}
            columns={3}
            fetchGifs={fetchGifs} // Use the fetchGifs function to get GIFs based on the current search term
            onGifClick={handleGifClick}
          />
        </Center>
      )}
    </>
  );
};

export default GiphySelector;
