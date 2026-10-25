import { NextResponse } from "next/server";

const b2bCustomers = [
  {
    id: "b2b_1",
    name: "Boutique Amina",
    phone: "221771234567",
    isB2B: true,
    creditLimit: 500000,
    paymentMethod: "wave",
    totalOrders: 3,
    outstandingAmount: 127500,
  },
  {
    id: "b2b_2",
    name: "Épicerie Moussa",
    phone: "221782345678",
    isB2B: true,
    creditLimit: 300000,
    paymentMethod: "orange_money",
    totalOrders: 2,
    outstandingAmount: 47500,
  },
  {
    id: "b2b_3",
    name: "Restaurant Le Baobab",
    phone: "221763456789",
    isB2B: true,
    creditLimit: 1000000,
    paymentMethod: "virement",
    totalOrders: 5,
    outstandingAmount: 115000,
  },
  {
    id: "b2b_4",
    name: "Supermarché Keur Massar",
    phone: "221704567890",
    isB2B: true,
    creditLimit: 2000000,
    paymentMethod: "cheque",
    totalOrders: 8,
    outstandingAmount: 190000,
  },
  {
    id: "b2b_5",
    name: "Alimentation Cheikh",
    phone: "221775678901",
    isB2B: true,
    creditLimit: 400000,
    paymentMethod: "cash",
    totalOrders: 4,
    outstandingAmount: 0,
  },
  {
    id: "b2b_6",
    name: "Distributeur Sénégal",
    phone: "221786789012",
    isB2B: true,
    creditLimit: 5000000,
    paymentMethod: "virement",
    totalOrders: 12,
    outstandingAmount: 350000,
  },
];

export async function GET() {
  return NextResponse.json(b2bCustomers);
}
