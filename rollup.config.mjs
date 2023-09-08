import resolve from "@rollup/plugin-node-resolve";
import dotenv from 'dotenv';
import multi from '@rollup/plugin-multi-entry';

dotenv.config()
export default {
  input: ["public/src/firebaseApp.js","public/src/app.js"],
  output: [
    {
      format: "esm",
      file: "public/src/bundle.js",
    },
  ],
  plugins: [multi(), resolve()],
};