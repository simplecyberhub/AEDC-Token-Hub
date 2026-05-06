import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, walletTransactionsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.use(requireAuth);

function generateRef(): string {
  return "WLT" + Date.now().toString() + Math.floor(Math.random() * 10000).toString().padStart(4, "0");
}

router.get("/wallet", async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ balance: Number(user.walletBalance), userId: user.id });
});

router.post("/wallet/topup", async (req: AuthRequest, res): Promise<void> => {
  const { amount, paymentMethod, reference } = req.body as {
    amount?: number;
    paymentMethod?: string;
    reference?: string | null;
  };

  if (!amount || amount <= 0) {
    res.status(400).json({ error: "Valid amount is required" });
    return;
  }

  if (amount < 100) {
    res.status(400).json({ error: "Minimum top-up amount is ₦100" });
    return;
  }

  if (!paymentMethod) {
    res.status(400).json({ error: "Payment method is required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newBalance = Number(user.walletBalance) + amount;
  await db
    .update(usersTable)
    .set({ walletBalance: newBalance.toFixed(2) })
    .where(eq(usersTable.id, req.userId!));

  const ref = reference ?? generateRef();
  await db.insert(walletTransactionsTable).values({
    userId: req.userId!,
    type: "credit",
    amount: amount.toFixed(2),
    reference: ref,
    description: `Wallet top-up via ${paymentMethod}`,
    status: "success",
  });

  res.json({ balance: newBalance, userId: req.userId! });
});

router.get("/wallet/transactions", async (req: AuthRequest, res): Promise<void> => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  const txns = await db
    .select()
    .from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.userId, req.userId!))
    .orderBy(desc(walletTransactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(
    txns.map((t) => ({
      id: t.id,
      userId: t.userId,
      type: t.type,
      amount: Number(t.amount),
      reference: t.reference,
      description: t.description,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    }))
  );
});

export default router;
