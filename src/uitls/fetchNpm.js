import compareVersions from "compare-versions";
import UrlParser from "url-parse";
import init, { WasmTar } from "./WasmTar/wasm_tar";
import { getPackage, savePackage } from "./db";

const registry = "https://registry.npmjs.org/";
export const getPackageJson = async (npmName) => {
  const res = await fetch(`${registry}${npmName}`);
  const { versions } = await res.json();
  const sortedVersion = Object.keys(versions).sort(compareVersions);
  const packageJsonRes = await fetch(
    `${registry}${npmName}/${sortedVersion[sortedVersion.length - 1]}`
  );
  return await packageJsonRes.json();
};
export const getLatestPackageVersion = async (npmName) => {
  const { dist, version } = await getPackageJson(npmName);
  const { tarball } = dist;
  const { pathname } = new UrlParser(tarball);
  const arrayBufferRes = await fetch(`${registry}${pathname}`);
  const arrayBuffer = await arrayBufferRes.arrayBuffer();
  return {
    arrayBuffer,
    version,
  };
};
export const fetchNpmAndStore = async (npmName, targetVersion) => {
  let version, arrayBuffer;
  if (targetVersion) {
    const packageDetail = await (
      await fetch(`${registry}${npmName}/${targetVersion}`)
    ).json();
    const { pathname } = new UrlParser(packageDetail.dist.tarball);
    arrayBuffer = await (await fetch(`${registry}${pathname}`)).arrayBuffer();
    version = packageDetail.version;
  } else {
    const packageDetail = await getLatestPackageVersion(npmName);
    version = packageDetail.version;
    arrayBuffer = packageDetail.arrayBuffer;
  }
  const wasm = await init();
  const tarFile = WasmTar.new();
  console.time("transfer");
  const data = transferContent(arrayBuffer, tarFile, wasm);
  console.timeEnd("transfer");
  await savePackage(data, npmName, version);
  return await getPackage(npmName, version, "package.json");
};

function transferContent(arrayBuffer, wasm_tar, wasm) {
  // 分配内存
  wasm_tar.allocate(arrayBuffer.byteLength);
  const wasm_buffer = new Uint8Array(wasm.memory.buffer);
  const start = wasm_tar.memory_pos();
  const file_buffer = new Uint8Array(arrayBuffer);
  // 设置内存共享
  wasm_buffer.set(file_buffer, start);
  return wasm_tar.get_entries();
}
