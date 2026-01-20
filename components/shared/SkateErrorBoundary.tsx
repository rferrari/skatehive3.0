import React from "react";
import { Box, Text } from "@chakra-ui/react";
import { SkateErrorModal, useSkateErrorHandler } from "./SkateErrorModal";
import { useTheme } from "@/app/themeProvider";

interface SkateErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface SkateErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class SkateErrorBoundary extends React.Component<
  SkateErrorBoundaryProps,
  SkateErrorBoundaryState
> {
  constructor(props: SkateErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): SkateErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log the error for debugging
    console.error("SkateErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const isContentRendererError = error?.message?.includes(
        "@hiveio/content-renderer"
      );
      const isMaliciousContentError =
        isContentRendererError &&
        (error?.message?.includes("Blocked") ||
          error?.message?.includes("does not appear to be a url"));

      return (
        <SkateErrorFallback
          error={error}
          isMaliciousContent={!!isMaliciousContentError}
          onRetry={() =>
            this.setState({ hasError: false, error: null, errorInfo: null })
          }
        />
      );
    }

    return this.props.children;
  }
}

interface SkateErrorFallbackProps {
  error: Error | null;
  isMaliciousContent: boolean;
  onRetry: () => void;
}

const SkateErrorFallback: React.FC<SkateErrorFallbackProps> = ({
  error,
  isMaliciousContent,
  onRetry,
}) => {
  const { theme } = useTheme();
  const {
    isErrorOpen,
    closeError,
    showMaliciousContentError,
    showError,
    errorType,
    errorMessage,
  } = useSkateErrorHandler();

  React.useEffect(() => {
    if (isMaliciousContent) {
      showMaliciousContentError(error?.message);
    } else {
      showError("general-error", error?.message || "Unknown error occurred");
    }
  }, [error, isMaliciousContent, showMaliciousContentError, showError]);

  const handleClose = () => {
    closeError();
    onRetry();
  };

  return (
    <>
      <Box
        p={4}
        borderRadius="none"
        bg={theme.colors.muted}
        border={`1px solid ${theme.colors.border}`}
        textAlign="center"
      >
        <Text
          color={theme.colors.text}
          fontSize="sm"
          fontFamily="'Joystix', 'VT323', 'Fira Mono', monospace"
        >
          🛹 Content filtered for safety
        </Text>
      </Box>

      <SkateErrorModal
        isOpen={isErrorOpen}
        onClose={handleClose}
        errorType={errorType}
        errorMessage={errorMessage}
      />
    </>
  );
};

// Hook for wrapping content with error handling
export const useSkateContentRenderer = () => {
  const {
    isErrorOpen,
    closeError,
    showMaliciousContentError,
    errorType,
    errorMessage,
  } = useSkateErrorHandler();

  const renderWithErrorHandling = (content: React.ReactNode, key?: string) => (
    <SkateErrorBoundary key={key}>
      {content}
      <SkateErrorModal
        isOpen={isErrorOpen}
        onClose={closeError}
        errorType={errorType}
        errorMessage={errorMessage}
      />
    </SkateErrorBoundary>
  );

  return {
    renderWithErrorHandling,
    showMaliciousContentError,
    isErrorOpen,
    closeError,
  };
};

export default SkateErrorBoundary;
