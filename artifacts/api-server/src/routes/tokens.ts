import { Router } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, tokenTransactionsTable, metersTable, usersTable, walletTransactionsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.use(requireAuth);

function generateTokenCode(): string {
  // Simulate a 20-digit electricity token code
  return Array.from({ length: 5 }, () =>
    Math.floor(1000 + Math.random() * 9000)
  ).join("-");
}

function calculateUnits(amount: number): number {
  // AEDC rate: approx 70 units per 1000 NGN (simplified)
  return Math.round((amount / 1000) * 70 * 100) / 100;
}

function generateRef(): string {
  return "TXN" + Date.now().toString() + Math.floor(Math.random() * 10000).toString().padStart(4, "0");
}

router.get("/tokens", async (req: AuthRequest, res): Promise<void> => {
  const meterId = req.query.meterId ? parseInt(req.query.meterId as string, 10) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  const conditions = [eq(tokenTransactionsTable.userId, req.userId!)];
  if (meterId) conditions.push(eq(tokenTransactionsTable.meterId, meterId));

  const txns = await db
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
    .where(and(...conditions))
    .orderBy(desc(tokenTransactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(
    txns.map((t) => ({
      ...t,
      amount: Number(t.amount),
      units: t.units != null ? Number(t.units) : null,
      createdAt: t.createdAt.toISOString(),
    }))
  );
});

router.post("/tokens/purchase", async (req: AuthRequest, res): Promise<void> => {
  const { meterId, amount } = req.body as { meterId?: number; amount?: number };

  if (!meterId || !amount || amount <= 0) {
    res.status(400).json({ error: "Valid meterId and amount are required" });
    return;
  }

  if (amount < 500) {
    res.status(400).json({ error: "Minimum purchase amount is ₦500" });
    return;
  }

  // Verify meter belongs to user
  const [meter] = await db
    .select()
    .from(metersTable)
    .where(and(eq(metersTable.id, meterId), eq(metersTable.userId, req.userId!)));

  if (!meter) {
    res.status(404).json({ error: "Meter not found" });
    return;
  }

  // Check wallet balance
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const balance = Number(user.walletBalance);
  if (balance < amount) {
    res.status(400).json({ error: `Insufficient wallet balance. Available: ₦${balance.toFixed(2)}` });
    return;
  }

  const reference = generateRef();
  const tokenCode = generateTokenCode();
  const units = calculateUnits(amount);

  // Deduct from wallet
  await db
    .update(usersTable)
    .set({ walletBalance: (balance - amount).toFixed(2) })
    .where(eq(usersTable.id, req.userId!));

  // Record wallet debit
  await db.insert(walletTransactionsTable).values({
    userId: req.userId!,
    type: "debit",
    amount: amount.toFixed(2),
    reference,
    description: `Token purchase for meter ${meter.meterNumber}`,
    status: "success",
  });

  // Create token transaction
  const [txn] = await db
    .insert(tokenTransactionsTable)
    .values({
      userId: req.userId!,
      meterId,
      amount: amount.toFixed(2),
      token: tokenCode,
      units: units.toFixed(2),
      status: "success",
      reference,
    })
    .returning();

  res.status(201).json({
    id: txn!.id,
    userId: txn!.userId,
    meterId: txn!.meterId,
    meterNumber: meter.meterNumber,
    meterName: meter.meterName,
    amount: Number(txn!.amount),
    token: txn!.token,
    units: txn!.units != null ? Number(txn!.units) : null,
    status: txn!.status,
    reference: txn!.reference,
    createdAt: txn!.createdAt.toISOString(),
  });
});

router.get("/tokens/:id", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw!, 10);

  const [txn] = await db
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
    .where(and(eq(tokenTransactionsTable.id, id), eq(tokenTransactionsTable.userId, req.userId!)));

  if (!txn) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json({
    ...txn,
    amount: Number(txn.amount),
    units: txn.units != null ? Number(txn.units) : null,
    createdAt: txn.createdAt.toISOString(),
  });
});

export default router;
