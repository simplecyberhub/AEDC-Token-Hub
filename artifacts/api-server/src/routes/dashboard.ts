import { Router } from "express";
import { eq, desc, count, sum } from "drizzle-orm";
import { db, usersTable, tokenTransactionsTable, walletTransactionsTable, subscriptionsTable, metersTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/dashboard", async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;

  const [user, tokenStats, activeSubsCount, metersCountResult, recentTokens, recentWallet] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, userId)).then((r) => r[0]),
    db
      .select({ totalSpent: sum(tokenTransactionsTable.amount), totalCount: count() })
      .from(tokenTransactionsTable)
      .where(eq(tokenTransactionsTable.userId, userId))
      .then((r) => r[0]),
    db
      .select({ count: count() })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, userId))
      .then((r) => r[0]?.count ?? 0),
    db
      .select({ count: count() })
      .from(metersTable)
      .where(eq(metersTable.userId, userId))
      .then((r) => r[0]?.count ?? 0),
    db
      .select({
        id: tokenTransactionsTable.id,
        userId: tokenTransactionsTable.userId,
        meterId: tokenTransactionsTable.meterId,
        meterNumber: metersTable.meterNumber,
        meterName: metersTable.meterName,
        amount: tokenTransactionsTable.amount,
        token: tokenTransactionsTable.token,
        units: tokenTransactionsTable.units,
        status: tokenTransactionsTable.status,
        reference: tokenTransactionsTable.reference,
        createdAt: tokenTransactionsTable.createdAt,
      })
      .from(tokenTransactionsTable)
      .innerJoin(metersTable, eq(tokenTransactionsTable.meterId, metersTable.id))
      .where(eq(tokenTransactionsTable.userId, userId))
      .orderBy(desc(tokenTransactionsTable.createdAt))
      .limit(5),
    db
      .select()
      .from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.userId, userId))
      .orderBy(desc(walletTransactionsTable.createdAt))
      .limit(5),
  ]);

  res.json({
    walletBalance: Number(user?.walletBalance ?? 0),
    totalSpent: Number(tokenStats?.totalSpent ?? 0),
    totalTokensPurchased: Number(tokenStats?.totalCount ?? 0),
    activeSubscriptions: Number(activeSubsCount),
    metersCount: Number(metersCountResult),
    recentTransactions: recentTokens.map((t) => ({
      ...t,
      amount: Number(t.amount),
      units: t.units != null ? Number(t.units) : null,
      createdAt: t.createdAt.toISOString(),
    })),
    recentWalletActivity: recentWallet.map((t) => ({
      ...t,
      amount: Number(t.amount),
      createdAt: t.createdAt.toISOString(),
    })),
  });
});

export default router;
