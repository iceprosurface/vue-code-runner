<script setup>
import { computed, ref } from "vue";
import "./template";
import { bundle, createGraph, fs } from "./uitls/compiler";
import { getPackage } from "./uitls/db";
import { fetchNpmAndStore } from "./uitls/fetchNpm";
import Editor from "./components/Editor.vue";
import lodash from "lodash";
const name = ref("");
const packageList = computed(() => {
  return Object.keys(fs.npmPackage).map((value) => ({
    name: value,
    version: fs.npmPackage[value],
  }));
});

const fetchPackage = async (name) => {
  const [_, npmName, version] = name.match(/^(.*?)@(.*?)$/);
  let data = await getPackage(npmName, version, "package.json");
  if (!data) {
    data = await fetchNpmAndStore(npmName, version);
  }
  const json = JSON.parse(data.content);
  fs.putNpm(json.name, json.version);
  return json;
};
const getPackageByInput = async () => {
  await fetchPackage(name.value);
};
const currentFilePath = ref("");
const content = computed(() => fs.memoryFs.value[currentFilePath.value]);
const fileList = computed(() => Object.keys(fs.memoryFs.value));
const changeCurrent = (item) => {
  currentFilePath.value = item;
  editor.value.setValue(fs.memoryFs.value[item], item, language.value);
};
const debounceRun = lodash.debounce(() => {
  run();
}, 200);
const change = (value) => {
  console.log(value);
  if (fs.memoryFs.value[currentFilePath.value] !== value) {
    fs.putFile(value, currentFilePath.value);
    debounceRun();
  }
};
const language = computed(() => {
  const item = currentFilePath.value;
  if (/.js$/.test(item)) {
    return "javascript";
  }
  if (/.vue$/.test(item)) {
    return "vue";
  }
  return undefined;
});

const preview = ref();
const editor = ref();
const loading = ref("");
const run = async () => {
  preview.value.innerHTML = "";
  loading.value = "loading... npm 准备";
  await fetchPackage("vue@2.6.14");
  await fetchPackage("vuex@3.4.0");
  loading.value = "loading...1%";
  loading.value = "loading...50%";
  const { queue, entryID } = await createGraph("main.js");
  loading.value = "loading...80%";
  const code = bundle(queue, entryID);
  loading.value = "loading...90%";
  preview.value.innerHTML = "";
  const iframe = document.createElement("iframe");
  preview.value.appendChild(iframe);
  const div = document.createElement("div");
  div.setAttribute("id", "app");
  iframe.contentWindow.document.body.append(div);
  const script = iframe.contentWindow.document.createElement("script");
  script.type = "text/javascript";
  const blob = new iframe.contentWindow.Blob([code], {
    type: "text/javascript",
  });
  script.src = iframe.contentWindow.URL.createObjectURL(blob);
  iframe.contentWindow.document.body.appendChild(script);
  loading.value = "";
};
</script>

<template>
  <div>
    <a
      href="https://chrome.google.com/webstore/detail/moesif-origin-cors-change/digfbfaphojjndkpccljibejjbppifbc"
      target="_blank"
      >使用浏览器插件解决跨域问题</a
    >
  </div>
  <div style="border: 1px solid sienna">
    <p>packages</p>
    <input v-model="name" />
    <button @click="getPackageByInput">保存</button>
    <div
      v-for="packageItem in packageList"
      :key="`${packageItem.name}/${packageItem.version}`"
    >
      {{ `${packageItem.name}/${packageItem.version}` }}
    </div>
  </div>
  <button @click="run">编译并运行</button>
  <div style="display: flex">
    <div style="width: 50%; display: flex">
      <div
        style="
          width: 120px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        "
      >
        <div
          :style="{
            cursor: 'pointer',
            backgroundColor: currentFilePath === item ? '#ddd' : '',
          }"
          v-for="item in fileList"
          @click="changeCurrent(item)"
        >
          {{ item }}
        </div>
      </div>
      <editor
        :value="content"
        :language="language"
        @v-change="change"
        ref="editor"
      ></editor>
    </div>
    <div>
      <div>{{ loading }}</div>
      <div ref="preview" style="width: 50%"></div>
    </div>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
