import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { contactRepository } from "@/core/repositories/contact.repository";
import { taskRepository } from "@/core/repositories/task.repository";
import { financeRepository } from "@/core/repositories/finance.repository";
import { memoryRepository } from "@/core/repositories/memory.repository";
import { marketplaceCategoryRepository } from "@/modules/marketplace/repositories/marketplace-category.repository";
import { marketplaceItemRepository } from "@/modules/marketplace/repositories/marketplace-item.repository";
import { marketplaceConversationRepository } from "@/modules/marketplace/repositories/marketplace-conversation.repository";
import { marketplaceInterestRepository } from "@/modules/marketplace/repositories/marketplace-interest.repository";
import { marketplaceProfileRepository } from "@/modules/marketplace/repositories/marketplace-profile.repository";
import { recordMarketplaceSale } from "@/modules/marketplace/services/marketplace-item.service";
import { findMatchesForInventoryItem } from "@/modules/marketplace/services/matching.service";
import { lawnCareClientRepository } from "@/modules/lawn-care/repositories/lawn-care-client.repository";
import { publishingProjectRepository } from "@/modules/publishing/repositories/publishing-project.repository";
import { gameStudioProjectRepository } from "@/modules/game-studio/repositories/game-studio-project.repository";
import { aiProductProjectRepository } from "@/modules/ai-products/repositories/ai-product-project.repository";
import { churchProjectRepository } from "@/modules/church-projects/repositories/church-project.repository";

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

  await prisma.founder.create({
    data: { name: "Taylor Bacon", email: "taylor.bacon@graceresurrection.org" },
  });

  const kitchen = await marketplaceCategoryRepository.findOrCreateByName("Kitchen Appliances");
  const patio = await marketplaceCategoryRepository.findOrCreateByName("Patio & Outdoor");
  const furniture = await marketplaceCategoryRepository.findOrCreateByName("Furniture");
  const fitness = await marketplaceCategoryRepository.findOrCreateByName("Fitness Equipment");

  // Jordan is the concrete proof of "people exist once, businesses attach":
  // one Contact who is simultaneously a Marketplace repeat buyer AND a Lawn
  // Care client, with no duplicate person record.
  const jordan = await contactRepository.create({
    name: "Jordan Lee",
    facebookProfileUrl: "https://facebook.com/jordan.lee.example",
    phone: "555-0101",
    tags: ["repeat-buyer"],
  });
  await marketplaceProfileRepository.updateScores(jordan.id, { reliabilityScore: 90, responsivenessScore: 85 });
  await contactRepository.touchLastContact(jordan.id, daysAgo(2));
  await lawnCareClientRepository.create({
    contactId: jordan.id,
    propertyAddress: "123 Maple St",
    serviceFrequency: "biweekly",
    nextServiceAt: daysFromNow(5),
  });

  const sam = await contactRepository.create({
    name: "Sam Patel",
    facebookProfileUrl: "https://facebook.com/sam.patel.example",
  });
  await contactRepository.touchLastContact(sam.id, daysAgo(10));

  const casey = await contactRepository.create({
    name: "Casey Morgan",
    facebookProfileUrl: "https://facebook.com/casey.morgan.example",
    tags: ["hot-lead"],
  });
  await marketplaceProfileRepository.updateScores(casey.id, { responsivenessScore: 70 });
  await contactRepository.touchLastContact(casey.id, daysAgo(3));

  const riley = await contactRepository.create({ name: "Riley Chen" });
  await marketplaceProfileRepository.updateScores(riley.id, { responsivenessScore: 25, reliabilityScore: 55 });
  await contactRepository.touchLastContact(riley.id, daysAgo(20));

  const morgan = await contactRepository.create({ name: "Morgan Reyes", tags: ["vip"] });
  await contactRepository.addNote(
    morgan.id,
    "Interested in flipping furniture together sometime — follow up in the fall.",
  );

  const mixer = await marketplaceItemRepository.create({
    title: "KitchenAid Stand Mixer - Refurbished",
    description: "Classic tilt-head stand mixer, fully refurbished, ships with paddle + whisk.",
    category: kitchen.name,
    acquisitionSource: "Estate sale",
    acquisitionCostCents: 6000,
    askingPriceCents: 12000,
    keywords: ["kitchenaid", "stand mixer", "kitchen appliance", "baking"],
  });
  await marketplaceItemRepository.markListed(mixer.id, daysAgo(20));
  await recordMarketplaceSale(mixer.id, { contactId: jordan.id, salePriceCents: 12000, dateSold: daysAgo(15) });

  const patioSet = await marketplaceItemRepository.create({
    title: "Outdoor Patio Set (4-piece)",
    description: "Wicker patio set with cushions, seats 4, minor wear.",
    category: patio.name,
    acquisitionSource: "Marketplace flip",
    acquisitionCostCents: 15000,
    askingPriceCents: 30000,
    keywords: ["patio set", "outdoor furniture", "patio", "wicker"],
  });
  await marketplaceItemRepository.markListed(patioSet.id, daysAgo(10));

  const sofa = await marketplaceItemRepository.create({
    title: "Mid-century Sofa",
    description: "3-seat mid-century modern sofa, walnut legs.",
    category: furniture.name,
    acquisitionCostCents: 10000,
    askingPriceCents: 25000,
    keywords: ["sofa", "couch", "furniture", "mid-century"],
  });
  await marketplaceItemRepository.markListed(sofa.id, daysAgo(40));
  await recordMarketplaceSale(sofa.id, { contactId: riley.id, salePriceCents: 25000, dateSold: daysAgo(35) });

  const espresso = await marketplaceItemRepository.create({
    title: "Espresso Machine",
    description: "Semi-automatic espresso machine with steam wand, barely used.",
    category: kitchen.name,
    acquisitionCostCents: 4000,
    askingPriceCents: 9000,
    keywords: ["espresso machine", "coffee", "kitchen appliance"],
  });

  const treadmill = await marketplaceItemRepository.create({
    title: "Treadmill - Folding",
    description: "Folding treadmill, works great, just needs space.",
    category: fitness.name,
    acquisitionCostCents: 5000,
    askingPriceCents: 15000,
    keywords: ["treadmill", "fitness", "exercise equipment"],
  });
  await marketplaceItemRepository.markListed(treadmill.id, daysAgo(60));

  const samConversation = await marketplaceConversationRepository.create({
    contact: { connect: { id: sam.id } },
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
  await marketplaceInterestRepository.create({
    contactId: sam.id,
    conversationId: samConversation.id,
    categoryId: kitchen.id,
    itemDescription: "KitchenAid stand mixer",
    keywords: ["kitchenaid", "stand mixer", "kitchen appliance"],
    budgetCents: 10000,
  });
  await taskRepository.create({
    title: "Follow up with Sam — let them know if another KitchenAid mixer comes in.",
    module: "marketplace",
    contactId: sam.id,
    dueAt: daysAgo(1),
    sourceType: "MarketplaceConversation",
    sourceId: samConversation.id,
  });

  const caseyConversation = await marketplaceConversationRepository.create({
    contact: { connect: { id: casey.id } },
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
  await marketplaceInterestRepository.create({
    contactId: casey.id,
    conversationId: caseyConversation.id,
    categoryId: patio.id,
    itemDescription: "patio set",
    keywords: ["patio set", "outdoor furniture", "patio"],
    budgetCents: 30000,
  });
  await taskRepository.create({
    title: "Send Casey photos of the patio set once cushions are cleaned.",
    module: "marketplace",
    contactId: casey.id,
    dueAt: daysFromNow(2),
    sourceType: "MarketplaceConversation",
    sourceId: caseyConversation.id,
  });
  await contactRepository.updateAiSummaryCache(
    casey.id,
    "Casey wants a 4-piece patio set before summer, budget $300, based in Denver.",
  );
  await memoryRepository.create({
    contactId: casey.id,
    module: "marketplace",
    kind: "fact",
    content: "Based in Denver, wants a 4-piece patio set before summer, budget $300, pickup only.",
    sourceType: "MarketplaceConversation",
    sourceId: caseyConversation.id,
  });

  const jordanConversation = await marketplaceConversationRepository.create({
    contact: { connect: { id: jordan.id } },
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
  await marketplaceInterestRepository.create({
    contactId: jordan.id,
    conversationId: jordanConversation.id,
    categoryId: kitchen.id,
    itemDescription: "espresso machine",
    keywords: ["espresso machine", "coffee", "kitchen appliance"],
    budgetCents: 9000,
  });
  await contactRepository.updateAiSummaryCache(
    jordan.id,
    "Jordan is a happy repeat customer, casually interested in an espresso machine if the price is right.",
  );
  await memoryRepository.create({
    contactId: jordan.id,
    kind: "preference",
    content: "Prefers texting over calls; usually responds within a few hours.",
    sourceType: "MarketplaceConversation",
    sourceId: jordanConversation.id,
  });

  // Tasks spanning every scope the universal task system supports: founder-
  // level (no module, no contact), module-level (module set, no contact),
  // and contact-level (already seeded above for Sam and Casey).
  await taskRepository.create({ title: "Renew business insurance", priority: "high", dueAt: daysFromNow(14) });
  await taskRepository.create({
    title: "Restock packing tape and boxes",
    module: "marketplace",
    dueAt: daysFromNow(3),
  });

  // A founder-level Finance entry not attributable to any one module.
  await financeRepository.create({
    type: "expense",
    amountCents: 2000,
    category: "software",
    description: "Founder OS hosting",
    occurredAt: daysAgo(5),
    recurring: true,
  });

  // One row per stub module — proves each can own its own table and appear
  // in nav/dashboard/assistant without touching Core.
  await publishingProjectRepository.create({
    title: "Founder OS Launch Newsletter #1",
    status: "drafting",
    platform: "Substack",
  });
  await gameStudioProjectRepository.create({ title: "Pixel Farm Sim", status: "concept" });
  await aiProductProjectRepository.create({ name: "Client Onboarding Bot", status: "idea" });
  await churchProjectRepository.create({
    title: "Vacation Bible School Planning",
    status: "planning",
    dueAt: daysFromNow(30),
  });

  // Run the matching engine for the still-open listings, same as the API
  // does automatically whenever new inventory is created.
  const patioMatches = await findMatchesForInventoryItem(patioSet.id);
  const espressoMatches = await findMatchesForInventoryItem(espresso.id);

  console.log(
    `Seeded ${await prisma.contact.count()} contacts, ${await prisma.marketplaceItem.count()} marketplace items, ${await prisma.task.count()} tasks, ${await prisma.financeTransaction.count()} finance transactions.`,
  );
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
