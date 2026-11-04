'use server';

import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';

export async function getNotificationsAction() {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  try {
    const notifications = await prisma.systemNotification.findMany({
      where: {
        workspaceId: access.workspaceId,
        OR: [
          { userId: access.userId },
          { userId: null } // System-wide workspace alerts
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const unreadCount = await prisma.systemNotification.count({
      where: {
        workspaceId: access.workspaceId,
        isRead: false,
        OR: [
          { userId: access.userId },
          { userId: null }
        ]
      }
    });

    return { success: true, notifications, unreadCount };
  } catch (error: any) {
    console.error('Failed to load notifications:', error);
    return { error: 'Failed to retrieve notifications.' };
  }
}

export async function markNotificationReadAction(notificationId: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  try {
    await prisma.systemNotification.updateMany({
      where: {
        id: notificationId,
        workspaceId: access.workspaceId
      },
      data: { isRead: true }
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to mark notification read:', error);
    return { error: 'Failed to update notification.' };
  }
}

export async function markAllNotificationsReadAction() {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  try {
    await prisma.systemNotification.updateMany({
      where: {
        workspaceId: access.workspaceId,
        isRead: false,
        OR: [
          { userId: access.userId },
          { userId: null }
        ]
      },
      data: { isRead: true }
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to mark all notifications read:', error);
    return { error: 'Failed to update notifications.' };
  }
}

export async function deleteNotificationAction(notificationId: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  try {
    await prisma.systemNotification.deleteMany({
      where: {
        id: notificationId,
        workspaceId: access.workspaceId
      }
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete notification:', error);
    return { error: 'Failed to delete notification.' };
  }
}

export async function updateNotificationPreferencesAction(smsAlerts: boolean, emailAlerts: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: 'Unauthorized.' };
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        smsAlertsMlsRelist: smsAlerts,
        emailAlertsMlsRelist: emailAlerts,
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update notification preferences:', error);
    return { error: 'Failed to update preferences.' };
  }
}

export async function getNotificationPreferencesAction() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: 'Unauthorized.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        smsAlertsMlsRelist: true,
        emailAlertsMlsRelist: true,
      },
    });
    return { success: true, preferences: user };
  } catch (error: any) {
    console.error('Failed to get preferences:', error);
    return { error: 'Failed to get preferences.' };
  }
}
