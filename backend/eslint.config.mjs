// backend/eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Configuración base para todos los archivos JavaScript/TypeScript
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], // Solo archivos JS/TS, sin JSX/TSX
    plugins: { js },
    extends: ["js/recommended"]
  },
  // Configuración específica para archivos JavaScript (si los hubiera en el backend)
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs", // Común en Node.js
      globals: globals.node, // Usa globales de Node.js
    },
  },
  // Configuración específica y crucial para archivos TypeScript en el backend
  {
    files: ["**/*.{ts,mts,cts}"], // Apunta específicamente a los archivos TypeScript
    extends: [
      ...tseslint.configs.recommended, // Reglas recomendadas de TypeScript ESLint
      // Si más adelante quieres reglas que requieran análisis de tipos más estricto, puedes añadir:
      // ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parser: tseslint.parser, // Usa el parser de TypeScript para ESLint
      parserOptions: {
        project: './tsconfig.json', // ** IMPORTANTE: Apunta a tu tsconfig.json del backend **
        // Asegúrate de que esta ruta sea correcta desde la raíz de tu proyecto backend
      },
      globals: globals.node, // ** Usa globales de Node.js para TypeScript **
    },
    rules: {
      // Aquí puedes añadir tus reglas personalizadas para TypeScript en el backend
      // Por ejemplo, para deshabilitar la regla de 'no-explicit-any':
      // "@typescript-eslint/no-explicit-any": "off",
      // Otras reglas útiles para Node.js:
      "no-console": "warn", // Advierte sobre console.log en producción
      "no-unused-vars": "off", // Desactiva la de ESLint base para que funcione la de TS
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }], // Manejo de vars no usadas en TS
    },
  },
  // Hemos eliminado la configuración de pluginReact.configs.flat.recommended
  // y cualquier referencia a `pluginReact` ya que no es un proyecto React.
]);