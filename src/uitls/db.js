import Dexie from "dexie";
import { getPackageJson } from "../uitls/fetchNpm";
const db = new Dexie("npm");

// Declare tables, IDs and indexes
db.version(1).stores({
  package: "[name+version+path], content",
});

export async function getPackage(name, version, path) {
  if (!version) {
    const { version } = await getPackageJson(name);
    if (path) {
      const query = {
        name,
        path,
        version,
      };
      return db.package.where(query).last();
    } else {
      return db.package.where({ name, version }).last();
    }
  } else if (path) {
    return db.package
      .where(["name", "version", "path"])
      .equals([name, version, path])
      .last();
  } else {
    return db.package.where(["name", "version"]).equals([name, version]).last();
  }
}
export async function savePackage(contents, name, version) {
  const jsons = [];
  for (let i = 0; i < contents.length - 1; i += 2) {
    const path = contents[i].replace(/^package\//, "");
    const content = contents[i + 1];
    if (path) {
      jsons.push({ content, path, name, version });
    }
  }
  return db
    .transaction("rw", db.package, async () => {
      return db.package.bulkAdd(jsons);
    })
    .catch(console.error);
}
export default db;
