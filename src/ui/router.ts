import { useEffect, useState } from 'react';

export interface Loc {
  parts: string[];
  query: URLSearchParams;
  raw: string;
}

function parse(): Loc {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(qs ?? ''), raw };
}

export function useLocation(): Loc {
  const [loc, setLoc] = useState(parse);
  useEffect(() => {
    const on = () => setLoc(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return loc;
}

export function go(path: string) {
  const target = path.startsWith('#') ? path : `#${path}`;
  if (location.hash !== target) location.hash = target;
}

export const href = (path: string) => `#${path}`;
