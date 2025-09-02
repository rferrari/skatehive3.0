'use client';

import React from 'react';
import { Box, Alert, AlertIcon, AlertTitle, AlertDescription, Button, VStack } from '@chakra-ui/react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <Box p={4} maxW="lg" mx="auto" mt={8}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Something went wrong!</AlertTitle>
              <AlertDescription display="block" mt={2}>
                An unexpected error occurred while loading this page.
              </AlertDescription>
              <VStack mt={4} spacing={2} align="start">
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={this.resetError}
                >
                  Try Again
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </VStack>
            </Box>
          </Alert>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box mt={4} p={4} bg="gray.100" borderRadius="md" fontSize="sm">
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Error Details (Development)
                </summary>
                <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                  {this.state.error.stack}
                </pre>
              </details>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
