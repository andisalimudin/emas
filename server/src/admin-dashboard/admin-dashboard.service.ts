import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function pctChange(current: number, previous: number) {
  if (!previous) {
    if (!current) return 0;
    return 100;
  }
  return ((current - previous) / previous) * 100;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addMonths(d: Date, months: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();
    const periodDays = 30;
    const periodEnd = now;
    const periodStart = startOfDay(addDays(now, -periodDays));
    const prevPeriodEnd = periodStart;
    const prevPeriodStart = startOfDay(addDays(periodStart, -periodDays));

    const [
      totalUsers,
      totalOrders,
      totalRevenueAgg,
      totalActiveAgents,
      usersThisPeriod,
      usersPrevPeriod,
      ordersThisPeriod,
      ordersPrevPeriod,
      revenueThisPeriodAgg,
      revenuePrevPeriodAgg,
      activeAgentsThisPeriod,
      activeAgentsPrevPeriod,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'APPROVED' },
      }),
      this.prisma.user.count({
        where: { role: 'VENDOR', status: 'ACTIVE', isLocked: false },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: periodStart, lt: periodEnd } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: prevPeriodStart, lt: prevPeriodEnd } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: periodStart, lt: periodEnd } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: prevPeriodStart, lt: prevPeriodEnd } },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'APPROVED', createdAt: { gte: periodStart, lt: periodEnd } },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'APPROVED', createdAt: { gte: prevPeriodStart, lt: prevPeriodEnd } },
      }),
      this.prisma.user.count({
        where: { role: 'VENDOR', status: 'ACTIVE', isLocked: false, createdAt: { gte: periodStart, lt: periodEnd } },
      }),
      this.prisma.user.count({
        where: { role: 'VENDOR', status: 'ACTIVE', isLocked: false, createdAt: { gte: prevPeriodStart, lt: prevPeriodEnd } },
      }),
    ]);

    const totalRevenue = Number(totalRevenueAgg?._sum?.amount || 0);
    const revenueThisPeriod = Number(revenueThisPeriodAgg?._sum?.amount || 0);
    const revenuePrevPeriod = Number(revenuePrevPeriodAgg?._sum?.amount || 0);

    const chartMonths = 7;
    const monthStart = startOfMonth(addMonths(now, -(chartMonths - 1)));
    const paymentsForChart = await this.prisma.payment.findMany({
      where: { status: 'APPROVED', createdAt: { gte: monthStart, lt: addMonths(startOfMonth(now), 1) } },
      select: { amount: true, createdAt: true },
    });

    const monthBuckets = new Map<string, number>();
    for (let i = 0; i < chartMonths; i++) {
      const m = addMonths(monthStart, i);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      monthBuckets.set(key, 0);
    }
    for (const p of paymentsForChart) {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthBuckets.has(key)) {
        monthBuckets.set(key, (monthBuckets.get(key) || 0) + Number(p.amount || 0));
      }
    }
    const chart = Array.from(monthBuckets.entries()).map(([month, amount]) => ({ month, amount }));

    const [recentPayments, recentOrders] = await Promise.all([
      this.prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } },
      }),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } },
      }),
    ]);

    const activities = [
      ...recentPayments.map((p) => ({
        id: `payment:${p.id}`,
        createdAt: p.createdAt,
        kind: 'PAYMENT',
        userName: p.user?.name || 'Pengguna',
        title: `${p.user?.name || 'Pengguna'} hantar pembayaran RM ${Number(p.amount || 0).toFixed(2)}`,
        subtitle: `Status: ${p.status}`,
      })),
      ...recentOrders.map((o) => ({
        id: `order:${o.id}`,
        createdAt: o.createdAt,
        kind: 'ORDER',
        userName: o.user?.name || 'Pengguna',
        title: `${o.user?.name || 'Pengguna'} buat pesanan RM ${Number(o.totalAmount || 0).toFixed(2)}`,
        subtitle: `Status: ${o.status}`,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      periodDays,
      stats: {
        totalUsers: {
          value: totalUsers,
          changePct: pctChange(usersThisPeriod, usersPrevPeriod),
        },
        totalRevenue: {
          value: totalRevenue,
          changePct: pctChange(revenueThisPeriod, revenuePrevPeriod),
        },
        totalOrders: {
          value: totalOrders,
          changePct: pctChange(ordersThisPeriod, ordersPrevPeriod),
        },
        activeAgents: {
          value: totalActiveAgents,
          changePct: pctChange(activeAgentsThisPeriod, activeAgentsPrevPeriod),
        },
      },
      chart,
      recentActivity: activities,
    };
  }
}

