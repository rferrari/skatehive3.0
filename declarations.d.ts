declare module '@aioha/react-ui';
declare module '@aioha/aioha';

interface Window {
  hive_keychain?: any;
}

declare module 'exifr' {
  export function gps(file: File): Promise<{ latitude?: number; longitude?: number } | undefined>;
} 