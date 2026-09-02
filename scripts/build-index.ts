import { REGISTRIES, listThemeFiles } from './config';
import type { Registry } from './config';
import type { ThemeFile, ThemeIndexEntry, ThemeIndex } from './types';

const parseThemeFile = async (registry: Registry, file: string): Promise<ThemeIndexEntry> => {
  const filePath = `${registry.themesDir}/${file}`;
  const theme: ThemeFile = await Bun.file(filePath).json();
  return {
    id: file.replace(/\.json$/, ''),
    name: theme.name,
    description: theme.description,
    author: theme.author,
    tags: theme.tags,
    palette: theme.palette,
    path: filePath,
  };
};

const buildIndex = async (registry: Registry): Promise<void> => {
  const files = await listThemeFiles(registry);
  const entries = await Promise.all(files.map((file) => parseThemeFile(registry, file)));

  const index: ThemeIndex = { version: registry.version, themes: entries };
  await Bun.write(registry.indexFile, JSON.stringify(index, null, 2) + '\n');
  console.log(`Wrote ${registry.indexFile} with ${entries.length} themes`);
};

await Promise.all(REGISTRIES.map(buildIndex));
