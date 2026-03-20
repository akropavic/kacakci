const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'https://taraftar.site';
const MATCHES = [
    { id: '/matches?id=bein-sports-1',  takim: 'bein1' },
    { id: '/matches?id=bein-sports-2', takim: 'bein2' },
    { id: '/matches?id=bein-sports-3',  takim: 'bein3' },
    { id: '/matches?id=bein-sports-max-1', takim: 'beinmax1' },
    { id: '/matches?id=bein-sports-max-2', takim: 'beinmax2' },
];

fs.writeFileSync('stream_links.json', JSON.stringify({}, null, 2));
console.log('stream_links.json temizlendi.');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    
    console.log('Yönlendirme adresi aranıyor...');
    const tempPage = await browser.newPage();
    await tempPage.goto(BASE_URL, { waitUntil: 'networkidle2' });
    const redirectedBase = new URL(tempPage.url()).origin;
    await tempPage.close();
    console.log(`Yönlendirilen adres: ${redirectedBase}`);

    const results = {};

    for (const match of MATCHES) {
        const fullUrl = redirectedBase + match.id;
        console.log(`\nSayfa açılıyor: ${match.takim} - ${fullUrl}`);
        
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        results[match.takim] = [];

        page.on('request', request => {
            const url = request.url();
            if (url.includes('.m3u8')) {
                const path = new URL(url).pathname.replace(/^\//, '');
                if (!results[match.takim].includes(path)) {
                    console.log(`[${match.takim.toUpperCase()}] BULUNDU:`, path);
                    results[match.takim].push(path);
                } else {
                    console.log(`[${match.takim.toUpperCase()}] TEKRAR - ATLANDI:`, path);
                }
            }
            request.continue();
        });

        await page.goto(fullUrl);
        await new Promise(r => setTimeout(r, 20000));
        await page.close();
    }

    await browser.close();

    fs.writeFileSync('stream_links.json', JSON.stringify(results, null, 2));
    console.log('\nTüm linkler stream_links.json dosyasına kaydedildi.');
})();
