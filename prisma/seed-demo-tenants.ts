// ============================================================
// YonuKom — Seed Script: Demo Tenants + Demo Users
// ------------------------------------------------------------
// Crée un tenant démo "Boutique Démo YonuKom" + business +
// 3 utilisateurs (patron / gerant / vendeur) avec mot de passe
// "yonukom123" haché en bcrypt RÉEL, afin que les boutons démo
// de l'écran de connexion (login-screen.tsx) fonctionnent
// côté serveur (/api/auth/login).
//
// Idempotent : peut être relancé sans dupliquer les données.
// Usage: bun run prisma/seed-demo-tenants.ts
// ============================================================
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// --- Données démo ------------------------------------------------------
const DEMO = {
  slug: "demo-yonukom",
  tenantName: "Boutique Démo YonuKom",
  ownerName: "Ibrahima Fall",
  ownerEmail: "ibrahima@yonukom.sn",
  ownerPhone: "221783821822",
  businessType: "mixte" as const,
  // Mot de passe partagé par les 4 comptes démo affichés sur la
  // page de connexion (admin + 3 users de ce script).
  password: "yonukom123",
  businessName: "Boutique Démo YonuKom",
  businessPhone: "+221783821822",
  businessCity: "Dakar",
};

// Configuration des modules (shape simplifiée mais valide pour
// Business.onboardingConfig — cf. schema.prisma comment + types/onboarding.ts).
const DEMO_ONBOARDING_CONFIG = JSON.stringify({
  ecommerce_social: true,
  pipeline_b2b: false,
  restaurant: true,
  payments: ["wave", "orange_money", "cash"],
});

// --- 3 utilisateurs démo (patron / gerant / vendeur) ------------------
const DEMO_USERS = [
  {
    email: "ibrahima@yonukom.sn",
    name: "Ibrahima Fall",
    role: "patron",
    phone: "+221783821822",
  },
  {
    email: "mamadou@yonukom.sn",
    name: "Mamadou Diallo",
    role: "gerant",
    phone: "+221771234567",
  },
  {
    email: "fatou@yonukom.sn",
    name: "Fatou Sow",
    role: "vendeur",
    phone: "+221761234567",
  },
] as const;

// --- ~6 produits démo --------------------------------------------------
const DEMO_PRODUCTS = [
  {
    name: "Thiébou Djen",
    salePrice: 2500,
    category: "Plats",
    quantity: 50,
    featured: true,
    description: "Plat national sénégalais : riz cassé, poisson frais, légumes et sauce tomate.",
  },
  {
    name: "Yassa Poulet",
    salePrice: 2000,
    category: "Plats",
    quantity: 40,
    featured: true,
    description: "Poulet mariné à l'oignon caramélisé, riz parfumé et citron.",
  },
  {
    name: "Mafé",
    salePrice: 2000,
    category: "Plats",
    quantity: 35,
    featured: false,
    description: "Ragoût d'arachide crémeux à la viande, accompagné de riz blanc.",
  },
  {
    name: "Bissap",
    salePrice: 500,
    category: "Boissons",
    quantity: 80,
    featured: false,
    description: "Jus d'hibiscus frais, servi bien frais. Boisson emblématique du Sénégal.",
  },
  {
    name: "Attiéké Poisson",
    salePrice: 1500,
    category: "Plats",
    quantity: 30,
    featured: false,
    description: "Semoule de manioc, poisson grillé, oignons et tomates fraîches.",
  },
  {
    name: "Riz 25kg",
    salePrice: 12500,
    category: "Épicerie",
    quantity: 20,
    featured: false,
    description: "Sac de riz cassé 25 kg — qualité supérieure, idéal pour famille ou revente.",
  },
] as const;

async function main() {
  console.log("🌱 Seeding YonuKom demo tenant + demo users...\n");

  // 1. Hash bcrypt réel (10 rounds) — partagé par les 3 utilisateurs démo.
  const hashedPassword = await bcrypt.hash(DEMO.password, 10);

  // ── 1. Tenant démo ──
  console.log("🏢 Creating demo Tenant...");
  let tenant = await db.tenant.findUnique({
    where: { ownerEmail: DEMO.ownerEmail },
  });
  if (!tenant) {
    // Sécurité : si l'email a changé mais le nom existe déjà, on récupère via le nom.
    tenant = (await db.tenant.findFirst({ where: { name: DEMO.tenantName } })) ?? null;
  }

  const tenantData = {
    name: DEMO.tenantName,
    ownerName: DEMO.ownerName,
    ownerEmail: DEMO.ownerEmail,
    ownerPhone: DEMO.ownerPhone,
    businessType: DEMO.businessType,
    storeSlug: DEMO.slug,
    isStoreActive: true,
    config: DEMO_ONBOARDING_CONFIG,
  };

  if (!tenant) {
    tenant = await db.tenant.create({ data: tenantData });
    console.log(`  ✓ Tenant créé : ${tenant.name} (slug=${tenant.storeSlug})`);
  } else {
    tenant = await db.tenant.update({
      where: { id: tenant.id },
      data: tenantData,
    });
    console.log(`  ✓ Tenant existant mis à jour : ${tenant.name} (slug=${tenant.storeSlug})`);
  }

  // ── 2. Business démo (lié au tenant) ──
  console.log("\n🏬 Creating demo Business...");
  let business = await db.business.findFirst({ where: { tenantId: tenant.id } });
  const businessData = {
    name: DEMO.businessName,
    type: DEMO.businessType,
    phone: DEMO.businessPhone,
    email: DEMO.ownerEmail,
    city: DEMO.businessCity,
    country: "SN",
    currency: "XOF",
    tenantId: tenant.id,
    onboardingCompleted: true,
    onboardingConfig: DEMO_ONBOARDING_CONFIG,
  };
  if (!business) {
    business = await db.business.create({ data: businessData });
    console.log(`  ✓ Business créé : ${business.name} (id=${business.id})`);
  } else {
    business = await db.business.update({ where: { id: business.id }, data: businessData });
    console.log(`  ✓ Business existant mis à jour : ${business.name} (id=${business.id})`);
  }

  // ── 3. Utilisateurs démo (patron / gerant / vendeur) ──
  console.log("\n👤 Creating demo users (patron / gerant / vendeur)...");
  const createdUsers: { id: string; email: string; role: string }[] = [];
  for (const u of DEMO_USERS) {
    const existing = await db.user.findUnique({ where: { email: u.email } });
    const userData = {
      email: u.email,
      name: u.name,
      phone: u.phone,
      password: hashedPassword,
      role: u.role,
      isActive: true,
      businessId: business.id,
      tenantId: tenant.id,
    };
    let user: { id: string; email: string; role: string };
    if (existing) {
      user = await db.user.update({ where: { id: existing.id }, data: userData });
      console.log(`  ✓ User mis à jour : ${user.email} (${user.role})`);
    } else {
      user = await db.user.create({ data: userData });
      console.log(`  ✓ User créé : ${user.email} (${user.role})`);
    }
    createdUsers.push(user);
  }

  // ── 4. Abonnement "pro" actif pour 365 jours ──
  console.log("\n💳 Creating/updating demo subscription (plan pro, 365 jours)...");
  const now = new Date();
  const inOneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const subscription = await db.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {
      plan: "pro",
      status: "active",
      amount: 25000,
      currentPeriodStart: now,
      currentPeriodEnd: inOneYear,
      billingPeriod: "annual",
    },
    create: {
      tenantId: tenant.id,
      plan: "pro",
      status: "active",
      amount: 25000,
      billingPeriod: "annual",
      currentPeriodStart: now,
      currentPeriodEnd: inOneYear,
    },
  });
  console.log(
    `  ✓ Subscription : plan=${subscription.plan}, status=${subscription.status}, ` +
      `amount=${subscription.amount} FCFA, fin=${subscription.currentPeriodEnd.toISOString().slice(0, 10)}`,
  );

  // ── 5. Produits démo (~6) ──
  console.log("\n📦 Creating demo products...");
  const createdProducts: { id: string; name: string; featured: boolean }[] = [];
  for (const p of DEMO_PRODUCTS) {
    let product = await db.product.findFirst({
      where: { name: p.name, businessId: business.id },
    });
    if (!product) {
      product = await db.product.create({
        data: {
          name: p.name,
          salePrice: p.salePrice,
          purchasePrice: 0,
          category: p.category,
          description: p.description,
          businessId: business.id,
          quantity: p.quantity,
          minStockAlert: 5,
          isActive: true,
          isFeatured: p.featured,
          productType: p.category === "Plats" ? "plate_restaurant" : "standard",
          unitType: p.category === "Plats" ? "plat" : "piece",
        },
      });
      console.log(`  ✓ Produit créé : ${product.name} (${p.category}, ${p.salePrice} FCFA)`);
    } else {
      product = await db.product.update({
        where: { id: product.id },
        data: {
          salePrice: p.salePrice,
          category: p.category,
          description: p.description,
          quantity: p.quantity,
          isFeatured: p.featured,
          isActive: true,
        },
      });
      console.log(`  ✓ Produit existant mis à jour : ${product.name}`);
    }
    createdProducts.push({
      id: product.id,
      name: product.name,
      featured: product.isFeatured,
    });
  }

  // ── 6. Résumé ──
  const productCount = await db.product.count({ where: { businessId: business.id } });
  const featuredCount = createdProducts.filter((p) => p.featured).length;
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  ✅ Seed démo terminé avec succès !");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Tenant          : ${tenant.name}`);
  console.log(`  Tenant id       : ${tenant.id}`);
  console.log(`  Store slug      : ${tenant.storeSlug}`);
  console.log(`  URL publique    : /b/${tenant.storeSlug}`);
  console.log(`  Business id     : ${business.id}`);
  console.log(`  Business        : ${business.name} (${business.type})`);
  console.log(`  Subscription    : ${subscription.plan} / ${subscription.status} (${subscription.amount} FCFA)`);
  console.log("  ───────────────────────────────────────────────");
  console.log("  Comptes démo (password = yonukom123) :");
  console.log("    • admin@yonukom.sn      superadmin (créé par prisma/seed-superadmin.ts)");
  for (const u of createdUsers) {
    console.log(`    • ${u.email.padEnd(24)} ${u.role}`);
  }
  console.log("  ───────────────────────────────────────────────");
  console.log(`  Produits        : ${productCount} (${featuredCount} vedettes)`);
  console.log("═══════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed démo failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
