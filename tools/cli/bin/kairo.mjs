#!/usr/bin/env node
import('../src/index.ts').catch(async () => {
  // fallback to compiled output in production
  await import('../dist/index.js');
});
