import { readdir } from 'node:fs/promises';

export type Registry = {
  version: number;
  themesDir: string;
  indexFile: string;
  themeFileSchemaFile: string;
};

export const V1_REGISTRY: Registry = {
  version: 1,
  themesDir: 'themes',
  indexFile: 'themes.json',
  themeFileSchemaFile: 'schema/theme-file.schema.json',
};

export const V2_REGISTRY: Registry = {
  version: 2,
  themesDir: 'v2/themes',
  indexFile: 'v2/themes.json',
  themeFileSchemaFile: 'schema/v2/theme-file.schema.json',
};

export const REGISTRIES = [V1_REGISTRY, V2_REGISTRY];

export const listThemeFiles = async (registry: Registry): Promise<string[]> => {
  const files = await readdir(registry.themesDir);
  return files.filter((file) => file.endsWith('.json')).sort();
};
