const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");

const projectName = "quizlet-pro";

module.exports = (env) => {
  let enableLiveReload = env.enableLiveReload;
  return {
    mode: "production",
    entry: {
      "background": "./src/_chrome/background.ts",
      "content-script": "/src/_chrome/content-script.ts",
    },
    output: {
      path: path.resolve(__dirname, "dist/" + projectName), // 輸出目錄
      filename: "[name].js", // 輸出文件名
    },
    resolve: {
      extensions: [".ts", ".js"], // 解析的檔案格式
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.ENABLE_LIVE_RELOAD": enableLiveReload,
      }),
      new CopyPlugin({
        patterns: [
          {
            from: "src/_chrome",
            to: "",
            globOptions: {
              ignore: [
                "**/*.ts", // 排除所有 .ts 文件
              ],
            },
          },
        ],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
  };
};
