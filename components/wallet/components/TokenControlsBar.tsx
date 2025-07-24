import {
  HStack,
  Button,
  FormControl,
  FormLabel,
  Switch,
} from "@chakra-ui/react";

interface TokenControlsBarProps {
  isRefreshing: boolean;
  hideSmallBalances: boolean;
  onRefresh: () => void;
  onToggleSmallBalances: (checked: boolean) => void;
}

export default function TokenControlsBar({
  isRefreshing,
  hideSmallBalances,
  onRefresh,
  onToggleSmallBalances,
}: TokenControlsBarProps) {
  return (
    <HStack spacing={2} m={2} flexWrap="wrap" justifyContent="space-between">
      <Button
        onClick={onRefresh}
        isLoading={isRefreshing}
        loadingText="Refreshing..."
        size="xs"
        colorScheme="green"
        variant="ghost"
      >
        🔄 Refresh Data
      </Button>
      <FormControl display="flex" alignItems="center" w="auto">
        <FormLabel
          htmlFor="hide-small"
          mb="0"
          fontSize="sm"
          whiteSpace="nowrap"
        >
          Hide Dust
        </FormLabel>
        <Switch
          id="hide-small"
          isChecked={hideSmallBalances}
          onChange={(e) => onToggleSmallBalances(e.target.checked)}
          colorScheme="blue"
          size="md"
        />
      </FormControl>
    </HStack>
  );
}
