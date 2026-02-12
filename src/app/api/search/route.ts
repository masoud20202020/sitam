
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizePersian(str: string): string {
  if (!str) return '';
  return str
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/آ/g, 'ا')
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/۰/g, '0')
    .replace(/۱/g, '1')
    .replace(/۲/g, '2')
    .replace(/۳/g, '3')
    .replace(/۴/g, '4')
    .replace(/۵/g, '5')
    .replace(/۶/g, '6')
    .replace(/۷/g, '7')
    .replace(/۸/g, '8')
    .replace(/۹/g, '9')
    .trim()
    .toLowerCase();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json([]);
  }

  const q = normalizePersian(query);

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { category: { is: { name: { contains: q } } } },
        { brand: { is: { name: { contains: q } } } },
        { slug: { contains: q } },
        { sku: { contains: q } },
      ],
      published: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      discountPrice: true,
      image: true,
      brand: {
        select: { name: true },
      },
    },
    take: 5,
    orderBy: { updatedAt: 'desc' },
  });

  const suggestions = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    basePrice: p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.basePrice,
    discountPrice: p.discountPrice && p.discountPrice > 0 ? p.discountPrice : undefined,
    image: p.image || undefined,
    brand: p.brand?.name || undefined,
  }));

  return NextResponse.json(suggestions);
}
