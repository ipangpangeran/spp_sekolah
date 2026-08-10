import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.pengaturan.findFirst({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.pengaturan.create({ data: { id: 1 } });
    }
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const settings = await prisma.pengaturan.upsert({
      where: { id: 1 },
      update: body,
      create: { id: 1, ...body },
    });
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
