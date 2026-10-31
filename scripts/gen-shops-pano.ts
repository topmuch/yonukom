/**
 * Génère les 5 captures de boutiques en format panoramique 1920x960 (ratio 2:1)
 * pour le carrousel "Ils ont fait confiance".
 *
 * Usage: bun scripts/gen-shops-pano.ts [index]
 *   - sans argument : régénère les 5 images (séquentiel)
 *   - avec index (0-4) : régénère une seule image
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "public", "landing", "shops");

const SHOPS: { file: string; prompt: string }[] = [
  {
    file: "shop-restaurant.png",
    prompt:
      "Full screenshot of a modern African restaurant website homepage, ultra-wide panoramic desktop layout, top navigation bar with logo 'Le Baobab' and menu links, large hero section with appetizing grilled dish and elegant dining table, warm terracotta and cream colors, menu cards row below hero, professional web design, clean typography, high quality, detailed UI design",
  },
  {
    file: "shop-salon.png",
    prompt:
      "Full screenshot of an elegant hair salon website homepage, ultra-wide panoramic desktop layout, top navigation bar with logo 'Salon Élégance' and menu links, large hero section with beautiful African woman with braided hairstyle, soft pink and gold tones, booking button, services section below, professional web design, clean typography, high quality, detailed UI design",
  },
  {
    file: "shop-fashion.png",
    prompt:
      "Full screenshot of a modern fashion e-commerce website homepage, ultra-wide panoramic desktop layout, top navigation bar with logo 'Mode Dakar' and shopping cart icon, large hero section with African model wearing colorful wax print fabric outfit, vibrant colors, product grid with clothing cards below, professional web design, clean typography, high quality, detailed UI design",
  },
  {
    file: "shop-fastfood.png",
    prompt:
      "Full screenshot of a modern fast food website homepage, ultra-wide panoramic desktop layout, top navigation bar with logo 'Chez Ali' and menu links, large hero section with juicy burger and crispy fries, bold red and yellow colors, delivery button, menu combo cards below, professional web design, clean typography, high quality, detailed UI design",
  },
  {
    file: "shop-pharmacy.png",
    prompt:
      "Full screenshot of a modern pharmacy website homepage, ultra-wide panoramic desktop layout, top navigation bar with logo 'Pharmacie du Plateau' and menu links, large hero section with shelves of medicine products and a friendly pharmacist in white coat, clean green and white colors, open hours badge, services cards below, professional web design, clean typography, high quality, detailed UI design",
  },
];

async function main() {
  const arg = process.argv[2];
  const indices =
    arg !== undefined
      ? [Number.parseInt(arg, 10)].filter((n) => n >= 0 && n < SHOPS.length)
      : SHOPS.map((_, i) => i);

  if (indices.length === 0) {
    console.error(`Index invalide. Utiliser 0-${SHOPS.length - 1}.`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const zai = await ZAI.create();

  for (const i of indices) {
    const { file, prompt } = SHOPS[i];
    const outPath = path.join(OUT_DIR, file);
    console.log(`[${i + 1}/${SHOPS.length}] Génération ${file} (1920x960)...`);
    try {
      const response = await zai.images.generations.create({
        prompt,
        size: "1920x960",
      });
      const base64 = response.data?.[0]?.base64;
      if (!base64) throw new Error("Réponse vide du générateur d'images");
      const buffer = Buffer.from(base64, "base64");
      fs.writeFileSync(outPath, buffer);
      console.log(`  ✓ ${file} (${Math.round(buffer.length / 1024)} Ko)`);
    } catch (err) {
      console.error(`  ✗ ${file} :`, err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  }
}

main();
