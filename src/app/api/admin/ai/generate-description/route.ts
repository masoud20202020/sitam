
import { NextResponse } from 'next/server';
import { AIService } from '@/lib/aiService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productName, features } = body;

    if (!productName || !features || !Array.isArray(features) || features.length === 0) {
      return NextResponse.json(
        { error: 'Product name and at least one feature are required.' },
        { status: 400 }
      );
    }

    const aiProvider = AIService.getProvider();
    const description = await aiProvider.generateProductDescription({
      productName,
      features,
      language: 'fa', // Default to Persian
      tone: 'professional' // Default tone
    });

    return NextResponse.json({ description });
  } catch (error) {
    console.error('API Error generating description:', error);
    return NextResponse.json(
      { error: 'Failed to generate description.' },
      { status: 500 }
    );
  }
}
