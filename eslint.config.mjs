import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // `next lint` excluded these implicitly. Running the ESLint CLI directly —
  // which Next 16 requires, since `next lint` is removed — means listing them,
  // or ESLint walks the build output and reports thousands of findings in
  // generated code.
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "coverage/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      eqeqeq: ["error", "always"],
    },
  },
];

export default eslintConfig;
