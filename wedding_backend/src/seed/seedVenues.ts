import type { Transaction } from "sequelize";
import { initDatabase, sequelize } from "../config/database";
import { Venue } from "../models";

const SEED_VENUE_TAG = "[seed:venues]";

type SeedVenueRow = {
  name: string;
  city: string;
  area: string;
  address: string;
  phone: string;
  contactPerson: string;
  notes: string;
  isActive: boolean;
};

const venueNames = [
  "Rose Grand Hall",
  "Pearl Garden Venue",
  "Palm Court Ballroom",
  "Azure Bay Hall",
  "Golden Dune Palace",
  "Royal Orchid Venue",
  "Marina Star Hall",
  "Desert Bloom Ballroom",
  "Lulu Signature Hall",
  "Jasmine Crown Venue",
  "Emerald Coast Hall",
  "Silk Lantern Ballroom",
  "Sapphire Bay Venue",
  "Coral Palm Hall",
  "Majestic Harbor Ballroom",
  "Noor Elite Venue",
  "Crystal Wave Hall",
  "Sunset Pearl Ballroom",
  "Olive Court Venue",
  "Moonlight Terrace Hall",
  "Ivory Pearl Palace",
  "Royal Creek Venue",
  "Lavender Dune Hall",
  "Sea Breeze Ballroom",
  "Harmony Gate Venue",
  "Silver Palm Hall",
  "Garden Mirage Ballroom",
  "Cedar Luxe Venue",
  "Prestige Sands Hall",
  "Skyline Pearl Ballroom",
];

const cities = ["Kuwait City", "Hawalli", "Farwaniya", "Mubarak Al-Kabeer"];

const areas = [
  "Salmiya",
  "Jabriya",
  "Shuwaikh",
  "Fintas",
  "Mahboula",
  "Abu Halifa",
  "Sabah Al Salem",
  "Mangaf",
];

const buildVenueSeedRows = (): SeedVenueRow[] =>
  venueNames.map((name, index) => {
    const city = cities[index % cities.length];
    const area = areas[index % areas.length];

    return {
      name,
      city,
      area,
      address: `${area}, Block ${(index % 10) + 1}, Street ${(index % 24) + 1}`,
      phone: `22${String(100000 + index).padStart(6, "0")}`,
      contactPerson: `Venue Manager ${String(index + 1).padStart(2, "0")}`,
      notes: `${SEED_VENUE_TAG} Demo venue ${index + 1}`,
      isActive: true,
    };
  });

export const ensureSeedVenues = async (transaction?: Transaction) => {
  const rows = buildVenueSeedRows();

  await Venue.bulkCreate(rows, {
    updateOnDuplicate: [
      "city",
      "area",
      "address",
      "phone",
      "contactPerson",
      "notes",
      "isActive",
    ],
    transaction,
  });

  const venues = await Venue.findAll({
    where: {
      name: rows.map((row) => row.name),
    },
    order: [["id", "ASC"]],
    transaction,
  });

  const venueByName = new Map(venues.map((venue) => [venue.name, venue]));

  return rows
    .map((row) => venueByName.get(row.name))
    .filter((venue): venue is Venue => Boolean(venue));
};

const seedVenues = async () => {
  await initDatabase();

  const venues = await sequelize.transaction(async (transaction) =>
    ensureSeedVenues(transaction),
  );

  console.log(`Seed completed: ${venues.length} venues`);
};

if (require.main === module) {
  seedVenues()
    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error("Venue seed failed:", error);
      await sequelize.close();
      process.exit(1);
    });
}
