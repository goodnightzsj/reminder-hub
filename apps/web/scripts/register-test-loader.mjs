import { register } from "node:module";

register("./test-loader.mjs", new URL(".", import.meta.url));
