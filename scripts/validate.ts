import { compileSchema } from 'json-schema-library';
import { REGISTRIES, listThemeFiles } from './config';
import type { Registry } from './config';

type SchemaError = { message: string; data?: { pointer?: string } };

const formatError = (file: string, error: SchemaError) =>
  `${file}: ${error.message} (at ${error.data?.pointer ?? '/'})`;

const indexSchemaDocument = await Bun.file('schema/themes.schema.json').json();
const indexSchema = compileSchema(indexSchemaDocument);
const themeIdSchema = compileSchema(indexSchemaDocument.$defs.theme.properties.id);

const validateRegistry = async (registry: Registry): Promise<string[]> => {
  const index = await Bun.file(registry.indexFile).json();
  const themeFileSchema = compileSchema(await Bun.file(registry.themeFileSchemaFile).json());
  const files = await listThemeFiles(registry);

  const indexErrors = indexSchema
    .validate(index)
    .errors.map((error) => formatError(registry.indexFile, error));

  const fileErrors = await Promise.all(
    files.map(async (file) => {
      const filePath = `${registry.themesDir}/${file}`;
      const theme = await Bun.file(filePath).json();
      return [
        ...themeIdSchema
          .validate(file.replace(/\.json$/, ''))
          .errors.map((error) => `${filePath}: the filename becomes the theme id. ${error.message}`),
        ...themeFileSchema.validate(theme).errors.map((error) => formatError(filePath, error)),
      ];
    }),
  );

  return [...indexErrors, ...fileErrors.flat()];
};

const errors = (await Promise.all(REGISTRIES.map(validateRegistry))).flat();

if (errors.length) {
  console.error('Validation failed:\n');
  errors.forEach((error) => console.error(`  - ${error}`));
  console.error();
  process.exit(1);
}

console.log('All checks passed.');
