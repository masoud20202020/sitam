'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendAdminTicketNotification } from '@/lib/adminNotificationService';
import type { Ticket as NotifTicket } from '@/data/tickets';
import { getAdminNotificationSettingsAction, getSMSSettingsAction } from '@/app/actions/settings';
import { emitTicketsUpdate } from '@/lib/chatEvents';

export async function getTicketsAction() {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        messages: true,
        user: {
          select: {
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return { success: true, data: tickets };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function getUserTicketsAction(userId: string) {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId },
      include: {
        messages: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return { success: true, data: tickets };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function getTicketByIdAction(id: string) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        user: true
      }
    });
    return { success: true, data: ticket };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function createTicketAction(data: {
  userId?: string;
  subject: string;
  category?: string;
  priority?: string;
  message: string;
}) {
  try {
    const ticket = await prisma.ticket.create({
      data: {
        userId: data.userId,
        subject: data.subject,
        category: data.category,
        priority: data.priority || 'medium',
        messages: {
          create: {
            sender: 'user',
            content: data.message,
          }
        }
      },
      include: {
        messages: true,
        user: true
      }
    });

    // Send notification
    try {
      const [adminSettings, smsSettings] = await Promise.all([
        getAdminNotificationSettingsAction(),
        getSMSSettingsAction()
      ]);
      
      const notifTicket: NotifTicket = {
        id: Number((ticket as unknown as { id: string | number }).id) || Date.now(),
        name: (ticket as unknown as { user?: { name?: string | null } }).user?.name || 'کاربر',
        subject: (ticket as unknown as { subject?: string }).subject || '',
        status: 'open',
        priority: (ticket as unknown as { priority?: 'low' | 'medium' | 'high' }).priority || 'medium',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      await sendAdminTicketNotification(notifTicket, adminSettings, smsSettings);
    } catch (notifError: unknown) {
      console.error('Failed to send ticket notification:', notifError);
    }

    revalidatePath('/admin/tickets');
    emitTicketsUpdate(ticket.id);
    return { success: true, data: ticket };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function addMessageToTicketAction(ticketId: string, data: {
  sender: 'user' | 'admin';
  content: string;
  isInternal?: boolean;
  attachments?: string[];
}) {
  try {
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId,
        sender: data.sender,
        content: data.content,
        isInternal: data.isInternal || false,
        attachment: data.attachments && data.attachments.length > 0 ? data.attachments[0] : undefined,
      }
    });

    // Update ticket status/updatedAt
    const statusUpdate = data.sender === 'admin' ? { status: 'resolved' } : { status: 'open' };
    
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ...statusUpdate,
        updatedAt: new Date()
      }
    });

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath('/admin/tickets');
    emitTicketsUpdate(ticketId);
    return { success: true, data: message };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function updateTicketStatusAction(id: string, status: string) {
  try {
    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status }
    });
    revalidatePath('/admin/tickets');
    emitTicketsUpdate(id);
    return { success: true, data: ticket };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function deleteTicketAction(id: string) {
  try {
    await prisma.ticket.delete({
      where: { id }
    });
    revalidatePath('/admin/tickets');
    emitTicketsUpdate(id);
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}
