export default {
  contextSeparator: '_',
  createOldCatalogs: false,
  defaultNamespace: 'common',
  defaultValue: '',
  indentation: 2,
  keepRemoved: true,
  lexers: {
    js: ['JsxLexer'],
    ts: ['JsxLexer'],
    jsx: ['JsxLexer'],
    tsx: ['JsxLexer'],
    default: ['JsxLexer']
  },
  lineEnding: 'auto',
  locales: ['en-US', 'zh-CN'],
  namespaceSeparator: ':',
  keySeparator: '.',
  output: 'public/locales/$LOCALE/$NAMESPACE.json',
  input: ['src/**/*.{js,jsx,ts,tsx}'],
  sort: true,
  useKeysAsDefaultValue: true,
  verbose: true,
  failOnWarnings: false
}
