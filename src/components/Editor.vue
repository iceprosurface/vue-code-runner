<template>
  <div ref="monacoRef" style="width: 100%; height: 400px"></div>
</template>
<script>
import { defineComponent, onMounted, onUnmounted, ref, watch } from "vue";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import * as a1 from "monaco-editor/esm/vs/language/json/monaco.contribution";
import * as a2 from "monaco-editor/esm/vs/basic-languages/html/html.contribution";
import * as a3 from "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution";
import "monaco-editor/esm/vs/editor/contrib/find/findController";
import prettier from "prettier/standalone";
import html from "prettier/parser-html";
export default defineComponent({
  props: {
    value: String,
  },
  model: {
    prop: "value",
    event: "change",
  },
  setup(props, { emit }) {
    const monacoRef = ref();
    let monacoInstance;
    let model;
    onMounted(() => {
      model = monaco.editor.createModel(props.value, "javascript");
      monacoInstance = monaco.editor.create(monacoRef.value, {
        model,
        theme: "vs-dark",
      });
      model.onDidChangeContent(() => {
        emit("v-change", model.getValue());
      });
    });
    onUnmounted(() => {
      monacoInstance?.dispose();
    });
    const commonConfig = {
      arrowParens: "always",
      bracketSpacing: true,
      embeddedLanguageFormatting: "auto",
      htmlWhitespaceSensitivity: "css",
      insertPragma: false,
      jsxBracketSameLine: false,
      jsxSingleQuote: false,
      printWidth: 80,
      proseWrap: "preserve",
      quoteProps: "as-needed",
      requirePragma: false,
      semi: true,
      singleQuote: false,
      tabWidth: 2,
      trailingComma: "es5",
      useTabs: false,
      vueIndentScriptAndStyle: false,
    };
    const getLang = (lang) => {
      switch (lang) {
        case "vue":
          return "html";
        case "javascript":
          return "javascript";
      }
    };
    const prettierCode = (text, lang) => {
      if (lang === "vue") {
        return prettier.format(text, {
          parser: "html",
          plugins: [html],
        });
      } else if (lang === "javacript") {
        return prettier.format(text, {
          parser: "javascript",
          plugins: [],
        });
      }
      return text;
    };
    return {
      monacoRef,
      setValue(value, fileName, lang) {
        const text = prettierCode(value, lang);
        model.setValue(text);
        monaco.editor.setModelLanguage(model, getLang(lang));
      },
    };
  },
});
</script>
