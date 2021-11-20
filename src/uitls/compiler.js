import * as Babel from "@babel/standalone";
import { reactive, ref } from "vue";
import * as compiler from "vue-template-compiler";
import { getPackage } from "../uitls/db";
import { getSucraseContext, transformFromContext } from "./sucrase";
function uuidv4() {
  // Public Domain/MIT
  let d = new Date().getTime(); //Timestamp
  let d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0; //Time in microseconds since page-load or 0 if unsupported
  return "IDxxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
export function getVueCompiler(template) {
  const res = compiler.parseComponent(template);
  res.script = res.script.content;
  const tpl = compiler.compile(res.template.content, {});
  res.template = tpl.render;
  res.staticRenderFns = tpl.staticRenderFns;
  res.render = `
function render () {
  const r = new Function(\`${res.template}\`)
  return r.call(this)
}  
`;
  return res;
}

export function createMiniFs() {
  const memoryFs = ref({});
  const npmPackage = reactive({});
  return {
    memoryFs,
    npmPackage,
    removeAllFiles() {
      memoryFs.value = {};
    },
    putFile(content, path) {
      memoryFs.value[path] = content;
    },
    putNpm(name, version) {
      npmPackage[name] = version;
    },
    removeNpm(name) {
      delete npmPackage[name];
    },
    async readFile(path) {
      const content = memoryFs.value[path];
      if (content) {
        return content;
      }
      if (/^(?:@([^/]+?)[/])?([^/]+?)$/.test(path)) {
        // 是 npm 包，且默认
        try {
          const version = npmPackage[path];
          if (version) {
            const { content: packageJson } = await getPackage(
              path,
              version,
              "package.json"
            );
            const { main, module } = JSON.parse(packageJson);
            const { content: packageContent } = await getPackage(
              path,
              version,
              module || main
            );
            return packageContent;
          }
        } catch (e) {
          console.warn("not a npm", path);
        }
      }
      const matched = path.match(/^([\w\d.-_]*?)\/?(.*?)$/);
      if (matched) {
        const [_, packageName, targetPath] = matched;
        let targetPackage = packageName || targetPath;
        if (npmPackage[targetPackage]) {
          const version = npmPackage[name];
          const { content: packageContent } = await getPackage(
            targetPackage,
            version,
            targetPath
          );
          return packageContent;
        }
      }
      return null;
    },
  };
}
export const fs = createMiniFs();
export const distFs = createMiniFs();

Babel.registerPlugin("import", function () {
  return {
    visitor: {
      ImportDeclaration(path, source) {
        console.log(path, source);
      },
    },
  };
});

export async function createAsset(filename) {
  console.time(filename);
  let content =
    (await fs.readFile(filename)) || (await distFs.readFile(filename));
  let outputFilename = filename;
  if (/\.vue$/.test(filename)) {
    const outputName = (outputFilename = `${filename.replace(
      /\.vue$/,
      ".js"
    )}`);
    const vueScriptName = `${outputName}?type=script`;
    const result = getVueCompiler(content);
    const vueContent = `
import vueScript from '${vueScriptName}';
vueScript.staticRenderFns = [${result.staticRenderFns
      .map((fn) => {
        return `new Function(\`${fn}\`)`;
      })
      .join(",")}];
vueScript.render = ${result.render};
export default vueScript;
`;
    distFs.putFile(vueContent, outputName);
    distFs.putFile(result.script, vueScriptName);
    content = vueContent;
  }
  if (content) {
    // 这里使用 sucrase， 单纯对于 vue
    // 使用 babel ast 解析大概需要 400 （ast） + 230 （walk） + 700 （build）
    // 而 sucrase 只需要 85 ms
    const option = {
      transforms: ["imports"],
    };
    const ctx = getSucraseContext(content, option);
    const data = transformFromContext(ctx, option);
    const dependencies = [];
    ctx.importProcessor.importInfoByPath.forEach((value, key) => {
      dependencies.push(key);
    });
    const id = uuidv4();
    const code = data.code;
    console.timeEnd(filename);
    return {
      id,
      filename: outputFilename,
      dependencies,
      code,
    };
  }
  return {
    id: uuidv4(),
    filename,
    dependencies: [],
    content,
  };
}
export async function createGraph(entry) {
  const mainAsset = await createAsset(entry);

  const queue = [mainAsset];
  console.time("graph");
  for (const asset of queue) {
    await distFs.readFile(asset.filename);
    asset.mapping = {};
    await Promise.all(
      asset.dependencies.map(async (path) => {
        const child = await createAsset(path);
        asset.mapping[path] = child.id;
        queue.push(child);
      })
    );
  }
  console.timeEnd("graph");
  return { queue, entryID: mainAsset.id };
}

export function bundle(graph, entryID) {
  console.time("bundle");
  let modules = "";

  graph.forEach((mod) => {
    modules += `${mod.id}: [
      function(require, module, exports) {
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)}
    ],`;
  });
  console.timeEnd("bundle");

  return `
window.process = {
  env: {},
  argv: [],
};
    (function(modules) {
      function require(id) {
        const [fn, mapping] = modules[id] 
        function localRequire(relativePath) {
          return require(mapping[relativePath])
        }
        const module = {exports: {}}
        fn(localRequire, module, module.exports)
        return module.exports
      }    
      require('${entryID}')      
    })({           
      ${modules}
    })       
  `;
}
