import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hash } from "bcryptjs";
import { PrismaClient, type Role } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../.env") });

const db = new PrismaClient();

function credential(prefix: "SUPER_ADMIN" | "ADMIN" | "USER") {
  const email = process.env[`${prefix}_EMAIL`]?.trim().toLowerCase();
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email || !password || password.length < 12) {
    throw new Error(`Set ${prefix}_EMAIL and ${prefix}_PASSWORD (minimum 12 characters) before running the development seed.`);
  }
  return { email, password };
}

async function upsertAccount(role: Role, name: string, email: string, password: string) {
  const passwordHash = await hash(password, 12);
  return db.user.upsert({
    where: { email },
    update: { passwordHash, role, isActive: true, profile: { upsert: { create: { name }, update: { name } } } },
    create: { email, passwordHash, role, profile: { create: { name } } },
  });
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development seed cannot run in production.");
  }
  const [superAdminInput, adminInput, userInput] = [credential("SUPER_ADMIN"), credential("ADMIN"), credential("USER")];
  const [superAdmin, admin, user] = await Promise.all([
    upsertAccount("SUPER_ADMIN", "Development Super Admin", superAdminInput.email, superAdminInput.password),
    upsertAccount("ADMIN", "Development Admin", adminInput.email, adminInput.password),
    upsertAccount("USER", "Development User", userInput.email, userInput.password),
  ]);

  const amenityNames = ["Parking", "Lift", "Security", "Gym", "Swimming Pool", "Power Backup", "Garden", "Clubhouse"];
  const amenities = await Promise.all(amenityNames.map((name) => db.amenity.upsert({
    where: { name },
    update: {},
    create: { name, slug: name.toLowerCase().replaceAll(" ", "-") },
  })));

  const listings = [
    { slug: "dev-light-filled-apartment-hyderabad", title: "Light-filled apartment near Jubilee Hills", city: "Hyderabad", locality: "Jubilee Hills", propertyType: "APARTMENT" as const, listingType: "SALE" as const, price: 12500000, area: 1450, bedrooms: 3 },
    { slug: "dev-garden-villa-bengaluru", title: "Garden villa in a quiet Bengaluru neighbourhood", city: "Bengaluru", locality: "Whitefield", propertyType: "VILLA" as const, listingType: "SALE" as const, price: 24800000, area: 2600, bedrooms: 4 },
    { slug: "dev-city-apartment-pune", title: "Well-planned city apartment close to the metro", city: "Pune", locality: "Baner", propertyType: "APARTMENT" as const, listingType: "RENT" as const, price: 48000, area: 980, bedrooms: 2 },
  ];

  for (const [index, listing] of listings.entries()) {
    await db.property.upsert({
      where: { slug: listing.slug },
      update: { ...listing, ownerId: admin.id, status: "PUBLISHED", publishedAt: new Date() },
      create: {
        ...listing,
        description: "Development seed listing for local API integration and search checks. Details are sample data and are not an active property offer.",
        areaUnit: "SQFT",
        bathrooms: Math.max(1, listing.bedrooms - 1),
        address: `${index + 12}, Development Sample Road`,
        state: listing.city === "Hyderabad" ? "Telangana" : listing.city === "Bengaluru" ? "Karnataka" : "Maharashtra",
        pincode: ["500033", "560066", "411045"][index],
        ownerId: admin.id,
        status: "PUBLISHED",
        publishedAt: new Date(),
        amenities: { create: amenities.slice(0, 3).map((amenity) => ({ amenity: { connect: { id: amenity.id } } })) },
      },
    });
  }

  console.info(`Development accounts ready: ${superAdmin.email}, ${admin.email}, ${user.email}. Seeded ${listings.length} sample properties.`);
}

main().catch((error: unknown) => {
  console.error("Development seed failed.", error);
  process.exitCode = 1;
}).finally(async () => {
  await db.$disconnect();
});
