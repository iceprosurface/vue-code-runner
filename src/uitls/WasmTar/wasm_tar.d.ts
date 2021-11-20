/* tslint:disable */
/* eslint-disable */
/**
*/
export class WasmTar {
  free(): void;
/**
* @returns {WasmTar}
*/
  static new(): WasmTar;
/**
* @param {number} length
*/
  allocate(length: number): void;
/**
* @returns {number}
*/
  memory_pos(): number;
/**
* @returns {Array<any>}
*/
  get_entries(): Array<any>;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasmtar_free: (a: number) => void;
  readonly wasmtar_new: () => number;
  readonly wasmtar_allocate: (a: number, b: number) => void;
  readonly wasmtar_memory_pos: (a: number) => number;
  readonly wasmtar_get_entries: (a: number) => number;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
