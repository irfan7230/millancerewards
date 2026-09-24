// =============================================================================
// Seed Data Generator — Millance Lucky Draw
// MOCK-DATA.md: deterministic, realistic volume, composed in order:
//   franchises → groups → plans → users → payments → vaults → draws → prizes
//   → notifications/activity log
//
// FIXED_SEED = 0xDEADBEEF — stable across reloads and machines.
// =============================================================================

import type {
  Franchise, Group, GroupType, Plan, FranchiseUser, Payment, Vault,
  VaultTransaction, Draw, DrawWinner, Prize, Product, Purchase,
  NotificationEvent, ActivityLogEntry, UserStatus,
} from '@/types';
import {
  createPRNG, makeId, pickUnique, pick, range, periodLabel, addMonths,
} from './utils';

const FIXED_SEED = 0xDEADBEEF;
const rng = createPRNG(FIXED_SEED);

// Simulated "today" — the demo clock starts here
export const DEMO_START_DATE = '2026-04-01T00:00:00.000Z';
// We seed 6 months of history (months 1–6 are "in the past")
export const ELAPSED_MONTHS = 6;

// ---------------------------------------------------------------------------
// Group Types (configuration — not hardcoded in UI)
// ---------------------------------------------------------------------------

export const GROUP_TYPES: GroupType[] = [
  {
    id: 'group-a',
    name: 'Group A',
    capacity: 500,
    description: 'Starter group — up to 500 members, lower monthly contribution.',
  },
  {
    id: 'group-b',
    name: 'Group B',
    capacity: 1000,
    description: 'Premium group — up to 1,000 members, higher monthly contribution.',
  },
];

// ---------------------------------------------------------------------------
// Franchises (5+)
// ---------------------------------------------------------------------------

const FRANCHISE_DATA = [
  { name: 'Millance Mumbai',    ownerName: 'Rajesh Mehta',     city: 'Mumbai',    email: 'mumbai@millance.in',    phone: '9876543210' },
  { name: 'Millance Delhi',     ownerName: 'Priya Sharma',     city: 'Delhi',     email: 'delhi@millance.in',     phone: '9876543211' },
  { name: 'Millance Bangalore', ownerName: 'Suresh Kumar',     city: 'Bangalore', email: 'bangalore@millance.in', phone: '9876543212' },
  { name: 'Millance Chennai',   ownerName: 'Kavita Rao',       city: 'Chennai',   email: 'chennai@millance.in',   phone: '9876543213' },
  { name: 'Millance Hyderabad', ownerName: 'Vikram Reddy',     city: 'Hyderabad', email: 'hyderabad@millance.in', phone: '9876543214' },
  { name: 'Millance Pune',      ownerName: 'Anita Deshmukh',   city: 'Pune',      email: 'pune@millance.in',      phone: '9876543215' },
];

export function generateFranchises(): Franchise[] {
  const createdAt = '2025-01-15T08:00:00.000Z';
  return FRANCHISE_DATA.map((d, i) => ({
    id: makeId('fran', i + 1),
    name: d.name,
    ownerName: d.ownerName,
    email: d.email,
    phone: d.phone,
    city: d.city,
    status: i === 4 ? 'suspended' : 'active', // one suspended for demo
    createdAt: addMonths(createdAt, i),
  }));
}

// ---------------------------------------------------------------------------
// Groups (2 per franchise = 12 total, mix of A and B)
// ---------------------------------------------------------------------------

export function generateGroups(franchises: Franchise[]): Group[] {
  const groups: Group[] = [];
  let idx = 1;
  for (const franchise of franchises) {
    if (franchise.status === 'suspended') {
      // Suspended franchise still has groups
      groups.push({
        id: makeId('grp', idx++),
        franchiseId: franchise.id,
        groupTypeId: 'group-a',
        name: `${franchise.name} — Group A`,
        memberCount: 0, // filled after user generation
        createdAt: addMonths(franchise.createdAt, 1),
      });
      continue;
    }
    groups.push(
      {
        id: makeId('grp', idx++),
        franchiseId: franchise.id,
        groupTypeId: 'group-a',
        name: `${franchise.name} — Group A`,
        memberCount: 0,
        createdAt: addMonths(franchise.createdAt, 1),
      },
      {
        id: makeId('grp', idx++),
        franchiseId: franchise.id,
        groupTypeId: 'group-b',
        name: `${franchise.name} — Group B`,
        memberCount: 0,
        createdAt: addMonths(franchise.createdAt, 1),
      },
    );
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Plans (1–2 per group)
// ---------------------------------------------------------------------------

const PLAN_CONFIGS = [
  { name: 'Silver 12', durationMonths: 12, monthlyAmount: 1000 },
  { name: 'Gold 24',   durationMonths: 24, monthlyAmount: 2000 },
  { name: 'Platinum 36', durationMonths: 36, monthlyAmount: 3000 },
];

export function generatePlans(groups: Group[]): Plan[] {
  const plans: Plan[] = [];
  let idx = 1;
  for (const group of groups) {
    const cfg = PLAN_CONFIGS[idx % PLAN_CONFIGS.length];
    const startDate = '2026-01-01T00:00:00.000Z';
    const endDate = addMonths(startDate, cfg.durationMonths);
    plans.push({
      id: makeId('plan', idx),
      franchiseId: group.franchiseId,
      groupId: group.id,
      name: `${cfg.name} — ${group.name}`,
      groupType: group.groupTypeId,
      durationMonths: cfg.durationMonths,
      monthlyAmount: cfg.monthlyAmount,
      totalAmount: cfg.monthlyAmount * cfg.durationMonths,
      status: 'active',
      startDate,
      endDate,
      currentMonth: ELAPSED_MONTHS, // set at seed time; recalculated by demoClockStore
    });
    idx++;
  }
  return plans;
}

// ---------------------------------------------------------------------------
// Users (≥100 total, distributed across plans with realistic status spread)
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Arjun', 'Diya', 'Ishaan', 'Kavya', 'Kiran', 'Meera',
  'Neha', 'Nikhil', 'Priya', 'Rahul', 'Riya', 'Rohan', 'Shreya', 'Siddharth',
  'Sneha', 'Tanvi', 'Varun', 'Vikram', 'Aditi', 'Aditya', 'Akash', 'Anjali',
  'Deepa', 'Gaurav', 'Harish', 'Jyoti', 'Lalit', 'Manish', 'Mohit', 'Nandini',
  'Pankaj', 'Pooja', 'Ravi', 'Ritika', 'Sachin', 'Saima', 'Sonam', 'Sunil',
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Mehta', 'Reddy', 'Nair',
  'Rao', 'Gupta', 'Joshi', 'Iyer', 'Pillai', 'Menon', 'Agarwal', 'Shah',
  'Mishra', 'Tiwari', 'Pandey', 'Saxena', 'Bhatt', 'Chauhan', 'Desai',
  'Kapoor', 'Khanna', 'Malhotra', 'Oberoi', 'Rastogi', 'Srivastava', 'Yadav',
];

function randomName(r: () => number) {
  return `${pick(FIRST_NAMES, r)} ${pick(LAST_NAMES, r)}`;
}
function randomPhone(r: () => number) {
  return `${Math.floor(r() * 9) + 6}${String(Math.floor(r() * 1e9)).padStart(9, '0')}`;
}

const STATUS_POOL: UserStatus[] = [
  'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE',
  'PAYMENT_PENDING', 'PAYMENT_PENDING',
  'DRAW_ELIGIBLE', 'DRAW_ELIGIBLE', 'DRAW_ELIGIBLE',
  'WINNER', 'INACTIVE',
  'PLAN_COMPLETED',
];

export function generateUsers(plans: Plan[]): FranchiseUser[] {
  const users: FranchiseUser[] = [];
  let idx = 1;
  // Aim for 100+ users. Distribute: plans with group-a get 20, group-b get 25.
  for (const plan of plans) {
    const count = plan.groupType === 'group-a' ? 20 : 25;
    for (let i = 0; i < count; i++) {
      // usr-0001 is the demo Member account — force it to have a pending
      // current-month payment so the Pay Now / checkout flow is always demoable.
      const status: UserStatus = idx === 1 ? 'PAYMENT_PENDING' : pick(STATUS_POOL, rng);
      const hasWon = status === 'WINNER' || status === 'INACTIVE';
      const name = randomName(rng);
      users.push({
        id: makeId('usr', idx++),
        franchiseId: plan.franchiseId,
        groupId: plan.groupId,
        planId: plan.id,
        name,
        email: `${name.toLowerCase().replace(' ', '.')}${idx}@example.com`,
        phone: randomPhone(rng),
        status,
        joinedAt: addMonths(plan.startDate, 0),
        hasWon,
      });
    }
  }
  return users;
}

// ---------------------------------------------------------------------------
// Payments (ELAPSED_MONTHS months per user)
// ---------------------------------------------------------------------------

export function generatePayments(users: FranchiseUser[], plans: Plan[]): Payment[] {
  const payments: Payment[] = [];
  let idx = 1;
  const planMap = new Map(plans.map(p => [p.id, p]));

  for (const user of users) {
    const plan = planMap.get(user.planId);
    if (!plan) continue;
    if (user.status === 'INACTIVE' || user.status === 'WINNER') {
      // Winners paid some months before winning; generate partial history
      const wonMonth = 3 + Math.floor(rng() * 3); // months 3-5
      for (let m = 1; m <= wonMonth; m++) {
        const dueDate = addMonths(plan.startDate, m - 1);
        payments.push({
          id: makeId('pay', idx++),
          franchiseId: user.franchiseId,
          userId: user.id,
          planId: plan.id,
          month: m,
          periodLabel: periodLabel(new Date(dueDate)),
          amount: plan.monthlyAmount,
          status: 'Paid',
          paidAt: addMonths(dueDate, 0),
          dueDate,
        });
      }
    } else {
      // Regular users: ELAPSED_MONTHS of payments
      for (let m = 1; m <= ELAPSED_MONTHS; m++) {
        const dueDate = addMonths(plan.startDate, m - 1);
        // Realistic mix: mostly Paid, some Pending/Failed
        let status: Payment['status'] = 'Paid';
        if (m === ELAPSED_MONTHS) {
          // Current month: mix based on user status
          if (user.status === 'PAYMENT_PENDING') status = 'Pending';
          else if (user.status === 'DRAW_ELIGIBLE' || user.status === 'PAYMENT_COMPLETED') status = 'Paid';
          else status = rng() > 0.85 ? 'Pending' : 'Paid';
        } else if (rng() > 0.92) {
          status = rng() > 0.5 ? 'Skipped' : 'Failed';
        }
        payments.push({
          id: makeId('pay', idx++),
          franchiseId: user.franchiseId,
          userId: user.id,
          planId: plan.id,
          month: m,
          periodLabel: periodLabel(new Date(dueDate)),
          amount: plan.monthlyAmount,
          status,
          paidAt: status === 'Paid' ? addMonths(dueDate, 0) : undefined,
          dueDate,
        });
      }
    }
  }
  return payments;
}

// ---------------------------------------------------------------------------
// Vaults (derived from payments; winners zero'd out)
// ---------------------------------------------------------------------------

export function generateVaults(
  users: FranchiseUser[],
  payments: Payment[],
): Vault[] {
  const vaults: Vault[] = [];
  let txIdx = 1;

  for (const user of users) {
    const userPayments = payments.filter(p => p.userId === user.id && p.status === 'Paid');
    const transactions: VaultTransaction[] = [];
    let balance = 0;
    let totalContributed = 0;
    let totalUsed = 0;

    // Monthly contribution transactions
    for (const pay of userPayments) {
      balance += pay.amount;
      totalContributed += pay.amount;
      transactions.push({
        id: makeId('vtx', txIdx++),
        userId: user.id,
        type: 'monthly_contribution',
        amount: pay.amount,
        balanceAfter: balance,
        createdAt: pay.paidAt ?? pay.dueDate,
        meta: { note: `Month ${pay.month} contribution` },
      });
    }

    // Winners: zero out vault
    if (user.hasWon) {
      const prizeValue = 50000; // placeholder; real value set from prize record
      // lucky_draw_prize (informational)
      transactions.push({
        id: makeId('vtx', txIdx++),
        userId: user.id,
        type: 'lucky_draw_prize',
        amount: prizeValue,
        balanceAfter: balance + prizeValue, // informational only
        createdAt: new Date().toISOString(),
        meta: { note: 'Lucky draw prize awarded' },
      });
      // prize_deduction — brings balance to 0 (auditability: two separate entries)
      const deduction = -(balance);
      totalUsed += balance;
      balance = 0;
      transactions.push({
        id: makeId('vtx', txIdx++),
        userId: user.id,
        type: 'prize_deduction',
        amount: deduction,
        balanceAfter: 0,
        createdAt: new Date().toISOString(),
        meta: { note: 'Prize received — vault zeroed' },
      });
    }

    // PLAN_COMPLETED users may have made purchases (leave balance for demo)
    if (user.status === 'PLAN_COMPLETED') {
      const purchaseAmt = Math.floor(balance * 0.3);
      if (purchaseAmt > 0) {
        balance -= purchaseAmt;
        totalUsed += purchaseAmt;
        transactions.push({
          id: makeId('vtx', txIdx++),
          userId: user.id,
          type: 'product_purchase',
          amount: -purchaseAmt,
          balanceAfter: balance,
          createdAt: new Date().toISOString(),
          meta: { note: 'Product marketplace purchase' },
        });
      }
    }

    vaults.push({ userId: user.id, balance, totalContributed, totalUsed, transactions });
  }

  return vaults;
}

// ---------------------------------------------------------------------------
// Prizes (10+ per franchise)
// ---------------------------------------------------------------------------

const PRIZE_TEMPLATES = [
  { name: 'iPhone 16 Pro',       description: '256GB, Natural Titanium',               value: 134900 },
  { name: 'Samsung 65" QLED TV', description: '4K Smart TV, Neo QLED',                 value: 89990  },
  { name: 'MacBook Air M3',       description: '13-inch, 16GB RAM, 512GB SSD',          value: 119900 },
  { name: 'Royal Enfield Classic 350', description: 'Signals Edition, Chrome finish',  value: 193000 },
  { name: 'Gold Coin 10g',        description: '24K BIS Hallmarked Gold Coin',          value: 62000  },
  { name: 'Tata Harrier EV',      description: 'Long Range, Empowered+',               value: 2500000},
  { name: 'HP Omen Gaming PC',    description: 'RTX 4080, 32GB RAM, 2TB NVMe',         value: 189999 },
  { name: 'Sony Bravia 55" OLED', description: 'A80L 4K HDR 120Hz',                    value: 149990 },
  { name: 'Dyson Airwrap Complete', description: 'Multi-styler & Dryer, Special Ed.', value: 44900  },
  { name: 'Amazon Gift Voucher ₹50K', description: 'Valid on all Amazon.in categories', value: 50000 },
  { name: 'Tanishq Diamond Set', description: 'Diamond Solitaire Necklace & Earrings', value: 85000  },
  { name: 'PlayStation 5 Pro',   description: '2TB, DualSense Edge Controller',         value: 74990  },
];

export function generatePrizes(franchises: Franchise[]): Prize[] {
  const prizes: Prize[] = [];
  let idx = 1;
  for (const franchise of franchises) {
    for (const template of PRIZE_TEMPLATES) {
      prizes.push({
        id: makeId('prz', idx++),
        franchiseId: franchise.id,
        name: template.name,
        description: template.description,
        value: template.value,
        isAvailable: true,
      });
    }
  }
  return prizes;
}

// ---------------------------------------------------------------------------
// Draws (past months; at least one upcoming)
// ---------------------------------------------------------------------------

export function generateDraws(
  plans: Plan[],
  users: FranchiseUser[],
  prizes: Prize[],
  payments: Payment[],
): { draws: Draw[]; updatedUsers: FranchiseUser[] } {
  const draws: Draw[] = [];
  let drawIdx = 1;
  const updatedUsers = [...users];
  const userMap = new Map(updatedUsers.map((u, i) => [u.id, i]));

  // Run draws for months 1–4 (leave months 5–6 as upcoming for demo)
  const DRAWN_MONTHS = range(1, 5); // [1,2,3,4]

  for (const plan of plans) {
    const planPrizes = prizes.filter(p => p.franchiseId === plan.franchiseId);
    const rngLocal = createPRNG(FIXED_SEED ^ plan.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0));

    for (const month of DRAWN_MONTHS) {
      const planUsers = users.filter(u => u.planId === plan.id);
      // Already won in this plan
      const priorWinnerIds = new Set(
        draws
          .filter(d => d.planId === plan.id && d.month < month)
          .flatMap(d => d.winners.map(w => w.userId)),
      );
      // Eligible: Paid for this month, not already won, not INACTIVE
      const paidUserIds = new Set(
        payments
          .filter(p => p.planId === plan.id && p.month === month && p.status === 'Paid')
          .map(p => p.userId),
      );
      const eligible = planUsers.filter(
        u => paidUserIds.has(u.id) && !priorWinnerIds.has(u.id) && u.status !== 'INACTIVE',
      );

      if (eligible.length < 10 || planPrizes.length < 10) {
        // Not enough — schedule but don't run
        draws.push({
          id: makeId('drw', drawIdx++),
          franchiseId: plan.franchiseId,
          groupId: plan.groupId,
          planId: plan.id,
          month,
          periodLabel: periodLabel(new Date(addMonths(plan.startDate, month - 1))),
          status: 'scheduled',
          eligibleUserIds: eligible.map(u => u.id),
          winners: [],
        });
        continue;
      }

      // Select 10 winners + assign 10 unique prizes
      const selectedUsers = pickUnique(eligible, 10, rngLocal);
      const selectedPrizes = pickUnique(planPrizes, 10, rngLocal);
      const winners: DrawWinner[] = selectedUsers.map((u, rank) => ({
        userId: u.id,
        prizeId: selectedPrizes[rank].id,
        rank: rank + 1,
      }));

      // Mark winners as INACTIVE in updatedUsers
      for (const winner of winners) {
        const idx2 = userMap.get(winner.userId);
        if (idx2 !== undefined) {
          updatedUsers[idx2] = {
            ...updatedUsers[idx2],
            status: 'INACTIVE',
            hasWon: true,
          };
        }
      }

      draws.push({
        id: makeId('drw', drawIdx++),
        franchiseId: plan.franchiseId,
        groupId: plan.groupId,
        planId: plan.id,
        month,
        periodLabel: periodLabel(new Date(addMonths(plan.startDate, month - 1))),
        status: 'completed',
        eligibleUserIds: eligible.map(u => u.id),
        winners,
        executedAt: addMonths(plan.startDate, month - 1),
      });
    }
  }

  return { draws, updatedUsers };
}

// ---------------------------------------------------------------------------
// Products (global catalog, 10–20)
// ---------------------------------------------------------------------------

export const PRODUCTS_DATA = [
  { name: 'Wireless Earbuds Pro',      description: 'ANC, 30hr battery, IPX5',        price: 4999,  category: 'Electronics', inStock: true  },
  { name: 'Stainless Steel Water Bottle', description: '1L, vacuum insulated',        price: 799,   category: 'Lifestyle',   inStock: true  },
  { name: 'Premium Yoga Mat',           description: '6mm thick, non-slip, eco cork', price: 1499,  category: 'Fitness',     inStock: true  },
  { name: 'Smart Watch Series 9',       description: 'Health tracking, GPS, AMOLED',  price: 14999, category: 'Electronics', inStock: true  },
  { name: 'Kindle Paperwhite',          description: '11th Gen, 6.8" 300ppi',          price: 11999, category: 'Electronics', inStock: true  },
  { name: 'Artisan Coffee Set',         description: 'Pour-over kit + 500g beans',    price: 2499,  category: 'Lifestyle',   inStock: true  },
  { name: 'Air Purifier HEPA',          description: '360° coverage, PM2.5 sensor',   price: 8999,  category: 'Home',        inStock: true  },
  { name: 'Running Shoes',             description: 'Responsive cushion, mesh upper', price: 3999,  category: 'Fitness',     inStock: true  },
  { name: 'Bluetooth Speaker',          description: '20W, waterproof, 15hr playtime', price: 3499, category: 'Electronics', inStock: false },
  { name: 'Skincare Glow Set',          description: 'Vitamin C serum + moisturiser', price: 1999,  category: 'Beauty',      inStock: true  },
  { name: 'Bamboo Desk Organiser',      description: '7-slot, sustainable bamboo',    price: 999,   category: 'Home',        inStock: true  },
  { name: 'Resistance Band Set',        description: '5 resistance levels, carry bag', price: 699,  category: 'Fitness',     inStock: true  },
  { name: 'Digital Alarm Clock',        description: 'LED display, USB charging port', price: 849,  category: 'Home',        inStock: true  },
  { name: 'Premium Notebook A5',        description: 'Dotgrid, 160 pages, lay-flat',  price: 599,   category: 'Lifestyle',   inStock: true  },
  { name: 'Instant Pot Duo',            description: '5L multi-cooker 9-in-1',        price: 6999,  category: 'Home',        inStock: true  },
];

export function generateProducts(): Product[] {
  return PRODUCTS_DATA.map((d, i) => ({
    id: makeId('prd', i + 1),
    name: d.name,
    description: d.description,
    price: d.price,
    category: d.category,
    inStock: d.inStock,
  }));
}

// ---------------------------------------------------------------------------
// Notifications (realistic backlog)
// ---------------------------------------------------------------------------

export function generateNotifications(
  draws: Draw[],
  users: FranchiseUser[],
  payments: Payment[],
): NotificationEvent[] {
  const notifications: NotificationEvent[] = [];
  let idx = 1;
  const now = new Date().toISOString();

  // Draw completed notifications
  for (const draw of draws.filter(d => d.status === 'completed')) {
    notifications.push({
      id: makeId('ntf', idx++),
      audienceRole: 'franchise',
      franchiseId: draw.franchiseId,
      kind: 'draw_completed',
      message: `Lucky draw completed for ${draw.periodLabel}. 10 winners selected.`,
      createdAt: draw.executedAt ?? now,
      read: true,
    });
    // Prize won notifications for each winner
    for (const winner of draw.winners) {
      notifications.push({
        id: makeId('ntf', idx++),
        audienceRole: 'user',
        franchiseId: draw.franchiseId,
        userId: winner.userId,
        kind: 'prize_won',
        message: `🎉 Congratulations! You won a prize in the ${draw.periodLabel} lucky draw!`,
        createdAt: draw.executedAt ?? now,
        read: false,
      });
    }
  }

  // Payment due notifications (current month pending)
  const pendingPayments = payments.filter(p => p.status === 'Pending');
  for (const pay of pendingPayments.slice(0, 20)) {
    notifications.push({
      id: makeId('ntf', idx++),
      audienceRole: 'user',
      franchiseId: pay.franchiseId,
      userId: pay.userId,
      kind: 'payment_due',
      message: `Your payment of ₹${pay.amount.toLocaleString('en-IN')} is due for ${pay.periodLabel}.`,
      createdAt: now,
      read: false,
    });
  }

  // Payment success notifications
  for (const pay of payments.filter(p => p.status === 'Paid').slice(0, 30)) {
    notifications.push({
      id: makeId('ntf', idx++),
      audienceRole: 'user',
      franchiseId: pay.franchiseId,
      userId: pay.userId,
      kind: 'payment_success',
      message: `Payment of ₹${pay.amount.toLocaleString('en-IN')} for ${pay.periodLabel} confirmed.`,
      createdAt: pay.paidAt ?? now,
      read: true,
    });
  }

  // Plan completed notifications
  for (const user of users.filter(u => u.status === 'PLAN_COMPLETED')) {
    notifications.push({
      id: makeId('ntf', idx++),
      audienceRole: 'user',
      franchiseId: user.franchiseId,
      userId: user.id,
      kind: 'plan_completed',
      message: 'Your savings plan has completed! Redeem your vault balance in the marketplace.',
      createdAt: now,
      read: false,
    });
  }

  return notifications;
}

// ---------------------------------------------------------------------------
// Activity Log
// ---------------------------------------------------------------------------

export function generateActivityLog(
  draws: Draw[],
  users: FranchiseUser[],
  payments: Payment[],
): ActivityLogEntry[] {
  const log: ActivityLogEntry[] = [];
  let idx = 1;
  const now = new Date().toISOString();

  for (const draw of draws.filter(d => d.status === 'completed')) {
    log.push({
      id: makeId('act', idx++),
      franchiseId: draw.franchiseId,
      actorRole: 'franchise',
      action: 'draw.completed',
      targetType: 'draw',
      targetId: draw.id,
      createdAt: draw.executedAt ?? now,
      meta: { month: draw.month, winnerCount: draw.winners.length },
    });
    for (const winner of draw.winners) {
      log.push({
        id: makeId('act', idx++),
        franchiseId: draw.franchiseId,
        actorRole: 'franchise',
        action: 'user.won',
        targetType: 'user',
        targetId: winner.userId,
        createdAt: draw.executedAt ?? now,
        meta: { drawId: draw.id, prizeId: winner.prizeId, rank: winner.rank },
      });
    }
  }

  for (const pay of payments.filter(p => p.status === 'Paid').slice(0, 50)) {
    log.push({
      id: makeId('act', idx++),
      franchiseId: pay.franchiseId,
      actorRole: 'user',
      action: 'payment.completed',
      targetType: 'payment',
      targetId: pay.id,
      createdAt: pay.paidAt ?? now,
      meta: { amount: pay.amount, month: pay.month },
    });
  }

  for (const user of users.slice(0, 20)) {
    log.push({
      id: makeId('act', idx++),
      franchiseId: user.franchiseId,
      actorRole: 'franchise',
      action: 'user.registered',
      targetType: 'user',
      targetId: user.id,
      createdAt: user.joinedAt,
      meta: { planId: user.planId },
    });
  }

  return log;
}

// ---------------------------------------------------------------------------
// Master generate() — produces the full seed dataset in dependency order
// ---------------------------------------------------------------------------

export interface SeedData {
  franchises: Franchise[];
  groupTypes: GroupType[];
  groups: Group[];
  plans: Plan[];
  users: FranchiseUser[];
  payments: Payment[];
  vaults: Vault[];
  prizes: Prize[];
  draws: Draw[];
  products: Product[];
  purchases: Purchase[];
  notifications: NotificationEvent[];
  activityLog: ActivityLogEntry[];
}

export function generateSeedData(): SeedData {
  const franchises = generateFranchises();
  const groupTypes = GROUP_TYPES;
  const groups = generateGroups(franchises);
  const plans = generatePlans(groups);
  const users = generateUsers(plans);
  const payments = generatePayments(users, plans);
  const vaults = generateVaults(users, payments);
  const prizes = generatePrizes(franchises);
  const { draws, updatedUsers } = generateDraws(plans, users, prizes, payments);
  const products = generateProducts();
  const notifications = generateNotifications(draws, updatedUsers, payments);
  const activityLog = generateActivityLog(draws, updatedUsers, payments);

  // Update group memberCounts
  const memberCountByGroup = new Map<string, number>();
  for (const u of updatedUsers) {
    memberCountByGroup.set(u.groupId, (memberCountByGroup.get(u.groupId) ?? 0) + 1);
  }
  const groupsWithCounts = groups.map(g => ({
    ...g,
    memberCount: memberCountByGroup.get(g.id) ?? 0,
  }));

  return {
    franchises,
    groupTypes,
    groups: groupsWithCounts,
    plans,
    users: updatedUsers,
    payments,
    vaults,
    prizes,
    draws,
    products,
    purchases: [], // populated via user interactions
    notifications,
    activityLog,
  };
}
