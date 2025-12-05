import * as acorn from 'acorn';

export const extractIdentifiers = (code: string): string[] => {
  const ids = new Set<string>();

  try {
    const tree = acorn.parse(code, { ecmaVersion: 'latest' }) as any;
    const walk = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (node.id?.name) ids.add(node.id.name);
      Object.values(node).forEach(walk);
    };
    walk(tree);
  } catch {
    const re = /\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g;
    let m;
    while ((m = re.exec(code))) ids.add(m[1]);
  }

  return [...ids];
};
