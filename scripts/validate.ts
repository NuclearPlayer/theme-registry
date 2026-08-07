import { readdir } from 'node:fs/promises';
import { compileSchema } from 'json-schema-library';
import {
  THEMES_DIR,
  INDEX_FILE,
  INDEX_SCHEMA_FILE,
  THEME_FILE_SCHEMA_FILE,
  themeIdFromFileName,
} from './config';
import type { ThemeIndex } from './types';

const formatError = (file: string, error: { message: string; data?: { pointer?: string } }) =>
  `${file}: ${error.message} (at ${error.data?.pointer ?? '/'})`;

const indexSchemaDocument = await Bun.file(INDEX_SCHEMA_FILE).json();
const indexSchema = compileSchema(indexSchemaDocument);
const themeIdSchema = compileSchema(indexSchemaDocument.$defs.theme.properties.id);
const themeFileSchema = compileSchema(await Bun.file(THEME_FILE_SCHEMA_FILE).json());
const index: ThemeIndex = await Bun.file(INDEX_FILE).json();

const indexErrors = indexSchema.validate(index).errors
  .map((error) => formatError(INDEX_FILE, error));

const themeFiles = (await readdir(THEMES_DIR))
  .filter((file) => file.endsWith('.json'))
  .sort();

const fileNameErrors = themeFiles.flatMap((file) =>
  themeIdSchema.validate(themeIdFromFileName(file)).errors
    .map((error) => `${THEMES_DIR}/${file}: the filename becomes the theme id. ${error.message}`),
);

const themeFileErrors = (await Promise.all(
  themeFiles.map(async (file) => {
    const filePath = `${THEMES_DIR}/${file}`;
    const theme = await Bun.file(filePath).json();
    return themeFileSchema.validate(theme).errors
      .map((error) => formatError(filePath, error));
  }),
)).flat();

const ids = index.themes.map((theme) => theme.id);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);

const allErrors = [
  ...indexErrors,
  ...fileNameErrors,
  ...themeFileErrors,
  ...duplicates.map((id) => `Duplicate theme ID: ${id}`),
];

if (allErrors.length) {
  console.error('Validation failed:\n');
  allErrors.forEach((error) => console.error(`  - ${error}`));
  console.error();
  process.exit(1);
}

console.log(`Validated ${index.themes.length} theme(s) and ${themeFiles.length} theme file(s). All checks passed.`);
