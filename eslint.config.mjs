import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Este objeto sobrescreve a configuração da regra no 'nextTs'
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          // A propriedade 'ignoreRestSiblings' diz ao linter para ignorar
          // as variáveis desestruturadas (como 'admin_id') quando há
          // uma propriedade rest ('...team') presente.
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
