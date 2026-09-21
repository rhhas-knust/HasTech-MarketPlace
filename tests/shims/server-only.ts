// vitest alias target for "server-only" -- see vitest.config.ts. The real
// package throws on import outside Next's server compilation; tests run
// plain Node, so we swap in a no-op.
export {};
