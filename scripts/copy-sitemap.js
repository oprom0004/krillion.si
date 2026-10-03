import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const sitemap0 = path.join(distDir, 'sitemap-0.xml');
const targetSitemap = path.join(distDir, 'sitemap.xml');

if (fs.existsSync(sitemap0)) {
  fs.copyFileSync(sitemap0, targetSitemap);
  console.log('✅ Successfully created dist/sitemap.xml from sitemap-0.xml');
} else {
  console.log('ℹ️ sitemap-0.xml not found, leaving sitemap.xml intact if exists.');
}
