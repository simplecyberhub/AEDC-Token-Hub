import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, subscriptionsTable, metersTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.use(requireAuth);

function serializeSubscription(s: typeof subscriptionsTable.$inferSelect, meter: typeof metersTable.$inferSelect) {
  return {
    id: s.id,
    userId: s.userId,
    meterId: s.meterId,
    meterNumber: meter.meterNumber,
    meterName: meter.meterName,
    amount: Number(s.amount),
    frequency: s.frequency,
    isActive: s.isActive,
    nextRunDate: s.nextRunDate ? s.nextRunDate.toISOString() : null,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/subscriptions", async (req: AuthRequest, res): Promise<void> => {
  const subs = await db
    .select({
      sub: subscriptionsTable,
      meter: metersTable,
    })
    .from(subscriptionsTable)
    .innerJoin(metersTable, eq(subscriptionsTable.meterId, metersTable.id))
    .where(eq(subscriptionsTable.userId, req.userId!));

  res.json(subs.map(({ sub, meter }) => serializeSubscription(sub, meter)));
});

router.post("/subscriptions", async (req: AuthRequest, res): Promise<void> => {
  const { meterId, amount, frequency, nextRunDate } = req.body as {
    meterId?: number;
    amount?: number;
    frequency?: string;
    nextRunDate?: string | null;
  };

  if (!meterId || !amount || !frequency) {
    res.status(400).json({ error: "meterId, amount, and frequency are required" });
    return;
  }

  const validFrequencies = ["daily", "weekly", "monthly"];
  if (!validFrequencies.includes(frequency)) {
    res.status(400).json({ error: "Frequency must be daily, weekly, or monthly" });
    return;
  }

  const [meter] = await db
    .select()
    .from(metersTable)
    .where(and(eq(metersTable.id, meterId), eq(metersTable.userId, req.userId!)));

  if (!meter) {
    res.status(404).json({ error: "Meter not found" });
    return;
  }

  // Compute nextRunDate if not provided
  let runDate: Date | undefined;
  if (nextRunDate) {
    runDate = new Date(nextRunDate);
  } else {
    runDate = new Date();
    if (frequency === "daily") runDate.setDate(runDate.getDate() + 1);
    else if (frequency === "weekly") runDate.setDate(runDate.getDate() + 7);
    else runDate.setMonth(runDate.getMonth() + 1);
  }

  const [sub] = await db
    .insert(subscriptionsTable)
    .values({
      userId: req.userId!,
      meterId,
      amount: amount.toFixed(2),
      frequency,
      isActive: true,
      nextRunDate: runDate,
    })
    .returning();

  res.status(201).json(serializeSubscription(sub!, meter));
});

router.patch("/subscriptions/:id", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw!, 10);

  const { amount, frequency, isActive, nextRunDate } = req.body as {
    amount?: number | null;
    frequency?: string | null;
    isActive?: boolean | null;
    nextRunDate?: string | null;
  };

  const [existing] = await db
    .select({ sub: subscriptionsTable, meter: metersTable })
    .from(subscriptionsTable)
    .innerJoin(metersTable, eq(subscriptionsTable.meterId, metersTable.id))
    .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, req.userId!)));

  if (!existing) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  const updates: Partial<typeof subscriptionsTable.$inferInsert> = {};
  if (amount != null) updates.amount = amount.toFixed(2);
  if (frequency != null) updates.frequency = frequency;
  if (isActive != null) updates.isActive = isActive;
  if (nextRunDate != null) updates.nextRunDate = new Date(nextRunDate);

  const [sub] = await db
    .update(subscriptionsTable)
    .set(updates)
    .where(eq(subscriptionsTable.id, id))
    .returning();

  res.json(serializeSubscription(sub!, existing.meter));
});

router.delete("/subscriptions/:id", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw!, 10);

  const [sub] = await db
    .delete(subscriptionsTable)
    .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, req.userId!)))
    .returning();

  if (!sub) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
