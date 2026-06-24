import StyleDictionary from 'style-dictionary';
import { readdirSync, mkdirSync } from 'node:fs';
import { resolve, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const brandsDir = resolve(__dirname, 'tokens/brands');
const brandFiles = readdirSync(brandsDir).filter(f => f.endsWith('.json'));

mkdirSync(resolve(__dirname, 'build/css'), { recursive: true });

for (const file of brandFiles) {
  const brandName = basename(file, '.json').replace('brand-', '');

  const sd = new StyleDictionary({
    usesDtcg: true,
    source: [
      resolve(__dirname, 'tokens/core.json'),
      resolve(__dirname, 'tokens/semantic.json'),
      resolve(__dirname, `tokens/brands/${file}`),
    ],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: resolve(__dirname, 'build/css') + '/',
        files: [
          {
            destination: `${brandName}.css`,
            format: 'css/variables',
            options: {
              selector: `[data-brand="${brandName}"]`,
            },
          },
        ],
      },
    },
  });

  await sd.buildAllPlatforms();
}
