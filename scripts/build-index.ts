import { readdir } from 'node:fs/promises';
import { THEMES_DIR, INDEX_FILE, INDEX_VERSION, themeIdFromFileName } from './config';
import type { ThemeFile, ThemeIndexEntry, ThemeIndex } from './types';

const REQUIRED_FIELDS = ['name', 'description', 'author', 'tags', 'palette'] as const;

const parseThemeFile = async (file: string): Promise<ThemeIndexEntry> => {
  const filePath = `${THEMES_DIR}/${file}`;
  const theme: ThemeFile = await Bun.file(filePath).json();
  const id = themeIdFromFileName(file);

  const missingFields = REQUIRED_FIELDS.filter((field) => theme[field] === undefined);
  if (missingFields.length) {
    throw new Error(`${filePath}: missing required fields: ${missingFields.join(', ')}`);
  }

  return {
    id,
    name: theme.name,
    description: theme.description,
    author: theme.author,
    tags: theme.tags,
    palette: theme.palette,
    path: filePath,
  };
};

const checkForDuplicates = (entries: ThemeIndexEntry[]): void => {
  const ids = entries.map((entry) => entry.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) {
    throw new Error(`Duplicate theme ids: ${duplicates.join(', ')}`);
  }
};

const files = (await readdir(THEMES_DIR))
  .filter((file) => file.endsWith('.json'))
  .sort();

const entries = await Promise.all(files.map(parseThemeFile));
checkForDuplicates(entries);

const index: ThemeIndex = {
  version: INDEX_VERSION,
  themes: entries,
};

await Bun.write(INDEX_FILE, JSON.stringify(index, null, 2) + '\n');
console.log(`Wrote ${INDEX_FILE} with ${entries.length} themes`);
