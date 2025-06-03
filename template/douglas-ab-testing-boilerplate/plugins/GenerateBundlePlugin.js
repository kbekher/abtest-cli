const fs = require('fs');
const path = require('path');

class GenerateBundlePlugin {
    constructor(options) {
        this.lastModified = 0;
    }

    apply(compiler) {
        compiler.hooks.watchRun.tapAsync('GenerateBundlePlugin', (comp, callback) => {
            const srcDir = path.resolve(__dirname, '../src');
            // Usage Example: VARIATION=variation-02 npm run dev
            const variation = process.env.VARIATION || 'variation-01';
            const watchFiles = fs.readdirSync(srcDir)
                .filter(file => new RegExp(`^(global|${variation})\\.js$`).test(file))
                .map(file => path.join(srcDir, file));

            let shouldUpdate = false;

            for (const file of watchFiles) {
                const stat = fs.statSync(file);
                if (stat.mtimeMs > this.lastModified) {
                    shouldUpdate = true;
                    this.lastModified = stat.mtimeMs;
                }
            }

            if (!shouldUpdate) {
                return callback(); // Skip bundle regeneration
            }

            // Proceed with bundle.js generation logic
            console.log('🔁 Detected changes, regenerating bundle.js...');

            const fileNames = fs.readdirSync(srcDir).reduce((acc, file) => {
                if (file.endsWith('.js')) acc[file] = `./src/${file}`;
                return acc;
            }, {});

            const selectedFiles = Object.keys(fileNames)
                .filter(file => new RegExp(`^(global|${variation})\\.js$`).test(file))
                .reduce((acc, file) => ({ ...acc, [file]: fileNames[file] }), {});

            const toolkitImports = new Set();
            const otherImports = new Set();
            const mainContents = [];

            Object.values(selectedFiles).forEach(filePath => {
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const otherImportMatches = content.match(/^import\s.+?\sfrom\s['"][^'"]+['"];?/gm);
                    otherImportMatches?.forEach(importStatement => {
                        const matchedValues = importStatement.match(/import\s+\{([^}]+)\}\s+from\s+['"]@douglas\.onsite\.experimentation\/douglas-ab-testing-toolkit['"]/);
                        if (matchedValues) {
                            matchedValues[1].split(',').map(val => val.trim()).forEach(val => toolkitImports.add(val));
                        } else {
                            otherImports.add(importStatement);
                        }
                    });
                    if (otherImportMatches) {
                        mainContents.push(content.replace(otherImportMatches.join('\n'), ''));
                    }
                }
            });

            const wrapped = `
import { ${[...toolkitImports].join(', ')} } from '@douglas.onsite.experimentation/douglas-ab-testing-toolkit';
${[...otherImports].join('\n')}

(function() {
    const waitForKameleoon = setInterval(() => {
        if (typeof Kameleoon === 'object') {
            console.log('Kameleoon library loaded, executing code.');
            clearInterval(waitForKameleoon);
            ${mainContents.join('\n')}
        }
    }, 100);
})();
`;
            const bundlePath = path.join(srcDir, 'bundle.js');
            fs.writeFileSync(bundlePath, wrapped);
            console.log('✅ bundle.js updated.');
            callback();
        });
    }
}

module.exports = GenerateBundlePlugin;
