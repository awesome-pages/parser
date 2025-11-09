# Cache Layer

## Overview

The cache layer provides HTTP/local file caching using ETag and Last-Modified headers to avoid redundant network traffic and file system operations.

## Features

- **Remote sources (GitHub, HTTP)**: Uses `ETag` and `Last-Modified` headers with `304 Not Modified` responses
- **Local files**: Tracks `mtimeMs` and file size to detect changes
- **Automatic**: Enabled by default, can be disabled with `cache: false`
- **Customizable**: Use `cachePath` to override default location

## Usage

### Basic usage (cache enabled by default)

```typescript
import { parse } from '@awesome-pages/parser';

await parse({
  sources: [
    {
      from: 'https://raw.githubusercontent.com/user/repo/main/README.md',
      outputs: [{ artifact: 'domain', to: 'output.json' }],
    },
  ],
});
```

On the second run, the parser will send conditional headers (`If-None-Match`, `If-Modified-Since`) to check if the content has changed.

### Disable cache

```typescript
await parse({
  cache: false,
  sources: [
    // ...
  ],
});
```

### Custom cache location

```typescript
await parse({
  cachePath: '/path/to/custom-cache.json',
  sources: [
    // ...
  ],
});
```

Default cache location: `.awesome-pages/cache.v1.json` (relative to `rootDir`)

## Cache File Format

```json
{
  "version": 1,
  "entries": {
    "github:owner/repo@main:README.md": {
      "kind": "remote",
      "etag": "\"abc123\"",
      "lastModified": "Wed, 21 Oct 2015 07:28:00 GMT",
      "lastSeen": "2025-11-09T12:34:56.789Z",
      "lastStatus": 200
    },
    "http:https://example.com/file.md": {
      "kind": "remote",
      "etag": "\"xyz789\"",
      "lastSeen": "2025-11-09T12:34:56.789Z",
      "lastStatus": 304
    },
    "local:/path/to/local/file.md": {
      "kind": "local",
      "mtimeMs": 1699536896789.456,
      "size": 12345,
      "lastSeen": "2025-11-09T12:34:56.789Z"
    }
  }
}
```

## How It Works

### Remote Sources (GitHub & HTTP)

1. On first run:
   - Fetch content normally
   - Store `ETag` and/or `Last-Modified` headers from response
   - Save cache to disk

2. On subsequent runs:
   - Load cache from disk
   - Send `If-None-Match: <etag>` and/or `If-Modified-Since: <lastModified>` headers
   - If server responds with `304 Not Modified`:
     - Update `lastSeen` timestamp
     - Re-fetch without conditional headers to get content (future: store content to avoid re-fetch)
   - If server responds with `200 OK`:
     - Update cache with new `ETag`/`Last-Modified`
     - Use the new content

### Local Files

1. On every run:
   - Read file stats (`mtimeMs`, `size`)
   - Store metadata in cache
   - Read file content

2. Future enhancement:
   - Compare cached metadata with current stats
   - Skip parsing if metadata matches (incremental builds)

## Cache Behavior

- **Corrupted cache**: Automatically ignored and recreated
- **Version mismatch**: Old cache versions are ignored
- **Errors during parsing**: Cache is still saved (in `finally` block)
- **Disabled cache**: Uses `NoopCacheManager` (no reads/writes)

## Performance Benefits

- Reduces network bandwidth usage
- Faster subsequent runs when content hasn't changed
- Lays groundwork for incremental builds (future enhancement)
- Single source of truth for change metadata

## Future Enhancements

- Store content in cache to avoid re-fetching on 304 responses
- Use cache metadata for true incremental builds (skip parsing/emitting when nothing changed)
- Add cache statistics (hit rate, bandwidth saved, etc.)
- Cache cleanup/expiration strategies
