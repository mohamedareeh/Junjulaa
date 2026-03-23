import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hash } from "bcryptjs";
import * as schema from "./schema";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Seeding database...");

  // Create admin user
  const passwordHash = await hash("admin123", 12);
  await db.insert(schema.users).values([
    {
      name: "Producer Admin",
      email: "admin@junejunal.com",
      passwordHash,
      role: "producer",
    },
    {
      name: "Director One",
      email: "director@junejunal.com",
      passwordHash,
      role: "director",
    },
    {
      name: "Crew Member",
      email: "crew@junejunal.com",
      passwordHash,
      role: "crew",
    },
  ]);
  console.log("Users created");

  // Create 10 episodes
  const episodeData = [
    { number: 1, title: "Pilot", synopsis: "The story begins.", director: "Director One", status: "completed" as const },
    { number: 2, title: "The Discovery", synopsis: "A revelation changes everything.", director: "Director One", status: "completed" as const },
    { number: 3, title: "Rising Tension", synopsis: "Stakes are raised.", director: "Director One", status: "post_production" as const },
    { number: 4, title: "The Turning Point", synopsis: "Nothing will be the same.", director: "Director One", status: "post_production" as const },
    { number: 5, title: "Crossroads", synopsis: "Characters face difficult choices.", director: "Director One", status: "filming" as const },
    { number: 6, title: "Unraveling", synopsis: "Secrets come to light.", director: "Director One", status: "filming" as const },
    { number: 7, title: "The Confrontation", synopsis: "Tensions boil over.", director: "Director One", status: "pre_production" as const },
    { number: 8, title: "Aftermath", synopsis: "Dealing with consequences.", director: "Director One", status: "pre_production" as const },
    { number: 9, title: "The Resolution", synopsis: "Paths converge.", director: "Director One", status: "pre_production" as const },
    { number: 10, title: "Finale", synopsis: "The conclusion.", director: "Director One", status: "pre_production" as const },
  ];
  await db.insert(schema.episodes).values(episodeData);
  console.log("Episodes created");

  // Create cast members
  await db.insert(schema.castMembers).values([
    { name: "Sarah Johnson", email: "sarah@example.com", phone: "+1-555-0101", bio: "Lead actress with 10 years of experience.", dayRate: "1500.00" },
    { name: "Michael Chen", email: "michael@example.com", phone: "+1-555-0102", bio: "Versatile actor known for dramatic roles.", dayRate: "1200.00" },
    { name: "Emma Williams", email: "emma@example.com", phone: "+1-555-0103", bio: "Rising star from theater.", dayRate: "800.00" },
    { name: "James Brown", email: "james@example.com", phone: "+1-555-0104", bio: "Character actor.", dayRate: "1000.00" },
    { name: "Olivia Davis", email: "olivia@example.com", phone: "+1-555-0105", bio: "Award-winning supporting actress.", dayRate: "1100.00" },
  ]);
  console.log("Cast members created");

  // Create crew members
  await db.insert(schema.crewMembers).values([
    { name: "Alex Turner", email: "alex@example.com", phone: "+1-555-0201", department: "Camera", roleTitle: "Director of Photography", dayRate: "2000.00" },
    { name: "Maria Garcia", email: "maria@example.com", phone: "+1-555-0202", department: "Sound", roleTitle: "Sound Mixer", dayRate: "800.00" },
    { name: "David Kim", email: "david@example.com", phone: "+1-555-0203", department: "Lighting", roleTitle: "Gaffer", dayRate: "700.00" },
    { name: "Lisa Park", email: "lisa@example.com", phone: "+1-555-0204", department: "Art", roleTitle: "Production Designer", dayRate: "900.00" },
    { name: "Tom Wilson", email: "tom@example.com", phone: "+1-555-0205", department: "Camera", roleTitle: "Camera Operator", dayRate: "600.00" },
    { name: "Amy Chen", email: "amy@example.com", phone: "+1-555-0206", department: "Wardrobe", roleTitle: "Costume Designer", dayRate: "750.00" },
  ]);
  console.log("Crew members created");

  // Create locations
  await db.insert(schema.locations).values([
    { name: "Downtown Loft", address: "123 Main St, Los Angeles, CA", costPerDay: "2500.00", notes: "Great natural light, street noise after 5pm" },
    { name: "Beach House", address: "456 Pacific Coast Hwy, Malibu, CA", costPerDay: "5000.00", notes: "Permit required for beach shots" },
    { name: "Warehouse District", address: "789 Industrial Ave, LA, CA", costPerDay: "1500.00", notes: "Large open space, echo issues" },
    { name: "City Park", address: "321 Park Ave, Los Angeles, CA", costPerDay: "800.00", permitInfo: "City permit #LP-2024-001", notes: "Public park, best to shoot early morning" },
  ]);
  console.log("Locations created");

  // Create some budgets
  const categories = ["equipment", "location", "catering", "transport", "costumes", "talent"] as const;
  for (let ep = 1; ep <= 10; ep++) {
    for (const cat of categories) {
      await db.insert(schema.budgets).values({
        episodeId: ep,
        category: cat,
        allocatedAmount: cat === "talent" ? "15000.00" : cat === "equipment" ? "5000.00" : cat === "location" ? "8000.00" : "3000.00",
      });
    }
  }
  console.log("Budgets created");

  // Create some expenses for completed/in-progress episodes
  const sampleExpenses = [
    { episodeId: 1, category: "equipment" as const, description: "Camera rental - RED Komodo", amount: "3500.00", date: "2024-01-15", paymentStatus: "paid" as const },
    { episodeId: 1, category: "location" as const, description: "Downtown Loft - 3 days", amount: "7500.00", date: "2024-01-16", paymentStatus: "paid" as const },
    { episodeId: 1, category: "catering" as const, description: "Craft services week 1", amount: "2200.00", date: "2024-01-17", paymentStatus: "paid" as const },
    { episodeId: 2, category: "equipment" as const, description: "Lighting package", amount: "1800.00", date: "2024-02-10", paymentStatus: "paid" as const },
    { episodeId: 2, category: "talent" as const, description: "Lead actor - 5 days", amount: "7500.00", date: "2024-02-12", paymentStatus: "paid" as const },
    { episodeId: 3, category: "location" as const, description: "Beach House - 2 days", amount: "10000.00", date: "2024-03-05", paymentStatus: "pending" as const },
    { episodeId: 3, category: "transport" as const, description: "Equipment truck rental", amount: "1200.00", date: "2024-03-06", paymentStatus: "pending" as const },
    { episodeId: 5, category: "catering" as const, description: "On-set meals", amount: "1500.00", date: "2024-04-20", paymentStatus: "overdue" as const },
  ];
  await db.insert(schema.expenses).values(sampleExpenses);
  console.log("Expenses created");

  console.log("Seed complete!");
}

seed().catch(console.error);
