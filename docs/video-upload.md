# Video upload pipeline

This document describes how the client-side video upload flow works in Skatehive 3.0.

## Steps

1. **Duration check** – When a file is selected the component measures its duration to ensure it meets the configured limit.
2. **FFmpeg compression** – If the browser supports `FFmpeg.wasm`, the video is transcoded to MP4. Larger files are resized and compressed with CRF 28, and an additional aggressive mode is applied when uploads exceed the mobile limit.
3. **Fallback compression** – If FFmpeg is unavailable or fails, the component records the playback of the file to a canvas using `MediaRecorder`.
   - Frames are downscaled to a maximum width of 640 px.
   - Audio tracks are mixed into the canvas stream when `captureStream` is available.
   - The recorded blob is saved as `mobile-compressed.webm`.
   - When these APIs are missing the original file is used instead so the upload can still proceed.
4. **Thumbnail generation** – A `canvas` snapshot is taken around 10 % into the video. If that fails a small FFmpeg job produces a WebP thumbnail.
5. **Upload** – The processed file and optional thumbnail are sent to the `/api/pinata` endpoint with progress indicators. Mobile uploads are capped at ~45 MB to avoid Vercel's 413 limit.

## Result

By progressively falling back through these steps, mobile clients avoid oversized uploads while still handling browsers without full FFmpeg support.
