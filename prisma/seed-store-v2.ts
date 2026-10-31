// ============================================================
// Seed V2 — Boutique en ligne démo complète
// Crée un tenant démo "Boutique Téranga" avec slug "teranga"
// + business + produits (certains vedettes/promo) + avis approuvés.
// Idempotent : peut être relancé.
// Usage: bun run prisma/seed-store-v2.ts
// ============================================================
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DEMO = {
  slug: "teranga",
  name: "Boutique Téranga",
  ownerName: "Awa Diop",
  ownerEmail: "awa.teranga@yonukom.demo",
  ownerPhone: "221783821822",
  businessName: "Boutique Téranga",
  businessEmail: "awa.teranga@yonukom.demo",
  businessPhone: "+221783821822",
};

const PRODUCTS = [
  { name: "Thiebou Djen", salePrice: 2500, category: "Plats", featured: true, promo: true, desc: "Le plat national sénégalais : riz au poisson, légumes et sauce rouge." },
  { name: "Yassa Poulet", salePrice: 2000, category: "Plats", featured: true, promo: false, desc: "Poulet mariné à l'oignon, riz parfumé. Un classique de Dakar." },
  { name: "Mafé", salePrice: 2000, category: "Plats", featured: true, promo: false, desc: "Ragoût d'arachide fondant, viande ou poulet, accompagné de riz." },
  { name: "Bissap", salePrice: 500, category: "Boissons", featured: false, promo: false, desc: "Jus d'hibiscus frais, frais et acidulé." },
  { name: "Attiéké Poisson", salePrice: 1500, category: "Plats", featured: false, promo: false, desc: "Semoule de manioc, poisson grillé, oignons et tomates." },
  { name: "Domoda", salePrice: 2000, category: "Plats", featured: false, promo: true, desc: "Ragoût d'arachide à la viande, riz blanc." },
  { name: "Soupe Kandia", salePrice: 2200, category: "Plats", featured: false, promo: false, desc: "Soupe gombo épaisse au poisson fumé." },
  { name: "Boulettes de Poisson", salePrice: 1800, category: "Entrées", featured: true, promo: false, desc: "Boulettes moelleuses, sauce tomate épicée." },
];

const REVIEWS = [
  { name: "Awa Diop", rating: 5, comment: "Produits frais et livraison rapide à Dakar. Je recommande à 100% !" },
  { name: "Moussa Ndiaye", rating: 4, comment: "Très bon service, les prix sont corrects et le thiebou est délicieux." },
  { name: "Fatou Sarr", rating: 5, comment: "Le thiebou djen est excellent, comme celui de ma grand-mère. Bravo !" },
];

async function main() {
  // 1. Upsert tenant démo
  let tenant = await db.tenant.findUnique({ where: { storeSlug: DEMO.slug } });

  if (!tenant) {
    tenant = await db.tenant.create({
      data: {
        name: DEMO.name,
        ownerName: DEMO.ownerName,
        ownerEmail: DEMO.ownerEmail,
        ownerPhone: DEMO.ownerPhone,
        businessType: "restaurant",
        storeSlug: DEMO.slug,
        isStoreActive: true,
        storePrimaryColor: "#059669",
        allowPickup: true,
        allowDelivery: true,
        deliveryFee: 500,
      },
    });
    console.log(`✅ Tenant créé: ${tenant.name} (slug=${tenant.storeSlug})`);
  } else {
    // S'assurer que la boutique est active
    tenant = await db.tenant.update({
      where: { id: tenant.id },
      data: { isStoreActive: true, ownerPhone: DEMO.ownerPhone },
    });
    console.log(`✅ Tenant existant mis à jour: ${tenant.name}`);
  }

  // 2. Upsert Business lié au tenant
  let business = await db.business.findFirst({ where: { tenantId: tenant.id } });
  if (!business) {
    business = await db.business.create({
      data: {
        name: DEMO.businessName,
        type: "restaurant",
        phone: DEMO.businessPhone,
        email: DEMO.businessEmail,
        city: "Dakar",
        currency: "XOF",
        tenantId: tenant.id,
        onboardingCompleted: true,
      },
    });
    console.log(`✅ Business créé: ${business.name}`);
  } else {
    console.log(`✅ Business existant: ${business.name}`);
  }

  // 3. Produits (upsert par name + businessId)
  const createdProducts: { id: string; name: string }[] = [];
  for (const p of PRODUCTS) {
    let product = await db.product.findFirst({
      where: { name: p.name, businessId: business.id },
    });
    if (!product) {
      product = await db.product.create({
        data: {
          name: p.name,
          salePrice: p.salePrice,
          category: p.category,
          description: p.desc,
          businessId: business.id,
          quantity: 50,
          minStockAlert: 5,
          isActive: true,
          isFeatured: p.featured,
          compareAtPrice: p.promo ? Math.round(p.salePrice * 1.25) : null,
        },
      });
    } else {
      product = await db.product.update({
        where: { id: product.id },
        data: {
          isFeatured: p.featured,
          compareAtPrice: p.promo ? Math.round(p.salePrice * 1.25) : null,
          description: p.desc,
          salePrice: p.salePrice,
          quantity: 50,
        },
      });
    }
    createdProducts.push({ id: product.id, name: product.name });
  }
  console.log(`✅ ${createdProducts.length} produits prêts (${createdProducts.filter((p) => PRODUCTS.find((d) => d.name === p.name)?.featured).length} vedettes)`);

  // 4. Avis approuvés (sur la boutique + sur le 1er produit)
  const existingReviews = await db.review.count({ where: { tenantId: tenant.id } });
  if (existingReviews === 0) {
    for (const r of REVIEWS) {
      await db.review.create({
        data: {
          tenantId: tenant.id,
          productId: null,
          customerName: r.name,
          rating: r.rating,
          comment: r.comment,
          isApproved: true,
        },
      });
    }
    // Avis sur le premier produit (vedette)
    if (createdProducts[0]) {
      await db.review.create({
        data: {
          tenantId: tenant.id,
          productId: createdProducts[0].id,
          customerName: "Ibrahima Fall",
          rating: 5,
          comment: "Qualité au top, je commande toutes les semaines. Livraison nickel.",
          isApproved: true,
        },
      });
    }
    console.log(`✅ 4 avis approuvés créés`);
  } else {
    console.log(`✅ ${existingReviews} avis déjà présents`);
  }

  // 5. Résumé
  const featuredCount = await db.product.count({
    where: { businessId: business.id, isFeatured: true },
  });
  const promoCount = await db.product.count({
    where: { businessId: business.id, compareAtPrice: { not: null } },
  });
  const reviewsCount = await db.review.count({
    where: { tenantId: tenant.id, isApproved: true },
  });
  console.log("\n📊 RÉSUMÉ DÉMO:");
  console.log(`   Slug boutique : ${tenant.storeSlug}`);
  console.log(`   URL publique  : /b/${tenant.storeSlug}`);
  console.log(`   Produits      : ${createdProducts.length}`);
  console.log(`   └ vedettes   : ${featuredCount}`);
  console.log(`   └ en promo   : ${promoCount}`);
  console.log(`   Avis approuvés: ${reviewsCount}`);
  console.log(`   WhatsApp      : ${tenant.ownerPhone}`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
