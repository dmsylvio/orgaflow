import "dotenv/config";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { uuidv7 } from "uuidv7";
import * as schema from "../src/server/db/schemas";

const OWNER_EMAIL = "dmsylvio@gmail.com";
const ORG_SLUG = "orgaflow-content-demo";
const ORG_NAME = "Orgaflow Creative Studio";
const NOW = new Date("2026-04-22T12:00:00.000Z");
const CUSTOMER_COUNT = 200;
const INVOICE_MIN_TOTAL = 800;
const INVOICE_MAX_TOTAL = 15_000;
const EXPENSE_MIN = 800;
const EXPENSE_MAX = 15_000;

type CustomerRow = typeof schema.customers.$inferInsert & { id: string };
type ItemRow = typeof schema.items.$inferInsert & { id: string };
type InvoiceRow = typeof schema.invoices.$inferInsert & { id: string };
type EstimateRow = typeof schema.estimates.$inferInsert & { id: string };

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

const db = drizzle(pool, { schema });

const firstNames = [
  "Adair",
  "Adrian",
  "Aerin",
  "Afton",
  "Aiden",
  "Alex",
  "Ali",
  "Amari",
  "Amit",
  "Andie",
  "Andy",
  "Angel",
  "Arden",
  "Ari",
  "Arlyn",
  "Ashton",
  "Aspen",
  "August",
  "Austen",
  "Avery",
  "Azariah",
  "Bay",
  "Bellamy",
  "Bergen",
  "Billie",
  "Blair",
  "Blake",
  "Bowen",
  "Bowie",
  "Braeden",
  "Briar",
  "Brice",
  "Brit",
  "Britton",
  "Brook",
  "Bryn",
  "Caden",
  "Cal",
  "Cameron",
  "Campbell",
  "Carey",
  "Carson",
  "Casey",
  "Cassidy",
  "Channing",
  "Charlie",
  "Chris",
  "Clay",
  "Collins",
  "Corey",
  "Courtney",
  "Cypress",
  "Dakota",
  "Dale",
  "Dallas",
  "Dana",
  "Darby",
  "Darian",
  "Dell",
  "Denim",
  "Devon",
  "Dominique",
  "Dorian",
  "Drew",
  "Easton",
  "Eden",
  "Ehren",
  "Ellery",
  "Elliot",
  "Ellis",
  "Ember",
  "Emerson",
  "Emery",
  "Finley",
  "Francis",
  "Frankie",
  "Garnet",
  "Gray",
  "Greer",
  "Harley",
  "Haven",
  "Hayden",
  "Hollis",
  "Iman",
  "Indigo",
  "Ira",
  "Ivory",
  "Jackie",
  "Jaden",
  "Jael",
  "Jaime",
  "Jamie",
  "Jaylin",
  "Jean",
  "Jesse",
  "Jessie",
  "Jet",
  "Jo",
  "Jody",
  "Joey",
  "Jordan",
  "Jude",
  "Jules",
  "Justice",
  "Kai",
  "Kameron",
  "Keaton",
  "Keely",
  "Kelly",
  "Kendall",
  "Kennedy",
  "Kerry",
  "Kieran",
  "Kit",
  "Kris",
  "Kyler",
  "Lake",
  "Landry",
  "Lane",
  "Laramie",
  "Lee",
  "Legacy",
  "Leighton",
  "Lennon",
  "Lennox",
  "Leslie",
  "Linden",
  "Lindsay",
  "Logan",
  "Lou",
  "Lynn",
  "Lyric",
  "Mackenzie",
  "Marin",
  "Marley",
  "McKinley",
  "Mica",
  "Micah",
  "Milan",
  "Miller",
  "Monroe",
  "Montana",
  "Morgan",
  "Murphy",
  "Navy",
  "Noel",
  "Ocean",
  "Onyx",
  "Palmer",
  "Paris",
  "Parker",
  "Patton",
  "Payton",
  "Peyton",
  "Phoenix",
  "Poet",
  "Presley",
  "Quartz",
  "Quest",
  "Quinn",
  "Rain",
  "Ramsey",
  "Reagan",
  "Reed",
  "Reese",
  "Remy",
  "Ridley",
  "Riley",
  "Rio",
  "River",
  "Robin",
  "Rory",
  "Rowan",
  "Royal",
  "Sage",
  "Salem",
  "Sam",
  "Scout",
  "Shannon",
  "Shepard",
  "Shiloh",
  "Sidney",
  "Sky",
  "Skylar",
  "Skyler",
  "Sloan",
  "Spencer",
  "Stevie",
  "Storm",
  "Sunny",
  "Sydney",
  "Tatum",
  "Taylor",
  "Teagan",
  "Toni",
  "Tracy",
  "Val",
  "Vesper",
  "West",
  "Wren",
];

const cityData = [
  ["New York", "NY"],
  ["Los Angeles", "CA"],
  ["Austin", "TX"],
  ["Chicago", "IL"],
  ["Miami", "FL"],
  ["Seattle", "WA"],
  ["Denver", "CO"],
  ["Boston", "MA"],
  ["Atlanta", "GA"],
  ["San Francisco", "CA"],
  ["Nashville", "TN"],
  ["Portland", "OR"],
  ["San Diego", "CA"],
  ["Dallas", "TX"],
  ["Houston", "TX"],
  ["Phoenix", "AZ"],
  ["Philadelphia", "PA"],
  ["Charlotte", "NC"],
  ["Detroit", "MI"],
  ["Minneapolis", "MN"],
  ["Tampa", "FL"],
  ["Orlando", "FL"],
  ["Salt Lake City", "UT"],
  ["Las Vegas", "NV"],
  ["Columbus", "OH"],
  ["Cleveland", "OH"],
  ["Pittsburgh", "PA"],
  ["Raleigh", "NC"],
  ["Kansas City", "MO"],
  ["St. Louis", "MO"],
  ["Indianapolis", "IN"],
  ["Milwaukee", "WI"],
  ["New Orleans", "LA"],
  ["Sacramento", "CA"],
  ["San Jose", "CA"],
  ["Richmond", "VA"],
  ["Norfolk", "VA"],
  ["Boulder", "CO"],
  ["Boise", "ID"],
  ["Albuquerque", "NM"],
  ["Omaha", "NE"],
  ["Madison", "WI"],
] as const;

const serviceCatalog = [
  ["Brand Strategy Sprint", 2800],
  ["Campaign Landing Page", 4200],
  ["Instagram Carousel Design", 850],
  ["Paid Social Creative Pack", 1600],
  ["Email Nurture Sequence", 1250],
  ["Monthly Content Retainer", 6200],
  ["SEO Content Brief", 740],
  ["Product Launch Kit", 5400],
  ["Analytics Dashboard Setup", 3100],
  ["CRM Workflow Automation", 3800],
  ["Sales Deck Design", 2300],
  ["Website Copywriting", 2900],
  ["Short-form Video Package", 1950],
  ["Market Research Report", 3600],
  ["Customer Journey Audit", 2200],
  ["Visual Identity Refresh", 7600],
  ["Ad Account Optimization", 1800],
  ["Lead Magnet Design", 1400],
  ["Social Media Calendar", 1100],
  ["Executive Presentation", 2600],
  ["Customer Retention Playbook", 3200],
  ["Conversion Rate Optimization", 4600],
  ["Influencer Outreach Program", 3900],
  ["Podcast Production Package", 5100],
  ["YouTube Content System", 5800],
  ["Quarterly Marketing Plan", 4700],
  ["Email Deliverability Audit", 2100],
  ["Community Growth Strategy", 3350],
  ["LinkedIn Authority Package", 2650],
  ["Lifecycle Automation Setup", 4400],
  ["Customer Interview Sprint", 2950],
  ["Event Promotion Campaign", 3600],
  ["Brand Voice Guidelines", 1850],
  ["Performance Creative Lab", 4300],
  ["Website UX Audit", 2750],
  ["Paid Search Optimization", 3450],
  ["Content Repurposing Kit", 1700],
  ["Case Study Production", 2400],
  ["Partner Marketing Toolkit", 3550],
  ["Ecommerce Funnel Build", 6200],
] as const;

const expenseNames = [
  "Creative contractor payout",
  "Stock photography license",
  "Video editing support",
  "Ad testing budget",
  "Podcast sponsorship",
  "Research tools",
  "Design software",
  "Client workshop catering",
  "Cloud rendering credits",
  "Printing and samples",
  "Freelance copywriting",
  "Studio equipment rental",
  "Motion graphics outsourcing",
  "Client gift box shipment",
  "Website hosting annual plan",
  "Color grading specialist",
  "Audio post-production",
  "Paid media freelancer",
  "CRM app marketplace plugin",
  "A/B testing platform subscription",
  "Customer interview incentive",
  "Event booth collateral",
  "Travel reimbursement",
  "Project management subscription",
  "AI credits for design iterations",
  "Domain and DNS renewals",
  "Live streaming setup rental",
  "Data enrichment service",
  "Legal review for campaign terms",
  "Accessibility audit contractor",
  "Localization translation service",
  "Performance bonus payout",
];

const lastNameRoots = [
  "Ander",
  "Baker",
  "Carter",
  "Dalton",
  "Ever",
  "Foster",
  "Grayer",
  "Harper",
  "Iverson",
  "Jasper",
  "Kendr",
  "Lawr",
  "Marl",
  "Norton",
  "Oak",
  "Parker",
  "Quill",
  "Rainer",
  "Saw",
  "Turn",
] as const;

const lastNameSuffixes = [
  "son",
  "ton",
  "ford",
  "well",
  "man",
  "field",
  "brook",
  "ley",
  "ridge",
  "wood",
] as const;

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length];
}

function money(value: number): string {
  return value.toFixed(3);
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(days: number): Date {
  const date = new Date(NOW);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function randomUnit(seedA: number, seedB = 0): number {
  const raw = Math.sin(seedA * 12.9898 + seedB * 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

function randomBetween(
  min: number,
  max: number,
  seedA: number,
  seedB = 0,
): number {
  return min + randomUnit(seedA, seedB) * (max - min);
}

function uniqueContactLastName(index: number): string {
  const rootCount = lastNameRoots.length;
  const suffixCount = lastNameSuffixes.length;

  if (index >= rootCount * suffixCount) {
    throw new Error("Not enough unique contact last name combinations.");
  }

  const root = lastNameRoots[index % rootCount];
  const suffix = lastNameSuffixes[Math.floor(index / rootCount) % suffixCount];
  return `${root}${suffix}`;
}

function uniqueDisplayName(index: number): string {
  if (index >= firstNames.length) {
    throw new Error("Not enough unique first names for CUSTOMER_COUNT.");
  }
  return `${firstNames[index]} ${uniqueContactLastName(index)}`;
}

function distributeDate(index: number, total: number): Date {
  const spread = Math.floor((index / Math.max(total - 1, 1)) * 364);
  const wobble = (index * 7) % 11;
  return daysAgo(364 - spread + wobble);
}

function invoiceStatus(index: number): InvoiceRow["status"] {
  const bucket = index % 20;
  if (bucket < 10) return "PAID";
  if (bucket < 13) return "PARTIALLY_PAID";
  if (bucket < 16) return "SENT";
  if (bucket < 18) return "OVERDUE";
  if (bucket === 18) return "PENDING";
  return "DRAFT";
}

function estimateStatus(index: number): EstimateRow["status"] {
  const bucket = index % 20;
  if (bucket < 7) return "APPROVED";
  if (bucket < 11) return "SENT";
  if (bucket < 14) return "VIEWED";
  if (bucket < 17) return "REJECTED";
  if (bucket < 19) return "EXPIRED";
  return "DRAFT";
}

async function insertBatches<T extends Record<string, unknown>>(
  table: Parameters<typeof db.insert>[0],
  rows: T[],
  size = 500,
) {
  for (let i = 0; i < rows.length; i += size) {
    await db.insert(table).values(rows.slice(i, i + size));
  }
}

async function getOrCreateCurrency() {
  const [existing] = await db
    .select()
    .from(schema.currencies)
    .where(eq(schema.currencies.code, "USD"))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(schema.currencies)
    .values({
      name: "US Dollar",
      code: "USD",
      symbol: "$",
      precision: 2,
      thousandSeparator: ",",
      decimalSeparator: ".",
      swapCurrencySymbol: false,
    })
    .returning();

  if (!created) throw new Error("Could not create USD currency.");
  return created;
}

async function getOrCreateUnit(name: string) {
  const [existing] = await db
    .select()
    .from(schema.units)
    .where(eq(schema.units.name, name))
    .limit(1);

  if (existing) return existing;

  const [created] = await db.insert(schema.units).values({ name }).returning();

  if (!created) throw new Error(`Could not create unit ${name}.`);
  return created;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }

  const [owner] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, OWNER_EMAIL))
    .limit(1);

  if (!owner) {
    throw new Error(`User ${OWNER_EMAIL} was not found.`);
  }

  const [existingOrg] = await db
    .select({ id: schema.organizations.id })
    .from(schema.organizations)
    .where(eq(schema.organizations.slug, ORG_SLUG))
    .limit(1);

  if (existingOrg) {
    await db
      .delete(schema.organizations)
      .where(eq(schema.organizations.id, existingOrg.id));
  }

  const usd = await getOrCreateCurrency();
  const hour = await getOrCreateUnit("hour");
  const project = await getOrCreateUnit("project");

  const orgId = uuidv7();

  await db.insert(schema.organizations).values({
    id: orgId,
    name: ORG_NAME,
    slug: ORG_SLUG,
    ownerUserId: owner.id,
    addressLine1: "120 Market Street",
    addressLine2: "Suite 420",
    city: "Austin",
    region: "TX",
    postalCode: "78701",
    businessPhone: "+1 (512) 555-0142",
    createdAt: daysAgo(365),
    updatedAt: NOW,
  });

  await db.insert(schema.organizationMembers).values({
    organizationId: orgId,
    userId: owner.id,
    isOwner: true,
    joinedAt: daysAgo(365),
    createdAt: daysAgo(365),
    updatedAt: NOW,
  });

  await db.insert(schema.organizationSubscriptions).values({
    organizationId: orgId,
    plan: "scale",
    status: "active",
    currentPeriodStart: daysAgo(30),
    currentPeriodEnd: addDays(NOW, 335),
    createdAt: daysAgo(365),
    updatedAt: NOW,
  });

  await db.insert(schema.organizationPreferences).values({
    organizationId: orgId,
    defaultCurrencyId: usd.id,
    language: "en",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    financialYearStart: "january-december",
    publicLinksExpireEnabled: false,
    publicLinksExpireDays: 30,
    invoiceTemplate: 3,
    estimateTemplate: 3,
    createdAt: daysAgo(365),
    updatedAt: NOW,
  });

  const paymentModesRows = ["Credit Card", "Bank Transfer", "ACH", "Check"].map(
    (name, index) => ({
      id: uuidv7(),
      organizationId: orgId,
      name,
      isDefault: index === 0,
      createdAt: daysAgo(365),
      updatedAt: NOW,
    }),
  );
  await db.insert(schema.paymentModes).values(paymentModesRows);

  const categoryRows = [
    "Advertising",
    "Contractors",
    "Software",
    "Research",
    "Production",
    "Travel",
    "Office",
    "Professional Services",
  ].map((name) => ({
    id: uuidv7(),
    organizationId: orgId,
    name,
    description: `${name} expenses for marketing operations.`,
    createdAt: daysAgo(365),
    updatedAt: NOW,
  }));
  await db.insert(schema.expenseCategories).values(categoryRows);

  const taskStageRows = [
    ["Backlog", "backlog", "#64748b"],
    ["In Progress", "in-progress", "#2563eb"],
    ["Waiting on Client", "waiting-on-client", "#f59e0b"],
    ["Done", "done", "#10b981"],
  ].map(([name, slug, color], index) => ({
    id: uuidv7(),
    organizationId: orgId,
    name,
    slug,
    color,
    position: index,
    isSystem: true,
    systemKey: slug,
    createdBy: owner.id,
    createdAt: daysAgo(365),
    updatedAt: NOW,
  }));
  await db.insert(schema.taskStages).values(taskStageRows);

  const customerRows: CustomerRow[] = Array.from(
    { length: CUSTOMER_COUNT },
    (_, index) => {
      const brand = uniqueDisplayName(index);
      const [city, state] = pick(cityData, index);
      const createdAt = distributeDate(index, CUSTOMER_COUNT);

      return {
        id: uuidv7(),
        organizationId: orgId,
        displayName: brand,
        primaryContactName: `${pick(firstNames, index + 5)} ${uniqueContactLastName(index)}`,
        email: `client${String(index + 1).padStart(4, "0")}@orgaflow.dev`,
        phone: `+1 (555) ${String(100 + (index % 800)).padStart(3, "0")}-${String(1000 + index).slice(-4)}`,
        website: `https://client${String(index + 1).padStart(4, "0")}.orgaflow.dev`,
        prefix: index % 3 === 0 ? "LLC" : index % 3 === 1 ? "Inc." : "Co.",
        name: `${brand} ${index % 2 === 0 ? "LLC" : "Inc."}`,
        state,
        city,
        address: `${100 + index} ${pick(["Main", "Market", "Cedar", "Oak", "River"], index)} Street`,
        zipCode: String(10000 + ((index * 37) % 89999)),
        addressPhone: `+1 (555) ${String(200 + (index % 700)).padStart(3, "0")}-${String(2000 + index).slice(-4)}`,
        createdAt,
        updatedAt: createdAt,
      };
    },
  );
  await insertBatches(schema.customers, customerRows);

  const itemRows: ItemRow[] = Array.from({ length: 80 }, (_, index) => {
    const [name, basePrice] = pick(serviceCatalog, index);
    const price = basePrice + (index % 5) * 175;
    return {
      id: uuidv7(),
      organizationId: orgId,
      name: `${name}${index >= serviceCatalog.length ? ` ${Math.floor(index / serviceCatalog.length) + 1}` : ""}`,
      price: money(price),
      unitId: index % 4 === 0 ? hour.id : project.id,
      description: `Demo service package for content, marketing, and client operations.`,
      createdAt: daysAgo(360 - (index % 60)),
      updatedAt: NOW,
    };
  });
  await insertBatches(schema.items, itemRows);

  const invoiceRows: InvoiceRow[] = [];
  const invoiceItemRows: (typeof schema.invoiceItems.$inferInsert)[] = [];

  const invoiceMinSubTotal = INVOICE_MIN_TOTAL / 1.0825;
  const invoiceMaxSubTotal = INVOICE_MAX_TOTAL / 1.0825;

  for (let i = 0; i < 800; i++) {
    const id = uuidv7();
    const invoiceDate = distributeDate(i, 800);
    const status = invoiceStatus(i);
    const lineCount = 2 + (i % 4);
    const targetSubTotal = randomBetween(
      invoiceMinSubTotal,
      invoiceMaxSubTotal,
      i,
      101,
    );

    const lineWeights = Array.from({ length: lineCount }, (_, line) =>
      randomBetween(0.55, 1.85, i, line + 401),
    );
    const weightSum = lineWeights.reduce((sum, value) => sum + value, 0);
    let subTotal = 0;

    for (let line = 0; line < lineCount; line++) {
      const item = pick(itemRows, i * 3 + line);
      const quantity = 1 + ((i + line) % 3);
      const lineTotal = targetSubTotal * (lineWeights[line] / weightSum);
      const price = lineTotal / quantity;
      const discountVal = 0;
      subTotal += lineTotal;
      invoiceItemRows.push({
        organizationId: orgId,
        invoiceId: id,
        itemId: item.id,
        name: item.name,
        description: item.description,
        unitName: item.unitId === hour.id ? "hour" : "project",
        quantity: quantity.toFixed(4),
        price: money(price),
        discountType: "fixed",
        discount: discountVal > 0 ? money(discountVal) : null,
        discountVal: money(discountVal),
        tax: "0.000",
        total: money(lineTotal),
        createdAt: invoiceDate,
        updatedAt: invoiceDate,
      });
    }

    const tax = subTotal * 0.0825;
    const total = subTotal + tax;
    invoiceRows.push({
      id,
      organizationId: orgId,
      customerId: pick(customerRows, i * 5).id,
      currencyId: usd.id,
      sequenceNumber: i + 1,
      invoiceDate: dateOnly(invoiceDate),
      dueDate: dateOnly(addDays(invoiceDate, 15 + (i % 30))),
      invoiceNumber: `INV-${String(i + 1).padStart(6, "0")}`,
      status,
      publicLinkToken: uuidv7(),
      publicLinkCreatedAt: invoiceDate,
      notes:
        "<p>Thank you for partnering with Orgaflow Creative Studio.</p><p>Payment terms are net 15 unless otherwise agreed.</p>",
      subTotal: money(subTotal),
      tax: money(tax),
      total: money(total),
      discountVal: "0.000",
      baseSubTotal: money(subTotal),
      baseTax: money(tax),
      baseTotal: money(total),
      createdAt: invoiceDate,
      updatedAt: invoiceDate,
    });
  }

  await insertBatches(schema.invoices, invoiceRows);
  await insertBatches(schema.invoiceItems, invoiceItemRows);

  const estimateRows: EstimateRow[] = [];
  const estimateItemRows: (typeof schema.estimateItems.$inferInsert)[] = [];

  for (let i = 0; i < 1200; i++) {
    const id = uuidv7();
    const estimateDate = distributeDate(i, 1200);
    const status = estimateStatus(i);
    const lineCount = 2 + (i % 5);
    let subTotal = 0;

    for (let line = 0; line < lineCount; line++) {
      const item = pick(itemRows, i * 2 + line);
      const quantity = 1 + ((i + line) % 5);
      const price = Number(item.price) * (1 + ((i + line) % 3) * 0.08);
      const discountVal = (i + line) % 9 === 0 ? price * quantity * 0.04 : 0;
      const lineTotal = price * quantity - discountVal;
      subTotal += lineTotal;
      estimateItemRows.push({
        organizationId: orgId,
        estimateId: id,
        itemId: item.id,
        name: item.name,
        description: item.description,
        unitName: item.unitId === hour.id ? "hour" : "project",
        quantity: quantity.toFixed(4),
        price: money(price),
        discountType: "fixed",
        discount: discountVal > 0 ? money(discountVal) : null,
        discountVal: money(discountVal),
        tax: "0.000",
        total: money(lineTotal),
        createdAt: estimateDate,
        updatedAt: estimateDate,
      });
    }

    const tax = subTotal * 0.0825;
    const total = subTotal + tax;
    estimateRows.push({
      id,
      organizationId: orgId,
      customerId: pick(customerRows, i * 7).id,
      currencyId: usd.id,
      sequenceNumber: i + 1,
      customerSequenceNumber: 1 + (i % 12),
      estimateDate: dateOnly(estimateDate),
      expiryDate: dateOnly(addDays(estimateDate, 21 + (i % 14))),
      estimateNumber: `EST-${String(i + 1).padStart(6, "0")}`,
      status,
      publicLinkToken: uuidv7(),
      publicLinkCreatedAt: estimateDate,
      notes:
        "<p>This proposal is tailored for the campaign scope discussed with your team.</p><ul><li>Strategy</li><li>Creative production</li><li>Performance review</li></ul>",
      rejectionReason:
        status === "REJECTED"
          ? "<p>The client decided to revisit the scope next quarter.</p>"
          : null,
      subTotal: money(subTotal),
      tax: money(tax),
      total: money(total),
      discountVal: "0.000",
      baseSubTotal: money(subTotal),
      baseTax: money(tax),
      baseTotal: money(total),
      createdAt: estimateDate,
      updatedAt: estimateDate,
    });
  }

  await insertBatches(schema.estimates, estimateRows);
  await insertBatches(schema.estimateItems, estimateItemRows);

  const paymentRows: (typeof schema.payments.$inferInsert)[] = [];
  let paymentSeq = 1;
  for (const invoice of invoiceRows) {
    const total = Number(invoice.total);
    if (invoice.status === "PAID") {
      const split = Number(invoice.sequenceNumber) % 4 === 0;
      if (split) {
        const first = total * 0.45;
        paymentRows.push({
          organizationId: orgId,
          sequenceNumber: paymentSeq++,
          customerId: invoice.customerId,
          paymentModeId: pick(paymentModesRows, paymentSeq).id,
          currencyId: usd.id,
          amount: money(first),
          paymentDate: dateOnly(
            addDays(new Date(`${invoice.invoiceDate}T00:00:00Z`), 8),
          ),
          invoiceId: invoice.id,
          invoiceRef: invoice.invoiceNumber,
          notes: "First installment received.",
          createdById: owner.id,
          createdAt: addDays(new Date(`${invoice.invoiceDate}T00:00:00Z`), 8),
          updatedAt: addDays(new Date(`${invoice.invoiceDate}T00:00:00Z`), 8),
        });
        paymentRows.push({
          organizationId: orgId,
          sequenceNumber: paymentSeq++,
          customerId: invoice.customerId,
          paymentModeId: pick(paymentModesRows, paymentSeq).id,
          currencyId: usd.id,
          amount: money(total - first),
          paymentDate: dateOnly(
            addDays(new Date(`${invoice.invoiceDate}T00:00:00Z`), 18),
          ),
          invoiceId: invoice.id,
          invoiceRef: invoice.invoiceNumber,
          notes: "Final balance received.",
          createdById: owner.id,
          createdAt: addDays(new Date(`${invoice.invoiceDate}T00:00:00Z`), 18),
          updatedAt: addDays(new Date(`${invoice.invoiceDate}T00:00:00Z`), 18),
        });
      } else {
        paymentRows.push({
          organizationId: orgId,
          sequenceNumber: paymentSeq++,
          customerId: invoice.customerId,
          paymentModeId: pick(paymentModesRows, paymentSeq).id,
          currencyId: usd.id,
          amount: invoice.total,
          paymentDate: dateOnly(
            addDays(new Date(`${invoice.invoiceDate}T00:00:00Z`), 12),
          ),
          invoiceId: invoice.id,
          invoiceRef: invoice.invoiceNumber,
          notes: "Payment received in full.",
          createdById: owner.id,
          createdAt: addDays(new Date(`${invoice.invoiceDate}T00:00:00Z`), 12),
          updatedAt: addDays(new Date(`${invoice.invoiceDate}T00:00:00Z`), 12),
        });
      }
    } else if (invoice.status === "PARTIALLY_PAID") {
      paymentRows.push({
        organizationId: orgId,
        sequenceNumber: paymentSeq++,
        customerId: invoice.customerId,
        paymentModeId: pick(paymentModesRows, paymentSeq).id,
        currencyId: usd.id,
        amount: money(total * 0.42),
        paymentDate: dateOnly(
          addDays(new Date(`${invoice.invoiceDate}T00:00:00Z`), 10),
        ),
        invoiceId: invoice.id,
        invoiceRef: invoice.invoiceNumber,
        notes: "Partial payment received.",
        createdById: owner.id,
        createdAt: addDays(new Date(`${invoice.invoiceDate}T00:00:00Z`), 10),
        updatedAt: addDays(new Date(`${invoice.invoiceDate}T00:00:00Z`), 10),
      });
    }
  }
  await insertBatches(schema.payments, paymentRows);

  const expenseRows: (typeof schema.expenses.$inferInsert)[] = Array.from(
    { length: 900 },
    (_, index) => {
      const expenseDate = distributeDate(index, 900);
      const amount = randomBetween(EXPENSE_MIN, EXPENSE_MAX, index, 901);
      return {
        organizationId: orgId,
        categoryId: pick(categoryRows, index).id,
        customerId: index % 4 === 0 ? pick(customerRows, index * 11).id : null,
        paymentModeId: pick(paymentModesRows, index).id,
        currencyId: usd.id,
        amount: money(amount),
        expenseDate: dateOnly(expenseDate),
        notes: pick(expenseNames, index),
        createdById: owner.id,
        createdAt: expenseDate,
        updatedAt: expenseDate,
      };
    },
  );
  await insertBatches(schema.expenses, expenseRows);

  const taskTitles = [
    "Prepare campaign performance summary",
    "Follow up on proposal feedback",
    "Review invoice payment status",
    "Schedule creative review call",
    "Draft next month content plan",
    "Audit client onboarding workflow",
    "Collect missing brand assets",
    "Publish social media creative set",
  ];

  const taskRows: (typeof schema.tasks.$inferInsert)[] = Array.from(
    { length: 420 },
    (_, index) => {
      const createdAt = distributeDate(index, 420);
      const linkedInvoice =
        index % 2 === 0 ? pick(invoiceRows, index * 3) : null;
      const linkedEstimate =
        index % 2 === 1 ? pick(estimateRows, index * 5) : null;
      const linked = linkedInvoice ?? linkedEstimate;
      return {
        organizationId: orgId,
        stageId: pick(taskStageRows, index).id,
        title: pick(taskTitles, index),
        description:
          "<p>Demo task created for marketing screenshots and workflow examples.</p>",
        priority: pick(["low", "medium", "high", "urgent"] as const, index),
        estimatedDurationMinutes: 30 + (index % 8) * 15,
        dueDate: addDays(createdAt, 3 + (index % 21)),
        ownerId: owner.id,
        sourceType: index % 5 === 0 ? "automation" : "manual",
        sourceEvent: index % 5 === 0 ? "document_follow_up" : null,
        sourceId: linked?.id ?? null,
        linkedDocumentType: linkedInvoice ? "invoice" : "estimate",
        createdAt,
        updatedAt: createdAt,
      };
    },
  );
  await insertBatches(schema.tasks, taskRows);

  console.log(
    JSON.stringify(
      {
        ok: true,
        organization: { id: orgId, name: ORG_NAME, slug: ORG_SLUG },
        owner: OWNER_EMAIL,
        counts: {
          customers: customerRows.length,
          items: itemRows.length,
          estimates: estimateRows.length,
          estimateItems: estimateItemRows.length,
          invoices: invoiceRows.length,
          invoiceItems: invoiceItemRows.length,
          payments: paymentRows.length,
          expenses: expenseRows.length,
          tasks: taskRows.length,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
