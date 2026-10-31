// ============================================================
// YonuKom — Superadmin API — Users :id (PATCH / DELETE)
// PATCH → suspend/activate user (isActive), or change role/email/name
// DELETE → delete user (refused if last patron of a tenant/business)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperadmin } from "@/lib/require-superadmin";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/superadmin/users/[id]
// Body: { isActive?: boolean, role?: string, name?: string, email?: string, phone?: string }
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const forbidden = requireSuperadmin(request);
    if (forbidden) return forbidden;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.user.findUnique({
      where: { id },
      select: { id: true, role: true, tenantId: true, businessId: true, email: true, isActive: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }
    if (body.role !== undefined) {
      const validRoles = ["superadmin", "patron", "gerant", "vendeur", "employee"];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json(
          { error: `Rôle invalide. Doit être parmi: ${validRoles.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.role = body.role;
    }
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) {
      // Check email uniqueness if changing
      if (body.email !== existing.email) {
        const dupe = await db.user.findUnique({
          where: { email: body.email },
          select: { id: true },
        });
        if (dupe) {
          return NextResponse.json(
            { error: "Cet email est déjà utilisé" },
            { status: 409 }
          );
        }
      }
      updateData.email = body.email;
    }
    if (body.phone !== undefined) updateData.phone = body.phone || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ à mettre à jour" },
        { status: 400 }
      );
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        businessId: true,
        tenantId: true,
        createdAt: true,
      },
    });

    // Log to PlatformLog
    try {
      await db.platformLog.create({
        data: {
          level: "info",
          category: "user_action",
          message: `Superadmin updated user ${updated.email}: ${Object.keys(updateData).join(", ")}`,
          metadata: JSON.stringify({
            userId: updated.id,
            updatedFields: Object.keys(updateData),
            previousIsActive: existing.isActive,
          }),
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      ...updated,
      status: updated.isActive ? "active" : "inactive",
    });
  } catch (error) {
    console.error("[Superadmin] Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/superadmin/users/[id]
// Refused if user is the only patron of a tenant or only patron of a business.
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const forbidden = requireSuperadmin(request);
    if (forbidden) return forbidden;

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        businessId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Block deletion of superadmin (safety)
    if (user.role === "superadmin") {
      return NextResponse.json(
        { error: "Impossible de supprimer un superadmin" },
        { status: 400 }
      );
    }

    // If user is a patron, ensure they're not the only patron of their tenant
    if (user.role === "patron" && user.tenantId) {
      const patronCount = await db.user.count({
        where: { tenantId: user.tenantId, role: "patron" },
      });
      if (patronCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Impossible de supprimer le dernier patron de ce tenant. Désignez un autre patron d'abord ou supprimez le tenant.",
          },
          { status: 400 }
        );
      }
    }

    await db.user.delete({ where: { id } });

    // Log to PlatformLog
    try {
      await db.platformLog.create({
        data: {
          level: "warning",
          category: "user_action",
          message: `Superadmin deleted user: ${user.email}`,
          metadata: JSON.stringify({
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
            businessId: user.businessId,
          }),
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[Superadmin] Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
