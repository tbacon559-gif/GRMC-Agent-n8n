import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { categoryRepository } from "@/lib/repositories/category.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { inventoryRepository } from "@/lib/repositories/inventory.repository";
import { interestRepository } from "@/lib/repositories/interest.repository";
import { reminderRepository } from "@/lib/repositories/reminder.repository";
import { conversationRepository } from "@/lib/repositories/conversation.repository";
import { findMatchesForInventoryItem } from "@/lib/services/matching.service";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  console.log("Seeding database...");

  const kitchen = await categoryRepository.findOrCreateByName("Kitchen Appliances");
  const patio = await categoryRepository.findOrCreateByName("Patio & Outdoor");
  const furniture = await categoryRepository.findOrCreateByName("Furniture");
  const fitness = await categoryRepository.findOrCreateByName("Fitness Equipment");

  const jordan = await customerRepository.create({
    name: "Jordan Lee",
    facebookProfileUrl: "https://facebook.com/jordan.lee.example",
    phone: "555-0101",
    status: "buyer",
    tags: ["repeat-buyer"],
  });
  await customerRepository.update(jordan.id, {
    reliabilityScore: 90,
    responsivenessScore: 85,
  });
  await customerRepository.touchLastContact(jordan.id, daysAgo(2));

  const sam = await customerRepository.create({
    name: "Sam Patel",
    facebookProfileUrl: "https://facebook.com/sam.patel.example",
    status: "prospect",
  });
  await customerRepository.touchLastContact(sam.id, daysAgo(10));

  const casey = await customerRepository.create({
    name: "Casey Morgan",
    facebookProfileUrl: "https://facebook.com/casey.morgan.example",
    status: "prospect",
    tags: ["hot-lead"],
  });
  await customerRepository.update(casey.id, { responsivenessScore: 70 });
  await customerRepository.touchLastContact(casey.id, daysAgo(3));

  const riley = await customerRepository.create({
    name: "Riley Chen",
    status: "buyer",
  });
  await customerRepository.update(riley.id, { responsivenessScore: 25, reliabilityScore: 55 });
  await customerRepository.touchLastContact(riley.id, daysAgo(20));

  const taylor = await customerRepository.create({
    name: "Taylor Brooks",
    status: "prospect",
    tags: ["vip"],
  });
  await customerRepository.addNote(
    taylor.id,
    "Interested in flipping furniture together sometime — follow up in the fall.",
  );

  const mixer = await inventoryRepository.create({
    title: "KitchenAid Stand Mixer - Refurbished",
    description: "Classic tilt-head stand mixer, fully refurbished, ships with paddle + whisk.",
    category: kitchen.name,
    acquisitionSource: "Estate sale",
    acquisitionCostCents: 6000,
    askingPriceCents: 12000,
    keywords: ["kitchenaid", "stand mixer", "kitchen appliance", "baking"],
  });
  await inventoryRepository.markListed(mixer.id, daysAgo(20));
  await inventoryRepository.recordSale(mixer.id, {
    buyerId: jordan.id,
    salePriceCents: 12000,
    dateSold: daysAgo(15),
  });
  await customerRepository.recordPurchase(jordan.id, 12000);

  const patioSet = await inventoryRepository.create({
    title: "Outdoor Patio Set (4-piece)",
    description: "Wicker patio set with cushions, seats 4, minor wear.",
    category: patio.name,
    acquisitionSource: "Marketplace flip",
    acquisitionCostCents: 15000,
    askingPriceCents: 30000,
    keywords: ["patio set", "outdoor furniture", "patio", "wicker"],
  });
  await inventoryRepository.markListed(patioSet.id, daysAgo(10));

  const sofa = await inventoryRepository.create({
    title: "Mid-century Sofa",
    description: "3-seat mid-century modern sofa, walnut legs.",
    category: furniture.name,
    acquisitionCostCents: 10000,
    askingPriceCents: 25000,
    keywords: ["sofa", "couch", "furniture", "mid-century"],
  });
  await inventoryRepository.markListed(sofa.id, daysAgo(40));
  await inventoryRepository.recordSale(sofa.id, {
    buyerId: riley.id,
    salePriceCents: 25000,
    dateSold: daysAgo(35),
  });
  await customerRepository.recordPurchase(riley.id, 25000);

  const espresso = await inventoryRepository.create({
    title: "Espresso Machine",
    description: "Semi-automatic espresso machine with steam wand, barely used.",
    category: kitchen.name,
    acquisitionCostCents: 4000,
    askingPriceCents: 9000,
    keywords: ["espresso machine", "coffee", "kitchen appliance"],
  });

  const treadmill = await inventoryRepository.create({
    title: "Treadmill - Folding",
    description: "Folding treadmill, works great, just needs space.",
    category: fitness.name,
    acquisitionCostCents: 5000,
    askingPriceCents: 15000,
    keywords: ["treadmill", "fitness", "exercise equipment"],
  });
  await inventoryRepository.markListed(treadmill.id, daysAgo(60));

  const samConversation = await conversationRepository.create({
    customer: { connect: { id: sam.id } },
    source: "messenger",
    rawText:
      "Hey, do you still have that KitchenAid mixer? Looking for one for my daughter, budget around $100.",
    occurredAt: daysAgo(10),
    interestedItem: "KitchenAid stand mixer",
    requestedItems: ["kitchenaid stand mixer"],
    budgetCents: 10000,
    urgency: "medium",
    buyingIntent: "high",
    sentiment: "positive",
    summary: "Sam is looking for a KitchenAid stand mixer as a gift, budget around $100.",
    extractionModel: "seed-data",
  });
  await interestRepository.create({
    customerId: sam.id,
    conversationId: samConversation.id,
    categoryId: kitchen.id,
    itemDescription: "KitchenAid stand mixer",
    keywords: ["kitchenaid", "stand mixer", "kitchen appliance"],
    budgetCents: 10000,
  });
  await reminderRepository.create({
    customerId: sam.id,
    conversationId: samConversation.id,
    dueAt: daysAgo(1),
    note: "Follow up with Sam — let them know if another KitchenAid mixer comes in.",
  });

  const caseyConversation = await conversationRepository.create({
    customer: { connect: { id: casey.id } },
    source: "messenger",
    rawText:
      "Looking for a patio set for the backyard, 4 people, before summer starts. Budget is $300. I'm in Denver.",
    occurredAt: daysAgo(3),
    interestedItem: "patio set",
    requestedItems: ["patio set"],
    budgetCents: 30000,
    city: "Denver",
    urgency: "high",
    buyingIntent: "high",
    sentiment: "positive",
    summary: "Casey wants a 4-piece patio set before summer, budget $300, based in Denver.",
    extractionModel: "seed-data",
  });
  await interestRepository.create({
    customerId: casey.id,
    conversationId: caseyConversation.id,
    categoryId: patio.id,
    itemDescription: "patio set",
    keywords: ["patio set", "outdoor furniture", "patio"],
    budgetCents: 30000,
  });
  await reminderRepository.create({
    customerId: casey.id,
    conversationId: caseyConversation.id,
    dueAt: daysFromNow(2),
    note: "Send Casey photos of the patio set once cushions are cleaned.",
  });
  await customerRepository.updateAiSummary(
    casey.id,
    "Casey wants a 4-piece patio set before summer, budget $300, based in Denver.",
  );

  const jordanConversation = await conversationRepository.create({
    customer: { connect: { id: jordan.id } },
    source: "messenger",
    rawText: "Loved the mixer! Do you ever get espresso machines in? I'd grab one if the price is right.",
    occurredAt: daysAgo(2),
    interestedItem: "espresso machine",
    requestedItems: ["espresso machine"],
    budgetCents: 9000,
    urgency: "low",
    buyingIntent: "medium",
    sentiment: "positive",
    summary: "Jordan is a happy repeat customer, casually interested in an espresso machine if the price is right.",
    extractionModel: "seed-data",
  });
  await interestRepository.create({
    customerId: jordan.id,
    conversationId: jordanConversation.id,
    categoryId: kitchen.id,
    itemDescription: "espresso machine",
    keywords: ["espresso machine", "coffee", "kitchen appliance"],
    budgetCents: 9000,
  });
  await customerRepository.updateAiSummary(
    jordan.id,
    "Jordan is a happy repeat customer, casually interested in an espresso machine if the price is right.",
  );

  // Run the matching engine for the still-open listings, same as the API
  // does automatically whenever new inventory is created.
  const patioMatches = await findMatchesForInventoryItem(patioSet.id);
  const espressoMatches = await findMatchesForInventoryItem(espresso.id);

  console.log(`Seeded ${await prisma.customer.count()} customers, ${await prisma.inventoryItem.count()} inventory items.`);
  console.log(`Patio set matches: ${patioMatches.length}, espresso machine matches: ${espressoMatches.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
