import "dotenv/config";
import { connectDB, disconnectDB } from "../db/connection";
import { User } from "../modules/auth/auth.model";
import { Order } from "../modules/orders/order.model";
import { Payment } from "../modules/payments/payment.model";
import { AuditLog } from "../modules/audit/audit.model";
import * as authService from "../modules/auth/auth.service";
import * as orderService from "../modules/orders/order.service";
import * as paymentService from "../modules/payments/payment.service";

/**
 * Seeds one demo account with a handful of orders spanning every status.
 * Orders/payments are created through the real service layer (not raw
 * inserts) so totals, status derivation, and locking behave exactly as
 * they would through the API.
 *
 * Idempotent: re-running this wipes the demo user's prior data first, so
 * `npm run seed` is safe to run repeatedly during development.
 *
 * Usage: npm run seed
 */

const DEMO_EMAIL = "demo@orderTracker.test";
const DEMO_PASSWORD = "password123";
const DEMO_NAME = "Demo User";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function resetDemoUser(): Promise<string> {
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    const userId = existing._id;
    await Payment.deleteMany({ userId });
    await AuditLog.deleteMany({ userId });
    await Order.deleteMany({ userId });
    await User.deleteOne({ _id: userId });
    console.log(`Removed existing demo user and ${DEMO_EMAIL}'s prior data.`);
  }

  const { user } = await authService.signup({
    name: DEMO_NAME,
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  return user.id;
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Copy .env.example to .env first.");

  await connectDB(uri);
  console.log("Connected to MongoDB");

  const userId = await resetDemoUser();
  console.log(`Created demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  // 1. Pending — no payments, due in the future.
  const pendingOrder = await orderService.createOrder(userId, {
    customer: "Brightline Textiles",
    dueDate: daysFromNow(21),
    lineItems: [
      { description: "Cotton fabric roll (50m)", quantity: 4, unitPriceCents: 18000 },
      { description: "Dye lot testing", quantity: 1, unitPriceCents: 5000 },
    ],
  });

  // 2. Partially paid — due in the future, part of the balance paid.
  const partialOrder = await orderService.createOrder(userId, {
    customer: "Northgate Hardware Co.",
    dueDate: daysFromNow(14),
    lineItems: [
      { description: "Galvanized bolts (box of 500)", quantity: 10, unitPriceCents: 4200 },
      { description: "Freight & handling", quantity: 1, unitPriceCents: 15000 },
    ],
  });
  await paymentService.createPayment(
    userId,
    partialOrder._id.toString(),
    { amountCents: 20000, paymentDate: daysFromNow(-3), note: "Deposit via wire transfer" },
    "seed-partial-payment-1"
  );

  // 3. Paid — fully settled before its due date.
  const paidOrder = await orderService.createOrder(userId, {
    customer: "Solstice Coffee Roasters",
    dueDate: daysFromNow(10),
    lineItems: [{ description: "Green coffee beans (60kg bag)", quantity: 6, unitPriceCents: 42000 }],
  });
  const paidTotal = paidOrder.totalCents;
  await paymentService.createPayment(
    userId,
    paidOrder._id.toString(),
    { amountCents: paidTotal, paymentDate: daysFromNow(-1), note: "Paid in full — check #1092" },
    "seed-paid-payment-1"
  );

  // 4. Overdue — due date has passed, nothing paid.
  await orderService.createOrder(userId, {
    customer: "Ashford & Vale Legal",
    dueDate: daysFromNow(-9),
    lineItems: [{ description: "Document binding & printing", quantity: 3, unitPriceCents: 12500 }],
  });

  // 5. Paid, but due date was in the past — demonstrates that "paid"
  // takes precedence over "overdue" once the balance is settled.
  const overdueThenPaidOrder = await orderService.createOrder(userId, {
    customer: "Marlowe Interiors",
    dueDate: daysFromNow(-5),
    lineItems: [{ description: "Custom drapery installation", quantity: 2, unitPriceCents: 32000 }],
  });
  await paymentService.createPayment(
    userId,
    overdueThenPaidOrder._id.toString(),
    {
      amountCents: overdueThenPaidOrder.totalCents,
      paymentDate: new Date(),
      note: "Settled late, in full",
    },
    "seed-overdue-then-paid-payment-1"
  );

  console.log("Seeded 5 orders (pending, partially_paid, paid, overdue, paid-after-overdue).");
  console.log("\nLog in with:");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
}

seed()
  .then(async () => {
    await disconnectDB();
    console.log("\nDone.");
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Seed failed:", err);
    await disconnectDB().catch(() => {});
    process.exit(1);
  });
