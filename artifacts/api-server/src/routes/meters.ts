import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, metersTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/meters", async (req: AuthRequest, res): Promise<void> => {
  const meters = await db
    .select()
    .from(metersTable)
    .where(eq(metersTable.userId, req.userId!));

  res.json(
    meters.map((m) => ({
      id: m.id,
      userId: m.userId,
      meterNumber: m.meterNumber,
      meterName: m.meterName,
      address: m.address,
      tariffType: m.tariffType,
      isDefault: m.isDefault,
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

router.post("/meters", async (req: AuthRequest, res): Promise<void> => {
  const { meterNumber, meterName, address, tariffType, isDefault } = req.body as {
    meterNumber?: string;
    meterName?: string;
    address?: string;
    tariffType?: string;
    isDefault?: boolean;
  };

  if (!meterNumber || !meterName || !address || !tariffType) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  // If this is default, unset others
  if (isDefault) {
    await db
      .update(metersTable)
      .set({ isDefault: false })
      .where(eq(metersTable.userId, req.userId!));
  }

  const [meter] = await db
    .insert(metersTable)
    .values({
      userId: req.userId!,
      meterNumber,
      meterName,
      address,
      tariffType,
      isDefault: isDefault ?? false,
    })
    .returning();

  if (!meter) {
    res.status(500).json({ error: "Failed to create meter" });
    return;
  }

  res.status(201).json({
    id: meter.id,
    userId: meter.userId,
    meterNumber: meter.meterNumber,
    meterName: meter.meterName,
    address: meter.address,
    tariffType: meter.tariffType,
    isDefault: meter.isDefault,
    createdAt: meter.createdAt.toISOString(),
  });
});

router.get("/meters/:id", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw!, 10);

  const [meter] = await db
    .select()
    .from(metersTable)
    .where(and(eq(metersTable.id, id), eq(metersTable.userId, req.userId!)));

  if (!meter) {
    res.status(404).json({ error: "Meter not found" });
    return;
  }

  res.json({
    id: meter.id,
    userId: meter.userId,
    meterNumber: meter.meterNumber,
    meterName: meter.meterName,
    address: meter.address,
    tariffType: meter.tariffType,
    isDefault: meter.isDefault,
    createdAt: meter.createdAt.toISOString(),
  });
});

router.patch("/meters/:id", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw!, 10);

  const { meterName, address, tariffType, isDefault } = req.body as {
    meterName?: string | null;
    address?: string | null;
    tariffType?: string | null;
    isDefault?: boolean | null;
  };

  const [existing] = await db
    .select()
    .from(metersTable)
    .where(and(eq(metersTable.id, id), eq(metersTable.userId, req.userId!)));

  if (!existing) {
    res.status(404).json({ error: "Meter not found" });
    return;
  }

  if (isDefault) {
    await db
      .update(metersTable)
      .set({ isDefault: false })
      .where(eq(metersTable.userId, req.userId!));
  }

  const updates: Partial<typeof metersTable.$inferInsert> = {};
  if (meterName != null) updates.meterName = meterName;
  if (address != null) updates.address = address;
  if (tariffType != null) updates.tariffType = tariffType;
  if (isDefault != null) updates.isDefault = isDefault;

  const [meter] = await db
    .update(metersTable)
    .set(updates)
    .where(eq(metersTable.id, id))
    .returning();

  res.json({
    id: meter!.id,
    userId: meter!.userId,
    meterNumber: meter!.meterNumber,
    meterName: meter!.meterName,
    address: meter!.address,
    tariffType: meter!.tariffType,
    isDefault: meter!.isDefault,
    createdAt: meter!.createdAt.toISOString(),
  });
});

router.delete("/meters/:id", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw!, 10);

  const [meter] = await db
    .delete(metersTable)
    .where(and(eq(metersTable.id, id), eq(metersTable.userId, req.userId!)))
    .returning();

  if (!meter) {
    res.status(404).json({ error: "Meter not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
