import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".verification/**"] },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
