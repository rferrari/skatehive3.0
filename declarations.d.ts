declare module '@aioha/react-ui';
declare module '@aioha/aioha';

interface Window {
  hive_keychain?: any;
}

declare module 'exifr' {
  export function gps(file: File): Promise<{ latitude?: number; longitude?: number } | undefined>;
}

declare module 'react' {
  interface HTMLAttributes<T> {
    translate?: 'yes' | 'no';
  }
}

interface HTMLMediaElement {
  captureStream(frameRate?: number): MediaStream;
}
