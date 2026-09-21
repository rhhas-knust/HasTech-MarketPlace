/**
 * Seeds one realistic development store (a fictional Christian bookshop,
 * "Amara Books", selling books and graduation sashes -- the platform's
 * first real client's use case) so the dashboard and storefront aren't
 * empty during local development.
 *
 * Deliberately does NOT seed orders, payments or analytics events: those
 * must come from real usage (signing up, adding to cart, checking out).
 * Faking them would violate the "no fake data" rule -- the whole point of
 * seeding the catalogue is so you have something real to click "Add to
 * Cart" on.
 *
 * Safe to re-run: everything is upserted by its natural unique key.
 *
 * Usage: npm run seed   (reads .env.local)
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SEED_OWNER_EMAIL = "owner@amarabooks.test";
const SEED_OWNER_PASSWORD = "AmaraBooks#2024";

async function ensureOwner(): Promise<string> {
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing?.users.find((u) => u.email === SEED_OWNER_EMAIL);
  if (found) return found.id;

  const { data, error } = await admin.auth.admin.createUser({
    email: SEED_OWNER_EMAIL,
    password: SEED_OWNER_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Amara Owusu" },
  });
  if (error || !data.user) throw error ?? new Error("Failed to create seed owner");
  return data.user.id;
}

async function main() {
  console.log("Seeding development data...");
  const ownerId = await ensureOwner();

  const { data: store, error: storeError } = await admin
    .from("stores")
    .upsert(
      {
        owner_id: ownerId,
        name: "Amara Books",
        slug: "amara-books",
        business_type: "retail",
        status: "active",
        description:
          "Books, Bibles, devotionals and graduation sashes for churches, schools and individuals across Ghana.",
        contact_email: "hello@amarabooks.test",
        contact_phone: "0240000000",
        whatsapp_number: "0240000000",
        address: "Osu Oxford Street",
        city: "Accra",
        region: "Greater Accra",
        country: "Ghana",
        currency: "GHS",
        timezone: "Africa/Accra",
        published_at: new Date().toISOString(),
        theme: { accentColor: "#b45309" },
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (storeError || !store) throw storeError ?? new Error("Failed to seed store");
  const storeId = store.id;
  console.log(`Store ready: amara-books (${storeId})`);

  await admin.from("store_settings").update({
    delivery_enabled: true,
    pickup_enabled: true,
    delivery_fee: 15,
    free_delivery_threshold: 200,
    delivery_notes: "Delivery within Accra takes 1-2 working days.",
    low_stock_threshold: 5,
  }).eq("store_id", storeId);

  const categories = [
    { name: "Books", slug: "books", description: "Bibles, devotionals and Christian literature." },
    { name: "Graduation Sashes", slug: "graduation-sashes", description: "Sashes for schools, churches and events." },
  ];
  const categoryIds: Record<string, string> = {};
  for (const category of categories) {
    const { data } = await admin
      .from("categories")
      .upsert({ store_id: storeId, ...category }, { onConflict: "store_id,slug" })
      .select("id, slug")
      .single();
    if (data) categoryIds[data.slug] = data.id;
  }
  console.log(`Categories ready: ${Object.keys(categoryIds).join(", ")}`);

  const products = [
    {
      name: "Understanding Salvation",
      slug: "understanding-salvation",
      category: "books",
      description: "A clear, accessible guide to the foundations of Christian faith. Paperback, 220 pages.",
      price: 45,
      salePrice: null,
      stock: 34,
      featured: true,
    },
    {
      name: "Christian Leadership for a New Generation",
      slug: "christian-leadership-new-generation",
      category: "books",
      description: "Practical leadership lessons for youth pastors and campus fellowship leaders.",
      price: 60,
      salePrice: 50,
      stock: 18,
      featured: true,
    },
    {
      name: "The Study Bible (NIV, Hardcover)",
      slug: "study-bible-niv-hardcover",
      category: "books",
      description: "Full-colour study Bible with maps, concordance and study notes.",
      price: 180,
      salePrice: null,
      stock: 12,
      featured: true,
    },
    {
      name: "Daily Devotions for Busy Professionals",
      slug: "daily-devotions-busy-professionals",
      category: "books",
      description: "365 short devotions written for people with packed schedules.",
      price: 35,
      salePrice: null,
      stock: 40,
      featured: false,
    },
    {
      name: "Prayer That Moves Mountains",
      slug: "prayer-that-moves-mountains",
      category: "books",
      description: "A practical guide to a consistent, effective prayer life.",
      price: 40,
      salePrice: null,
      stock: 3,
      featured: false,
    },
    {
      name: "Children's Bible Story Collection",
      slug: "childrens-bible-story-collection",
      category: "books",
      description: "Illustrated Bible stories for children aged 4-10.",
      price: 55,
      salePrice: null,
      stock: 22,
      featured: false,
    },
    {
      name: "Graduation Sash — Gold",
      slug: "graduation-sash-gold",
      category: "graduation-sashes",
      description: "Satin graduation sash in gold, one size fits all. Ideal for school and university graduations.",
      price: 35,
      salePrice: null,
      stock: 50,
      featured: true,
    },
    {
      name: "Graduation Sash — Royal Blue",
      slug: "graduation-sash-royal-blue",
      category: "graduation-sashes",
      description: "Satin graduation sash in royal blue with gold trim.",
      price: 35,
      salePrice: null,
      stock: 45,
      featured: false,
    },
    {
      name: "Church Choir Sash — White & Purple",
      slug: "church-choir-sash-white-purple",
      category: "graduation-sashes",
      description: "Ceremonial sash for church choirs and events.",
      price: 40,
      salePrice: 32,
      stock: 20,
      featured: false,
    },
    {
      name: "Custom Embroidered Sash (Made to Order)",
      slug: "custom-embroidered-sash",
      category: "graduation-sashes",
      description: "Personalised sash with embroidered name/title. Contact us before ordering for lead time.",
      price: 70,
      salePrice: null,
      stock: 8,
      featured: false,
    },
  ];

  for (const product of products) {
    await admin.from("products").upsert(
      {
        store_id: storeId,
        category_id: categoryIds[product.category] ?? null,
        product_type: "physical",
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        sale_price: product.salePrice,
        stock_quantity: product.stock,
        track_inventory: true,
        status: "published",
        featured: product.featured,
        published_at: new Date().toISOString(),
      },
      { onConflict: "store_id,slug" },
    );
  }
  console.log(`Seeded ${products.length} products.`);

  console.log("\nDone. Sign in with:");
  console.log(`  email:    ${SEED_OWNER_EMAIL}`);
  console.log(`  password: ${SEED_OWNER_PASSWORD}`);
  console.log("Storefront: /store/amara-books");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
