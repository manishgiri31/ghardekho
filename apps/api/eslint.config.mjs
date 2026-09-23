import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const apiConfig = [...nextCoreWebVitals, ...nextTypeScript, {
  rules: { "@next/next/no-html-link-for-pages": "off" },
}];

export default apiConfig;
