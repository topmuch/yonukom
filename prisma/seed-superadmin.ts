// ============================================================
// YonuKom — Seed Script for Superadmin Dashboard
// Creates demo data with Senegalese names and businesses
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding YonuKom superadmin demo data...\n');

  // ── Clean existing data (order matters for foreign keys) ──
  console.log('🧹 Cleaning existing data...');
  await prisma.subscriptionPayment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.platformLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany({ where: { role: 'superadmin' } });
  await prisma.business.deleteMany({ where: { tenantId: { not: null } } });
  await prisma.tenant.deleteMany();
  console.log('  ✓ Cleaned\n');

  // ── 1. Create Tenants ──
  console.log('🏢 Creating Tenants...');

  const tenantsData = [
    {
      name: 'Boutique Fatou',
      ownerName: 'Fatou Ndiaye',
      ownerEmail: 'fatou.ndiaye@boutiquefatou.sn',
      ownerPhone: '+221 77 123 45 67',
      businessType: 'retail_shop',
      config: JSON.stringify({ ecommerce_social: true, restaurant: false, payments: ['wave', 'cash'] }),
    },
    {
      name: 'Restaurant Le Thiossane',
      ownerName: 'Cheikh Diop',
      ownerEmail: 'cheikh.diop@thiossane.sn',
      ownerPhone: '+221 76 234 56 78',
      businessType: 'restaurant',
      config: JSON.stringify({ restaurant: true, ecommerce_social: false, payments: ['wave', 'orange_money', 'cash'] }),
    },
    {
      name: 'Diallo Fruits & Légumes',
      ownerName: 'Aminata Diallo',
      ownerEmail: 'aminata.diallo@fruitslegumes.sn',
      ownerPhone: '+221 78 345 67 89',
      businessType: 'wholesaler',
      config: JSON.stringify({ pipeline_b2b: true, payments: ['virement', 'cheque'] }),
    },
    {
      name: "Mama's Shop TikTok",
      ownerName: 'Awa Sow',
      ownerEmail: 'awa.sow@mamasshop.sn',
      ownerPhone: '+221 77 456 78 90',
      businessType: 'tiktok_seller',
      config: JSON.stringify({ ecommerce_social: true, payments: ['wave', 'orange_money'] }),
    },
    {
      name: 'Keur Magui Live',
      ownerName: 'Maguette Ba',
      ownerEmail: 'maguette.ba@keurmagui.sn',
      ownerPhone: '+221 76 567 89 01',
      businessType: 'ecommerce_social',
      config: JSON.stringify({ ecommerce_social: true, payments: ['wave', 'cash'] }),
    },
    {
      name: 'Supermarché HLM',
      ownerName: 'Oumar Sy',
      ownerEmail: 'oumar.sy@supermarchehlm.sn',
      ownerPhone: '+221 78 678 90 12',
      businessType: 'retail_shop',
      config: JSON.stringify({ ecommerce_social: true, pipeline_b2b: true, payments: ['wave', 'orange_money', 'cash', 'cb'] }),
    },
    {
      name: 'Traiteur Mariama',
      ownerName: 'Mariama Fall',
      ownerEmail: 'mariama.fall@traiteur.sn',
      ownerPhone: '+221 77 789 01 23',
      businessType: 'restaurant',
      config: JSON.stringify({ restaurant: true, ecommerce_social: true, payments: ['wave', 'orange_money', 'cash'] }),
    },
    {
      name: 'Grossiste Sandaga',
      ownerName: 'Mamadou Bâ',
      ownerEmail: 'mamadou.ba@sandaga.sn',
      ownerPhone: '+221 76 890 12 34',
      businessType: 'wholesaler',
      config: JSON.stringify({ pipeline_b2b: true, ecommerce_social: false, payments: ['virement', 'cheque', 'cash'] }),
    },
  ];

  const tenants: any[] = [];
  for (const data of tenantsData) {
    const tenant = await prisma.tenant.create({ data });
    tenants.push(tenant);
    console.log(`  ✓ ${tenant.name} (${tenant.businessType})`);
  }
  console.log();

  // ── 2. Create Subscriptions ──
  console.log('💳 Creating Subscriptions...');

  const now = new Date();
  const daysFromNow = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };
  const daysAgo = (days: number) => daysFromNow(-days);

  const subscriptionsData = [
    // Boutique Fatou — pro, active
    { tenantIdx: 0, plan: 'pro', status: 'active', amount: 15000, periodStart: daysAgo(15), periodEnd: daysFromNow(15), paymentMethod: 'wave', lastPayment: daysAgo(15), nextBilling: daysFromNow(15) },
    // Restaurant Le Thiossane — enterprise, active
    { tenantIdx: 1, plan: 'enterprise', status: 'active', amount: 35000, periodStart: daysAgo(20), periodEnd: daysFromNow(10), paymentMethod: 'orange_money', lastPayment: daysAgo(20), nextBilling: daysFromNow(10) },
    // Diallo Fruits & Légumes — pro, expired
    { tenantIdx: 2, plan: 'pro', status: 'expired', amount: 15000, periodStart: daysAgo(45), periodEnd: daysAgo(15), paymentMethod: 'bank_transfer', lastPayment: daysAgo(45), nextBilling: daysAgo(15) },
    // Mama's Shop TikTok — starter, active
    { tenantIdx: 3, plan: 'starter', status: 'active', amount: 5000, periodStart: daysAgo(5), periodEnd: daysFromNow(25), paymentMethod: 'wave', lastPayment: daysAgo(5), nextBilling: daysFromNow(25) },
    // Keur Magui Live — pro, past_due
    { tenantIdx: 4, plan: 'pro', status: 'past_due', amount: 15000, periodStart: daysAgo(32), periodEnd: daysAgo(2), paymentMethod: 'orange_money', lastPayment: daysAgo(62), nextBilling: daysAgo(2) },
    // Supermarché HLM — enterprise, active
    { tenantIdx: 5, plan: 'enterprise', status: 'active', amount: 35000, periodStart: daysAgo(10), periodEnd: daysFromNow(20), paymentMethod: 'bank_transfer', lastPayment: daysAgo(10), nextBilling: daysFromNow(20) },
    // Traiteur Mariama — starter, cancelled
    { tenantIdx: 6, plan: 'starter', status: 'cancelled', amount: 5000, periodStart: daysAgo(60), periodEnd: daysAgo(30), paymentMethod: 'cash', lastPayment: daysAgo(60), nextBilling: null },
    // Grossiste Sandaga — pro, active
    { tenantIdx: 7, plan: 'pro', status: 'active', amount: 15000, periodStart: daysAgo(8), periodEnd: daysFromNow(22), paymentMethod: 'wave', lastPayment: daysAgo(8), nextBilling: daysFromNow(22) },
  ];

  const subscriptions: any[] = [];
  for (const s of subscriptionsData) {
    const sub = await prisma.subscription.create({
      data: {
        tenantId: tenants[s.tenantIdx].id,
        plan: s.plan,
        status: s.status,
        amount: s.amount,
        currentPeriodStart: s.periodStart,
        currentPeriodEnd: s.periodEnd,
        paymentMethod: s.paymentMethod,
        lastPaymentDate: s.lastPayment,
        nextBillingDate: s.nextBilling,
      },
    });
    subscriptions.push(sub);
    console.log(`  ✓ ${tenants[s.tenantIdx].name} → ${s.plan} / ${s.status} (${s.amount} FCFA)`);
  }
  console.log();

  // ── 3. Create SubscriptionPayment records ──
  console.log('💰 Creating Subscription Payments...');

  const paymentsData = [
    // Boutique Fatou — 2 payments
    { subIdx: 0, amount: 15000, method: 'wave', ref: 'WAV-2025-FAT-001', date: daysAgo(15), status: 'completed' },
    { subIdx: 0, amount: 15000, method: 'wave', ref: 'WAV-2025-FAT-002', date: daysAgo(45), status: 'completed' },
    // Restaurant Le Thiossane — 3 payments
    { subIdx: 1, amount: 35000, method: 'orange_money', ref: 'OM-2025-THI-001', date: daysAgo(20), status: 'completed' },
    { subIdx: 1, amount: 35000, method: 'orange_money', ref: 'OM-2025-THI-002', date: daysAgo(50), status: 'completed' },
    { subIdx: 1, amount: 35000, method: 'orange_money', ref: 'OM-2025-THI-003', date: daysAgo(80), status: 'completed' },
    // Diallo Fruits — 2 payments (then expired)
    { subIdx: 2, amount: 15000, method: 'bank_transfer', ref: 'VIR-2025-DIA-001', date: daysAgo(45), status: 'completed' },
    { subIdx: 2, amount: 15000, method: 'bank_transfer', ref: 'VIR-2025-DIA-002', date: daysAgo(75), status: 'completed' },
    // Mama's Shop TikTok — 1 payment
    { subIdx: 3, amount: 5000, method: 'wave', ref: 'WAV-2025-MAMA-001', date: daysAgo(5), status: 'completed' },
    // Keur Magui Live — 1 completed, 1 failed (past_due)
    { subIdx: 4, amount: 15000, method: 'orange_money', ref: 'OM-2025-MAG-001', date: daysAgo(62), status: 'completed' },
    { subIdx: 4, amount: 15000, method: 'orange_money', ref: 'OM-2025-MAG-002', date: daysAgo(2), status: 'failed' },
    // Supermarché HLM — 2 payments
    { subIdx: 5, amount: 35000, method: 'bank_transfer', ref: 'VIR-2025-HLM-001', date: daysAgo(10), status: 'completed' },
    { subIdx: 5, amount: 35000, method: 'bank_transfer', ref: 'VIR-2025-HLM-002', date: daysAgo(40), status: 'completed' },
    // Traiteur Mariama — 2 payments (then cancelled)
    { subIdx: 6, amount: 5000, method: 'cash', ref: 'CASH-2025-MAR-001', date: daysAgo(60), status: 'completed' },
    { subIdx: 6, amount: 5000, method: 'cash', ref: 'CASH-2025-MAR-002', date: daysAgo(90), status: 'completed' },
    // Grossiste Sandaga — 2 payments
    { subIdx: 7, amount: 15000, method: 'wave', ref: 'WAV-2025-SAN-001', date: daysAgo(8), status: 'completed' },
    { subIdx: 7, amount: 15000, method: 'wave', ref: 'WAV-2025-SAN-002', date: daysAgo(38), status: 'completed' },
  ];

  for (const p of paymentsData) {
    const payment = await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscriptions[p.subIdx].id,
        amount: p.amount,
        paymentMethod: p.method,
        reference: p.ref,
        paymentDate: p.date,
        status: p.status,
      },
    });
    console.log(`  ✓ ${p.ref} → ${p.method} ${p.amount} FCFA (${p.status})`);
  }
  console.log();

  // ── 4. Create PlatformLog entries ──
  console.log('📋 Creating Platform Logs...');

  const logsData = [
    { level: 'info', category: 'payment', message: 'Paiement Wave reçu pour Boutique Fatou — 15 000 FCFA', metadata: JSON.stringify({ tenantId: tenants[0].id, amount: 15000, method: 'wave' }), date: daysAgo(15) },
    { level: 'info', category: 'payment', message: 'Paiement Orange Money reçu pour Restaurant Le Thiossane — 35 000 FCFA', metadata: JSON.stringify({ tenantId: tenants[1].id, amount: 35000, method: 'orange_money' }), date: daysAgo(20) },
    { level: 'warning', category: 'payment', message: 'Abonnement expiré pour Diallo Fruits & Légumes', metadata: JSON.stringify({ tenantId: tenants[2].id, plan: 'pro' }), date: daysAgo(15) },
    { level: 'error', category: 'payment', message: 'Échec paiement Orange Money pour Keur Magui Live — solde insuffisant', metadata: JSON.stringify({ tenantId: tenants[4].id, amount: 15000, method: 'orange_money', error: 'insufficient_balance' }), date: daysAgo(2) },
    { level: 'critical', category: 'api', message: 'Rate limit dépassé — API YonuKom pour Grossiste Sandaga', metadata: JSON.stringify({ tenantId: tenants[7].id, limit: '1000/min', current: '1247/min' }), date: daysAgo(1) },
    { level: 'info', category: 'user_action', message: 'Superadmin connecté au dashboard', metadata: JSON.stringify({ email: 'admin@yonukom.sn' }), date: daysAgo(0) },
    { level: 'info', category: 'tenant_change', message: 'Nouveau tenant inscrit : Mama\'s Shop TikTok', metadata: JSON.stringify({ tenantId: tenants[3].id, businessType: 'tiktok_seller' }), date: daysAgo(5) },
    { level: 'warning', category: 'sync', message: 'Synchronisation retardée — 12 éléments en attente pour Supermarché HLM', metadata: JSON.stringify({ tenantId: tenants[5].id, pendingItems: 12 }), date: daysAgo(3) },
    { level: 'info', category: 'impersonation', message: 'Superadmin a impersonné le tenant Traiteur Mariama', metadata: JSON.stringify({ tenantId: tenants[6].id, adminEmail: 'admin@yonukom.sn' }), date: daysAgo(7) },
    { level: 'error', category: 'api', message: 'Erreur webhook Wave — timeout après 30s', metadata: JSON.stringify({ webhook: 'wave_payment', timeout: 30000 }), date: daysAgo(2) },
    { level: 'info', category: 'payment', message: 'Paiement Wave reçu pour Grossiste Sandaga — 15 000 FCFA', metadata: JSON.stringify({ tenantId: tenants[7].id, amount: 15000, method: 'wave' }), date: daysAgo(8) },
    { level: 'warning', category: 'payment', message: 'Abonnement past_due pour Keur Magui Live — relance envoyée', metadata: JSON.stringify({ tenantId: tenants[4].id, plan: 'pro', reminderCount: 2 }), date: daysAgo(1) },
    { level: 'info', category: 'user_action', message: 'Configuration onboarding mise à jour pour Supermarché HLM', metadata: JSON.stringify({ tenantId: tenants[5].id, modules: ['ecommerce_social', 'pipeline_b2b'] }), date: daysAgo(4) },
    { level: 'critical', category: 'payment', message: 'Paiement en double détecté — Boutique Fatou — investigation requise', metadata: JSON.stringify({ tenantId: tenants[0].id, amount: 15000, reference: 'WAV-2025-FAT-001' }), date: daysAgo(1) },
  ];

  for (const log of logsData) {
    await prisma.platformLog.create({
      data: {
        level: log.level,
        category: log.category,
        message: log.message,
        metadata: log.metadata,
        createdAt: log.date,
      },
    });
  }
  console.log(`  ✓ ${logsData.length} platform logs created\n`);

  // ── 5. Create Superadmin User ──
  console.log('👤 Creating Superadmin User...');

  const superadmin = await prisma.user.upsert({
    where: { email: 'admin@yonukom.sn' },
    update: {},
    create: {
      email: 'admin@yonukom.sn',
      name: 'Super Admin YonuKom',
      phone: '+221 77 000 00 00',
      password: '$2b$10$dummyhashforsuperadmin1234567890abcdef', // Placeholder — replace with real bcrypt in production
      role: 'superadmin',
      isActive: true,
    },
  });
  console.log(`  ✓ ${superadmin.name} (${superadmin.email})\n`);

  // ── Summary ──
  console.log('═══════════════════════════════════════════════════');
  console.log('  ✅ Seed completed successfully!');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Tenants:                ${tenants.length}`);
  console.log(`  Subscriptions:          ${subscriptions.length}`);
  console.log(`  Subscription Payments:  ${paymentsData.length}`);
  console.log(`  Platform Logs:          ${logsData.length}`);
  console.log(`  Superadmin User:        1`);
  console.log('═══════════════════════════════════════════════════\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
