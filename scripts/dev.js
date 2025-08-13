// 这个文件会帮我们打包packages下的模块，最终打包出js文件
// node dev.js (要打包的名字 -f 打包的格式) === args.slice(2)

import minimist from "minimist";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

//node中的命令函参数通过process来获取process.argv
// process.argv.slice(2) => [ 'reactivity', '-f', 'esm' ]
// args => { _: [ 'reactivity' ], f: 'esm' }
const args = minimist(process.argv.slice(2));

// import.meta.url => file:///xxxx, 需要通过 fileURLToPath 转换为普通路径
const __filename = fileURLToPath(import.meta.url); // 获取当前文件绝对路径
const __dirname = dirname(__filename); // 获取当前文件所在目录的绝对路径
const require = createRequire(import.meta.url); // 创建一个 require 函数，用于加载模块

const target = args._[0] || "reactivity"; // 打包那个项目
const format = args.f || "iife"; // 打包的后的模块化规范
const pkg = require(`../packages/${target}/package.json`);
// const pkg = await import(`../packages/${target}/package.json`, {
//     with: { type: "json" },
// }) // 实验性功能

// 入口文件路径, 根据命令行提供的路径来进行解析
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);

esbuild
    .context({
        entryPoints: [entry], // 入口
        outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`), // 出口
        bundle: true, // reactivity会依赖其他模块，打包时需要将依赖的模块也打包进去
        platform: "browser", // 打包后给浏览器使用
        sourcemap: true,
        format, // cjs esm iife
        globalName: pkg.buildOptions?.name
    })
    .then((ctx) => {
      console.log("start dev")
      return ctx.watch(); // 监控入口文件持续打包
    })