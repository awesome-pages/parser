# Cache Layer - Quick Reference

## For Users

### Enable cache (default)
```typescript
import { parse } from '@awesome-pages/parser';

await parse({
  sources: [
    { from: 'https://example.com/README.md', outputs: [...] }
  ]
});
// Cache automatically created at .awesome-pages/cache.v1.json
```

### Disable cache
```typescript
await parse({
  cache: false,
  sources: [...]
});
```

### Custom cache location
```typescript
await parse({
  cachePath: './my-cache.json',
  sources: [...]
});
```

## For Developers

### Adding cache support to a new source

1. Update the `read()` method signature:
```typescript
async read(cache?: CacheManager): Promise<string> {
  const sourceId = this.id();
  // ...
}
```

2. For remote sources (HTTP/GitHub):
```typescript
// Check cache for conditional headers
if (cache) {
  const cached = cache.getEntry(sourceId);
  if (cached && cached.kind === 'remote') {
    if (cached.etag) {
      headers['If-None-Match'] = cached.etag;
    }
    if (cached.lastModified) {
      headers['If-Modified-Since'] = cached.lastModified;
    }
  }
}

// Make request...
const res = await fetch(url, { headers });

// Handle 304
if (res.status === 304) {
  if (cache) {
    cache.setEntry(sourceId, {
      kind: 'remote',
      etag: res.headers.get('etag') || undefined,
      lastModified: res.headers.get('last-modified') || undefined,
      lastSeen: new Date().toISOString(),
      lastStatus: 304,
    });
  }
  // Re-fetch without conditional headers...
}

// Update cache on success
if (cache && res.ok) {
  cache.setEntry(sourceId, {
    kind: 'remote',
    etag: res.headers.get('etag') || undefined,
    lastModified: res.headers.get('last-modified') || undefined,
    lastSeen: new Date().toISOString(),
    lastStatus: res.status,
  });
}
```

3. For local sources:
```typescript
if (cache) {
  const stats = await fs.stat(this.filepath);
  cache.setEntry(sourceId, {
    kind: 'local',
    mtimeMs: stats.mtimeMs,
    size: stats.size,
    lastSeen: new Date().toISOString(),
  });
}
```

### Testing cache integration

```typescript
import { NoopCacheManager } from '@/cache/manager';
import type { RemoteCacheEntry } from '@/cache/types';

class MockCacheManager extends NoopCacheManager {
  private entries = new Map<string, RemoteCacheEntry>();

  getEntry(sourceId: string): RemoteCacheEntry | undefined {
    return this.entries.get(sourceId);
  }

  setEntry(sourceId: string, entry: RemoteCacheEntry): void {
    if (entry.kind === 'remote') {
      this.entries.set(sourceId, entry);
    }
  }
}

// In your test:
const cache = new MockCacheManager();
cache.setEntry('test-id', {
  kind: 'remote',
  etag: '"test"',
  lastSeen: new Date().toISOString(),
});

const source = new YourSource(/* ... */);
await source.read(cache);

// Verify cache was updated
const entry = cache.getEntry('test-id');
expect(entry?.etag).toBe('"new-value"');
```

## Cache Entry Types

```typescript
type RemoteCacheEntry = {
  kind: 'remote';
  etag?: string;
  lastModified?: string;
  lastSeen: string;        // ISO timestamp
  lastStatus?: number;
};

type LocalCacheEntry = {
  kind: 'local';
  mtimeMs: number;         // from fs.stat()
  size: number;            // in bytes
  lastSeen: string;        // ISO timestamp
};
```

## Cache File Location

Default: `{rootDir}/.awesome-pages/cache.v1.json`

Where `rootDir` comes from:
1. `ParseOptions.rootDir` (if provided)
2. `process.cwd()` (fallback)

## Important Notes

- Cache is **internal** - not a public artifact
- Cache is **optional** - sources must work without it
- Cache is **version-aware** - corrupted/old versions are ignored
- Cache is **saved in finally block** - persists even on errors
- Source IDs must be **deterministic** and **unique**

## Source ID Format

- GitHub: `github:{owner}/{repo}@{ref}:{path}`
- HTTP: `http:{url}`
- Local: `local:{absolute-path}`

Examples:
- `github:awesome-pages/parser@main:README.md`
- `http:https://example.com/file.md`
- `local:/Users/user/project/README.md`
