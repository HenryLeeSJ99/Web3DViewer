import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "public/src/app.js",
  output: [
    {
      format: "esm",
      file: "public/src/bundle.js",
    },
  ],
  plugins: [resolve()],
};