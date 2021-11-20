use tar;
use flate2::read::GzDecoder;
use wasm_bindgen::prelude::*;
use std::io::Read;
use wasm_bindgen::__rt::IntoJsResult;
use js_sys;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub struct WasmTar {
    tar_buffer: Vec<u8>,
}
#[wasm_bindgen]
impl WasmTar {
    pub fn new() -> WasmTar {
        WasmTar {
            tar_buffer: Vec::new(),
        }
    }

    pub fn allocate(&mut self, length: usize) {
        self.tar_buffer = vec![0; length]
    }

    pub fn memory_pos(&self) -> *const u8 {
        self.tar_buffer.as_ptr()
    }

    pub fn get_entries(&self) -> js_sys::Array {
        let mut archive = tar::Archive::new(GzDecoder::new(self.tar_buffer.as_slice()));
        let entries = js_sys::Array::new();

        let mut i = 0;
        for file in archive.entries().unwrap() {
            let mut file = file.unwrap();
            entries.set(i, JsValue::from_str(file.header().path().unwrap().to_str().unwrap()));
            i += 1;
            let mut file_content = String::new();
            file.read_to_string(&mut file_content);
            entries.set(i, JsValue::from_str(file_content.as_str()));
            i += 1;
        }
        return entries;
    }
}

