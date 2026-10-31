import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================
// YonuKom — API Rendez-vous / Planning (salons, instituts)
// GET  /api/appointments?businessId=xxx&from=ISO&to=ISO
// POST /api/appointments — crée un RDV
// ============================================================

// GET — liste les RDV d'un business (filtrables par plage de dates)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const from = searchParams.get("from"); // ISO date
    const to = searchParams.get("to"); // ISO date
    const status = searchParams.get("status");

    if (!businessId) {
      return NextResponse.json({ error: "businessId requis" }, { status: 400 });
    }

    const where: { businessId: string; startTime?: { gte?: Date; lte?: Date }; status?: string } = {
      businessId,
    };
    if (from || to) {
      where.startTime = {};
      if (from) where.startTime.gte = new Date(from);
      if (to) where.startTime.lte = new Date(to);
    }
    if (status) where.status = status;

    const appointments = await db.appointment.findMany({
      where,
      orderBy: { startTime: "asc" },
      take: 200,
      include: {
        service: { select: { id: true, name: true, salePrice: true, duration: true, imageUrl: true } },
      },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("[GET /api/appointments] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — crée un nouveau rendez-vous
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      customerId,
      customerName,
      customerPhone,
      serviceId,
      serviceName,
      durationMin,
      startTime,
      notes,
    } = body as {
      businessId?: string;
      customerId?: string;
      customerName?: string;
      customerPhone?: string;
      serviceId?: string;
      serviceName?: string;
      durationMin?: number;
      startTime?: string;
      notes?: string;
    };

    if (!businessId) {
      return NextResponse.json({ error: "businessId requis" }, { status: 400 });
    }
    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: "Le nom du client est requis" }, { status: 400 });
    }
    if (!startTime) {
      return NextResponse.json({ error: "La date/heure de début est requise" }, { status: 400 });
    }

    // Vérifier que le business existe
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Commerce introuvable" }, { status: 404 });
    }

    // Si serviceId fourni, récupérer le nom + durée du service (snapshot)
    let resolvedServiceName = serviceName || "";
    let resolvedDuration = Number(durationMin) || 30;
    if (serviceId) {
      const service = await db.product.findFirst({
        where: { id: serviceId, businessId },
        select: { id: true, name: true, duration: true, itemType: true },
      });
      if (service) {
        resolvedServiceName = service.name;
        if (service.duration && !durationMin) {
          resolvedDuration = service.duration;
        }
      }
    }
    if (!resolvedServiceName) {
      resolvedServiceName = serviceName || "Rendez-vous";
    }

    // Si customerId fourni, vérifier qu'il appartient au business
    let resolvedCustomerId: string | null = null;
    if (customerId) {
      const customer = await db.customer.findFirst({
        where: { id: customerId, businessId },
        select: { id: true },
      });
      if (customer) resolvedCustomerId = customer.id;
    }

    const appointment = await db.appointment.create({
      data: {
        businessId,
        customerId: resolvedCustomerId,
        customerName: customerName.trim().slice(0, 100),
        customerPhone: customerPhone ? String(customerPhone).slice(0, 20) : null,
        serviceId: serviceId || null,
        serviceName: resolvedServiceName.slice(0, 200),
        durationMin: Math.max(5, Math.min(480, resolvedDuration)), // 5min à 8h
        startTime: new Date(startTime),
        status: "pending",
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("[POST /api/appointments] error:", error);
    return NextResponse.json({ error: "Échec de la création du rendez-vous" }, { status: 500 });
  }
}
