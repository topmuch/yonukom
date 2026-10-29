import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/customers?businessId=xxx&search=yyy
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const search = searchParams.get('search')

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId query parameter is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = {
      businessId,
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST /api/customers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, businessId, email, address, paymentMethod, isB2B, creditLimit, favoriteProductIds } = body

    if (!name || !phone || !businessId) {
      return NextResponse.json(
        { error: 'name, phone, and businessId are required' },
        { status: 400 }
      )
    }

    const customer = await db.customer.create({
      data: {
        name,
        phone,
        businessId,
        email: email || null,
        address: address || null,
        paymentMethod: paymentMethod || 'cash',
        isB2B: isB2B ?? false,
        creditLimit: creditLimit !== undefined ? Number(creditLimit) : null,
        favoriteProductIds: favoriteProductIds || null,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
