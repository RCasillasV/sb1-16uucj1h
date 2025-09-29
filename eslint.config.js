import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// --- PLUGINS ---
// Cada plugin añade capacidades específicas a ESLint.
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

// --- CONFIGURACIÓN DE PRETTIER ---
// Se usa para desactivar las reglas de estilo de ESLint que entran en conflicto con Prettier.
import prettierConfig from 'eslint-config-prettier';

/**
 * @type {import('typescript-eslint').Config}
 */
export default tseslint.config(
  // 1. Archivos y carpetas a ignorar globalmente.
  // Añadimos node_modules y otras carpetas comunes de build/cache.
  {
    ignores: ['dist', 'build', 'node_modules', '.cache'],
  },

  // 2. Configuración base que se aplica a TODOS los archivos TypeScript/JavaScript.
  // Hereda las reglas recomendadas de ESLint y TypeScript.
  {
    files: ['**/*.{ts,tsx,cts,mts}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
  },
  
  // 3. Configuración específica para el código de la aplicación en `src`.
  // Aquí es donde aplicamos las reglas más estrictas y las que dependen del proyecto.
  {
    files: ['src/**/*.{ts,tsx}'],

    // Heredamos las reglas de accesibilidad recomendadas.
    extends: [jsxA11y.configs.recommended],

    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort,
      'jsx-a11y': jsxA11y,
    },

    languageOptions: {
      globals: {
        ...globals.browser, // Habilita globales del navegador (window, document, etc.)
        ...globals.es2020,
      },
      // ¡MEJORA DE RENDIMIENTO!
      // Las reglas con información de tipos solo se ejecutan en el código de tu app,
      // no en los archivos de configuración, lo que acelera el linting.
      parserOptions: {
        project: true, // Busca el tsconfig.json más cercano
        tsconfigRootDir: import.meta.dirname, // Ayuda a resolver la ruta del tsconfig
      },
    },

    rules: {
      // Aplicamos las reglas recomendadas para los React Hooks.
      ...reactHooks.configs.recommended.rules,

      // Regla para el Fast Refresh de React.
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // Reglas para ordenar automáticamente las importaciones.
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Ejemplo de una regla personalizada: previene el uso de `any`.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // 4. Configuración para los archivos de configuración (como este mismo).
  // Es más laxa y usa los globales de Node.js.
  {
    files: ['eslint.config.ts', 'vite.config.ts', '*.config.js'],
    languageOptions: {
      globals: {
        ...globals.node, // Habilita globales de Node.js (process, require, etc.)
      },
    }
  },

  // 5. ¡MUY IMPORTANTE! La configuración de Prettier.
  // Debe ir AL FINAL para desactivar cualquier regla de estilo de las configuraciones anteriores.
  prettierConfig,
);
