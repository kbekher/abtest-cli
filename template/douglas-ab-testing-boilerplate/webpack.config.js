const fs = require('fs');
const path = require('path');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const KameleoonPlugin = require('./plugins/KameleoonPlugin');
const GenerateBundlePlugin = require('./plugins/GenerateBundlePlugin');

const isProduction = process.env.NODE_ENV === 'production';
const isBuildCommand = process.env.NODE_ENV === 'development' || isProduction;

// .filter(file => file !== 'bundle.js')
const fileNames = fs.readdirSync('./src').reduce((acc, file) => {
    let name = file.replace('.scss', '');
    return { ...acc, [name]: `./src/${file}` };
}, {});

// Read experiment data from experimentData.json
const experimentDataPath = path.join(__dirname, 'experimentData.json');
let experimentData = fs.existsSync(experimentDataPath) ? JSON.parse(fs.readFileSync(experimentDataPath)) : {};

if (!experimentData) {
    console.error('Error reading or parsing experimentData.json');
    // process.exit(1); // Uncomment if necessary
}

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
            {
                test: /\.js$/,
                exclude: [
                    /node_modules/,
                    /.*(kameleoon|trigger|targeting).*/i
                ],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [[
                            "@babel/preset-env",
                        ]],
                    }
                }
            },
            {
                test: /.s?css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
            }
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
                extractComments: false, // prevent LiCENSE file creation
            }),
            new CssMinimizerPlugin(),
        ],
        usedExports: true,
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css',
        }),
        ...(isBuildCommand ? [
            // Upload source code to Kameleoon
            new KameleoonPlugin({
                experimentId: experimentData.experimentId,
                variationIds: experimentData.variationIds,
            })
        ] : [
            new GenerateBundlePlugin({})
        ])
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        watchFiles: ['src/**/*.js'],
        compress: true,
        port: 8080,
        allowedHosts: 'all',
        http2: true,
    }
};