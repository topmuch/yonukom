import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await db.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/products/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existingProduct = await db.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'name', 'sku', 'description', 'category', 'categoryId', 'imageUrl',
      'purchasePrice', 'salePrice', 'quantity', 'reservedQuantity',
      'minStockAlert', 'productType', 'unitType', 'isActive',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Convert numeric fields
    if (updateData.purchasePrice !== undefined) {
      updateData.purchasePrice = Number(updateData.purchasePrice)
    }
    if (updateData.salePrice !== undefined) {
      updateData.salePrice = Number(updateData.salePrice)
    }
    if (updateData.quantity !== undefined) {
      updateData.quantity = Number(updateData.quantity)
    }
    if (updateData.reservedQuantity !== undefined) {
      updateData.reservedQuantity = Number(updateData.reservedQuantity)
    }
    if (updateData.minStockAlert !== undefined) {
      updateData.minStockAlert = Number(updateData.minStockAlert)
    }

    const product = await db.product.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/:id (soft delete — only patron or gerant)
// Requires ?businessId=xxx — validated against the product's businessId.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userRole = searchParams.get('userRole')
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId est requis' },
        { status: 400 }
      )
    }

    if (userRole !== 'patron' && userRole !== 'gerant') {
      return NextResponse.json(
        { error: 'Seul un patron ou gérant peut supprimer un produit' },
        { status: 403 }
      )
    }

    const existingProduct = await db.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produit introuvable' },
        { status: 404 }
      )
    }

    if (existingProduct.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Accès refusé : ce produit n\'appartient pas à votre business' },
        { status: 403 }
      )
    }

    const product = await db.product.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Échec de la suppression du produit' },
      { status: 500 }
    )
  }
}
