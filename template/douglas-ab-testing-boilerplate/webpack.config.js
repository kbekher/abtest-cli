const fs = require('fs');
const path = require('path');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const isProduction = process.env.NODE_ENV === 'production';

const fileNames = fs.readdirSync('./src').reduce((acc, v) => {
    let name = v;
    if(name.indexOf('scss') !== -1) name = name.replace('.scss', '');

    return { ...acc, [name]: `./src/${v}` };
}, {});

module.exports = {
    mode: 'production',
    entry: fileNames,
    watch: true,
    watchOptions: {
        ignored: '**/node_modules',
    },
    output: {
        filename: '[name]',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            // {
            //     test: /\.js$/,
            //     exclude: /node_modules/,
            //     use: {
            //         loader: 'babel-loader',
            //         options: {
            //             presets: [[
            //                 "@babel/preset-env",
            //             ]],
            //         }
            //     }
            // },
            {
                test: /.s?css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
            },
        ],
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    optimization: {
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: isProduction, // Remove or keep console.log statements
              },
            },
          }),
            new CssMinimizerPlugin(),
        ],
        usedExports: true,
    },
    plugins: [new MiniCssExtractPlugin({
        filename: '[name].css',
    })],
    devServer: {
        static: {
          directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 8080,
        allowedHosts: 'all',
        http2: true,
    }
};