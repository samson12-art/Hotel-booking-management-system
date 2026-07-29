import { getOne, query } from "../config/database";

const POINTS_PER_BOOKING = 10;
const POINTS_PER_DOLLAR = 1;
const TIER_THRESHOLDS = [
  { tier: "BRONZE", minPoints: 0 },
  { tier: "SILVER", minPoints: 100 },
  { tier: "GOLD", minPoints: 500 },
  { tier: "PLATINUM", minPoints: 1000 },
];

export const awardPoints = async (userId: string, bookingAmount: number, bookingId: string): Promise<void> => {
  const points = Math.round(bookingAmount * POINTS_PER_DOLLAR + POINTS_PER_BOOKING);

  let loyalty = await getOne(`SELECT * FROM loyalty_points WHERE "userId" = $1`, [userId]);

  if (!loyalty) {
    await query(
      `INSERT INTO loyalty_points (id, "userId", points, tier, "totalPoints", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'BRONZE', $2, NOW(), NOW())`,
      [userId, points]
    );
  } else {
    const newTotal = loyalty.totalPoints + points;
    let newTier = "BRONZE";
    for (const t of TIER_THRESHOLDS) {
      if (newTotal >= t.minPoints) newTier = t.tier;
    }
    await query(
      `UPDATE loyalty_points SET points = points + $1, "totalPoints" = "totalPoints" + $1, tier = $2, "updatedAt" = NOW()
       WHERE "userId" = $3`,
      [points, newTier, userId]
    );
  }

  await query(
    `INSERT INTO loyalty_transactions (id, "userId", points, type, description, "referenceId", "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'EARNED', $3, $4, NOW())`,
    [userId, points, `Points earned from booking ${bookingId}`, bookingId]
  );
};

export const redeemPoints = async (userId: string, pointsToRedeem: number): Promise<boolean> => {
  const loyalty = await getOne(
    `SELECT * FROM loyalty_points WHERE "userId" = $1 AND points >= $2`,
    [userId, pointsToRedeem]
  );
  if (!loyalty) return false;

  await query(
    `UPDATE loyalty_points SET points = points - $1, "updatedAt" = NOW() WHERE "userId" = $2`,
    [pointsToRedeem, userId]
  );

  await query(
    `INSERT INTO loyalty_transactions (id, "userId", points, type, description, "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'REDEEMED', $3, NOW())`,
    [userId, pointsToRedeem, `Redeemed ${pointsToRedeem} points`]
  );

  return true;
};

export const getLoyaltyInfo = async (userId: string): Promise<any> => {
  let loyalty = await getOne(`SELECT * FROM loyalty_points WHERE "userId" = $1`, [userId]);
  if (!loyalty) {
    await query(
      `INSERT INTO loyalty_points (id, "userId", points, tier, "totalPoints", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 0, 'BRONZE', 0, NOW(), NOW()) RETURNING *`,
      [userId]
    );
    loyalty = await getOne(`SELECT * FROM loyalty_points WHERE "userId" = $1`, [userId]);
  }

  const nextTier = TIER_THRESHOLDS.find(t => t.tier !== loyalty.tier && t.minPoints > loyalty.totalPoints);
  const pointsToNextTier = nextTier ? nextTier.minPoints - loyalty.totalPoints : 0;

  return {
    points: loyalty.points,
    totalPoints: loyalty.totalPoints,
    tier: loyalty.tier,
    pointsToNextTier,
    nextTier: nextTier?.tier || "MAX",
  };
};
