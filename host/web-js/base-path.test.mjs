import { expect, test } from 'bun:test';
import { withGenerationBase } from '../web/generations.mjs';
import { matchPattern, siteBase, stripBase, withBase } from './route-pattern.js';

const table = [
  { pattern: '/', notfound: false },
  { pattern: '/book/:id', notfound: false },
  { pattern: '/not-found', notfound: true },
];
const id = 'a'.repeat(32);
const document = (generation, recorded) => ({
  baseURI: `http://127.0.0.1:9${generation}`,
  querySelector: (selector) => selector === 'meta[name="exact-base"]' && recorded !== null ? { getAttribute: () => recorded } : null,
});

test('a served page takes its base from the build, not the generation <base>', () => {
  for (const [base, location] of [['/', '/book/seed-2'], ['/app/', '/app/book/seed-2']]) {
    const shell = `<!doctype html><head><base href="${base}"><meta name="exact-base" content="${base}"></head>`;
    const served = withGenerationBase(shell, id, base);
    const generation = /<base href="([^"]+)"/.exec(served)[1];
    expect(generation).toBe(`${base}.exact/gen/${id}/`);
    const site = siteBase(document(generation, base));
    expect(site).toBe(base);
    expect(matchPattern(table, stripBase(location, site))).toBe(1);
    expect(siteBase(document(generation, null))).toBe('/');
    expect(withBase('/book/seed-3', site)).toBe(base === '/' ? '/book/seed-3' : '/app/book/seed-3');
  }
});
