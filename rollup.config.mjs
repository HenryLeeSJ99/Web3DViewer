import resolve from "@rollup/plugin-node-resolve";
import multi from '@rollup/plugin-multi-entry';
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'; // Import the JSON plugin


export default {
  input: ["public/src/app.js"],
  output: [
    {
      format: "esm",
      file: "public/src/bundle.js",
    },
  ],
  plugins: [multi(), resolve(), commonjs(), json()],
};