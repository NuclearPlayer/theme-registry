export const THEMES_DIR = 'themes';
export const INDEX_FILE = 'themes.json';
export const INDEX_VERSION = 1;
export const INDEX_SCHEMA_FILE = 'schema/themes.schema.json';
export const THEME_FILE_SCHEMA_FILE = 'schema/theme-file.schema.json';

export const themeIdFromFileName = (file: string) => file.replace(/\.json$/, '');
