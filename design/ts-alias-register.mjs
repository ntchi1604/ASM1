// `--import` chỉ chạy tệp, không đăng ký hook resolve. Phải gọi register().
import { register } from "node:module";

register("./ts-alias-hooks.mjs", import.meta.url);
