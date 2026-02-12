'use server';

import { prisma } from '@/lib/prisma';

export async function getDashboardStatsAction() {
  try {
    const [
      totalSalesAgg,
      totalOrders,
      totalCustomers,
      pendingOrders,
      recentOrders
    ] = await Promise.all([
      // Total Sales (sum of all non-cancelled orders)
      prisma.order.aggregate({
        _sum: {
          total: true,
        },
        where: {
          status: { not: 'cancelled' },
        },
      }),
      // Total Orders
      prisma.order.count(),
      // Total Customers (Users)
      prisma.user.count(), // Assuming we have a User model
      // Pending Orders
      prisma.order.count({
        where: { status: 'processing' },
      }),
      // Recent Orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            user: true, // needed if we want user info
            address: true
        }
      }),
    ]);

    return {
      success: true,
      data: {
        totalSales: totalSalesAgg._sum.total || 0,
        totalOrders,
        totalCustomers,
        pendingOrders,
        recentOrders,
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { success: false, error: String(error) };
  }
}

export async function getSalesChartDataAction(period: 'week' | 'month' | 'year' = 'month') {
    // This is a bit more complex with raw SQL or complex grouping in Prisma.
    // For now, we can return a simplified mock or try to implement it if needed.
    // Let's implement a simple 7-day sales chart.
    
    try {
        const endDate = new Date();
        const startDate = new Date();
        const windowDays = period === 'week' ? 7 : period === 'year' ? 365 : 30;
        startDate.setDate(startDate.getDate() - windowDays);

        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: { not: 'cancelled' }
            },
            select: {
                createdAt: true,
                total: true
            }
        });

        // Group by day
        const salesByDay: Record<string, number> = {};
        orders.forEach(order => {
            const day = order.createdAt.toISOString().split('T')[0];
            salesByDay[day] = (salesByDay[day] || 0) + order.total;
        });

        const chartData = Object.entries(salesByDay).map(([date, sales]) => ({
            date,
            sales
        })).sort((a, b) => a.date.localeCompare(b.date));

        return { success: true, data: chartData };

    } catch (error) {
        console.error('Error fetching chart data:', error);
        return { success: false, error: String(error) };
    }
}
