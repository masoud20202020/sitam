 'use server';
 
 import { prisma } from '@/lib/prisma';
 import { revalidatePath } from 'next/cache';
 
 export type ReviewItem = {
   id: string;
   productId: string;
   author: string;
   rating: number;
   ratingQuality?: number | null;
   ratingValue?: number | null;
   ratingPackaging?: number | null;
   content: string;
   status: 'pending' | 'approved' | 'rejected';
   helpfulUp: number;
   helpfulDown: number;
   reply?: string | null;
   replyAt?: Date | string | null;
   createdAt: Date | string;
   productName?: string | null;
 };
 
 export async function getReviewsAction(): Promise<{ success: boolean; data?: ReviewItem[]; error?: string }> {
   try {
     const reviews = await prisma.review.findMany({
       include: {
         product: {
           select: { name: true }
         },
       },
       orderBy: { createdAt: 'desc' },
     });
 
     const mapped: ReviewItem[] = reviews.map(r => ({
       id: r.id,
       productId: r.productId,
       author: r.author,
       rating: r.rating,
       ratingQuality: r.ratingQuality ?? null,
       ratingValue: r.ratingValue ?? null,
       ratingPackaging: r.ratingPackaging ?? null,
       content: r.content,
       status: r.status as 'pending' | 'approved' | 'rejected',
       helpfulUp: r.helpfulUp,
       helpfulDown: r.helpfulDown,
       reply: r.reply ?? null,
       replyAt: r.replyAt ?? null,
       createdAt: r.createdAt,
       productName: r.product?.name ?? null,
     }));
 
     return { success: true, data: mapped };
   } catch (error) {
     console.error('Error fetching reviews:', error);
     return { success: false, error: String(error) };
   }
 }
 
export async function getProductReviewsAction(productId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
    const mapped: ReviewItem[] = reviews.map(r => ({
      id: r.id,
      productId: r.productId,
      author: r.author,
      rating: r.rating,
      ratingQuality: r.ratingQuality ?? null,
      ratingValue: r.ratingValue ?? null,
      ratingPackaging: r.ratingPackaging ?? null,
      content: r.content,
      status: r.status as 'pending' | 'approved' | 'rejected',
      helpfulUp: r.helpfulUp,
      helpfulDown: r.helpfulDown,
      reply: r.reply ?? null,
      replyAt: r.replyAt ?? null,
      createdAt: r.createdAt,
      productName: null,
    }));
    return { success: true, data: mapped };
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return { success: false, error: String(error) };
  }
}

export async function addReviewAction(input: {
  productId: string;
  author: string;
  rating: number;
  ratingQuality?: number;
  ratingValue?: number;
  ratingPackaging?: number;
  content: string;
  status?: 'pending' | 'approved' | 'rejected';
}) {
  try {
    const avg = Math.round((((input.ratingQuality ?? input.rating) + (input.ratingValue ?? input.rating) + (input.ratingPackaging ?? input.rating)) / 3) * 10) / 10;
    const created = await prisma.review.create({
      data: {
        productId: input.productId,
        author: input.author,
        rating: Math.max(1, Math.min(5, Number(avg) || 5)),
        ratingQuality: Math.max(1, Math.min(5, Number(input.ratingQuality ?? input.rating) || 5)),
        ratingValue: Math.max(1, Math.min(5, Number(input.ratingValue ?? input.rating) || 5)),
        ratingPackaging: Math.max(1, Math.min(5, Number(input.ratingPackaging ?? input.rating) || 5)),
        content: input.content,
        status: input.status ?? 'pending',
        helpfulUp: 0,
        helpfulDown: 0,
      },
    });
    revalidatePath('/product');
    return { success: true, data: created };
  } catch (error) {
    console.error('Error adding review:', error);
    return { success: false, error: String(error) };
  }
}

 export async function updateReviewStatusAction(id: string, status: 'pending' | 'approved' | 'rejected') {
   try {
     const updated = await prisma.review.update({
       where: { id },
       data: { status },
     });
     revalidatePath('/admin/reviews');
     return { success: true, data: updated };
   } catch (error) {
     console.error('Error updating review status:', error);
     return { success: false, error: String(error) };
   }
 }
 
 export async function deleteReviewAction(id: string) {
   try {
     await prisma.review.delete({
       where: { id },
     });
     revalidatePath('/admin/reviews');
     return { success: true };
   } catch (error) {
     console.error('Error deleting review:', error);
     return { success: false, error: String(error) };
   }
 }
 
 export async function replyToReviewAction(id: string, reply: string) {
   try {
     const updated = await prisma.review.update({
       where: { id },
       data: {
         reply,
         replyAt: new Date(),
       },
     });
     revalidatePath('/admin/reviews');
     return { success: true, data: updated };
   } catch (error) {
     console.error('Error replying to review:', error);
     return { success: false, error: String(error) };
   }
 }

export async function voteHelpfulAction(id: string, up: boolean) {
  try {
    const updated = await prisma.review.update({
      where: { id },
      data: up
        ? { helpfulUp: { increment: 1 } }
        : { helpfulDown: { increment: 1 } },
    });
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error voting helpful:', error);
    return { success: false, error: String(error) };
  }
}
