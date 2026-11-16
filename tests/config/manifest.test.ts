/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';
import { GeneralTranslations } from '@config/translations/General';

type ManifestIcon = { src: string; sizes: string; type?: string; purpose?: string };
type Manifest = Record<string, unknown> & { icons?: ManifestIcon[] };

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');

const readManifest = (file: string): Manifest =>
    JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, file), 'utf8')) as Manifest;

// PNG IHDR: width and height are big-endian uint32 at bytes 16-23.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const pngSize = (file: string) => {
    const buf = fs.readFileSync(path.join(PUBLIC_DIR, file));
    expect(buf.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
};

const purposeOf = (icon: ManifestIcon) => icon.purpose ?? 'any';

const MANIFESTS = ['site.webmanifest', 'site-en.webmanifest'];
const REQUIRED_FIELDS = ['name', 'short_name', 'start_url', 'id', 'scope', 'theme_color', 'background_color'];
const REQUIRED_ICONS = [
    { sizes: '192x192', purpose: 'any' },
    { sizes: '512x512', purpose: 'any' },
    { sizes: '512x512', purpose: 'maskable' },
];

describe.each(MANIFESTS)('%s', (file) => {
    test('has every field the browser needs to offer install', () => {
        const manifest = readManifest(file);

        const missing = REQUIRED_FIELDS.filter((field) => typeof manifest[field] !== 'string' || manifest[field] === '');

        expect(missing).toEqual([]);
        expect(manifest.display).toBe('standalone');
    });

    test.each(REQUIRED_ICONS)('lists a $sizes $purpose PNG icon whose file has that size', ({ sizes, purpose }) => {
        const icons = readManifest(file).icons ?? [];
        const icon = icons.find((i) => i.sizes === sizes && purposeOf(i).split(' ').includes(purpose));

        expect(icon).toBeDefined();
        expect(icon!.type).toBe('image/png');
        const [width, height] = sizes.split('x').map(Number);
        expect(pngSize(icon!.src.replace(/^\//, ''))).toEqual({ width, height });
    });

    test('maskable 512 icon is a separate file from the 512 any icon', () => {
        const icons = readManifest(file).icons ?? [];
        const any512 = icons.find((i) => i.sizes === '512x512' && purposeOf(i).split(' ').includes('any'));
        const maskable512 = icons.find((i) => i.sizes === '512x512' && purposeOf(i).split(' ').includes('maskable'));

        expect(any512).toBeDefined();
        expect(maskable512).toBeDefined();
        expect(maskable512!.src).not.toBe(any512!.src);
    });
});

describe('locale manifests', () => {
    test('en manifest file exists', () => {
        expect(fs.existsSync(path.join(PUBLIC_DIR, 'site-en.webmanifest'))).toBe(true);
    });

    test('en manifest starts the app in English, apart from the es one', () => {
        const es = readManifest('site.webmanifest');
        const en = readManifest('site-en.webmanifest');

        expect(en.start_url).toBe('/en/');
        expect(en.id).toBe('/en/');
        expect(en.lang).toBe('en');
        expect(es.start_url).toBe('/');
        expect(es.id).toBe('/');
        expect(es.lang).toBe('es');
    });

    test('en manifest describes the app in English', () => {
        const en = readManifest('site-en.webmanifest');

        expect(en.description).toBe(GeneralTranslations.en.mainDescription);
    });
});

test('apple-touch-icon is 180x180', () => {
    expect(pngSize('apple-touch-icon.png')).toEqual({ width: 180, height: 180 });
});
