const fs = require('fs');
const path = require('path');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const KameleoonPlugin = require('./plugins/KameleoonPlugin');

const isProduction = process.env.NODE_ENV === 'production';
const isBuildCommand = process.env.NODE_ENV === 'development' || isProduction;

// .filter(file => file !== 'bundle.js')
const fileNames = fs.readdirSync('./src').reduce((acc, file) => {
    let name = file.replace('.scss', '');
    return { ...acc, [name]: `./src/${file}` };
}, {});

// Usage Example: VARIATION=variation-02 npm run dev
const selectedVariation = process.env.VARIATION || 'variation-01';
const selectedFiles = Object.keys(fileNames)
    .filter(file => new RegExp(`^(global|${selectedVariation})\\.js$`).test(file))
    .reduce((acc, file) => ({ ...acc, [file]: fileNames[file] }), {});

// console.log('Selected files:', selectedFiles);

const srcDir = path.resolve(__dirname, 'src');
const bundlePath = path.join(srcDir, 'bundle.js');

const wrapWithInterval = (toolkitImports, otherImports, content) => `
import { ${toolkitImports} } from '@douglas.onsite.experimentation/douglas-ab-testing-toolkit';
${otherImports}

(function() {
    const waitForKameleoon = setInterval(() => {
        if (typeof Kameleoon === 'object') {
            console.log('Kameleoon library loaded, executing code.');
            clearInterval(waitForKameleoon);
            ${content}
        }
    }, 100);
})();
`;

const toolkitImports = new Set();
const otherImports = new Set();
const mainContents = [];

// Combine the contents of the selected files
Object.values(selectedFiles).forEach(filePath => {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');

        // Match all import statements
        const otherImportMatches = content.match(/^import\s.+?\sfrom\s['"][^'"]+['"];?/gm);

        otherImportMatches?.forEach(importStatement => {

            // Match imports inside {} from `@douglas.onsite.experimentation/douglas-ab-testing-toolkit`
            const matchedValues = importStatement.match(/import\s+\{([^}]+)\}\s+from\s+['"]@douglas\.onsite\.experimentation\/douglas-ab-testing-toolkit['"]/);

            if (matchedValues) {
                // Extract individual import values, trim them, and add to the set
                matchedValues[1].split(',').map(value => value.trim()).forEach(value => toolkitImports.add(value));

                // Extract other imports into a new set
            } else {
                otherImports.add(importStatement);
            }
        });

        // Push file main content without imports
        if (otherImportMatches) mainContents.push(content.replace(otherImportMatches.join('\n'), ''));
    } else {
        console.warn(`Warning: File not found: ${filePath}`);
    }
});

// Write the combined content wrapped in an interval to bundle.js
fs.writeFileSync(bundlePath, wrapWithInterval([...toolkitImports].join(', '), [...otherImports].join(' '), mainContents.join('\n')));

// console.log('Created src/bundle.js with the selected files wrapped in an interval.');

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
        ] : [])
    ],
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