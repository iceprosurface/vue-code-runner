import { Buffer } from "buffer";
window.Buffer = Buffer;
window.process = {
  env: {},
  argv: [],
};
window.global = {};
