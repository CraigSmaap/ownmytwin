import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const FAKE_USERS = [
  {
    name:  "Sipho Nkosi",
    email: "sipho.nkosi.fake@ownmytwin.dev",
    slug:  "sipho-nkosi",
    twin:  { name: "Sipho AI", bio: "Fitness coach & motivational speaker from Joburg. I help people build bodies and mindsets that last." },
    posts: [
      {
        title:       "My legs gave up before my mind did",
        description: "Squatted 140kg for the first time today. Didn't feel heroic — legs shaking, hands white on the bar, gym music too loud. But I got up every single time. That's the whole job.",
        isGuidedPost: true,
      },
      {
        title:       "Why rest days actually build muscle",
        description: "Clients always want to train every day. I get it — feels productive. But muscle doesn't grow in the gym, it grows when you sleep. This week I forced myself to take Wednesday off. PR on Friday. Coincidence? Never.",
        isAiGenerated: true,
      },
    ],
  },
  {
    name:  "Aisha Patel",
    email: "aisha.patel.fake@ownmytwin.dev",
    slug:  "aisha-patel",
    twin:  { name: "Aisha AI", bio: "Cape Town-based food blogger. I cook simple things that taste like effort. Indian-South African fusion is my whole personality." },
    posts: [
      {
        title:       "The bunny chow that broke my diet",
        description: "Spent the whole week eating clean. Then my aunty made bunny chow on Sunday and I had three helpings. Zero regrets. Some meals are not about nutrition — they're about remembering where you come from.",
        isGuidedPost: true,
      },
      {
        title:       "Nobody told me cooking for one is this hard",
        description: "Every recipe feeds four. I have been eating the same butter chicken for five days. On day three I started talking to it. Today it talked back. Send help or a dinner guest.",
        isGuidedPost: true,
      },
    ],
  },
  {
    name:  "Kagiso Sithole",
    email: "kagiso.sithole.fake@ownmytwin.dev",
    slug:  "kagiso-sithole",
    twin:  { name: "Kagiso AI", bio: "Stand-up comedian from Pretoria. If I'm not laughing I'm crying and honestly both look the same on camera." },
    posts: [
      {
        title:       "Load shedding gave me a 6-pack (almost)",
        description: "Eskom took the power for 4 hours last night so I had nothing to do except sit-ups by candlelight. Did 12. That's basically a 6-pack if you squint. South Africa is actually a free gym membership.",
        isGuidedPost: true,
      },
      {
        title:       "My AI twin is funnier than me and I'm not okay",
        description: "Asked my AI twin to write a joke. It wrote five. All landed. I've been doing comedy for six years. This is fine. Everything is fine. I'm going to go lie down now.",
        isAiGenerated: true,
      },
      {
        title:       "Traffic on the N1 is just free meditation",
        description: "45 minutes in standstill traffic on the N1 today. No choice but to breathe, accept the universe, and question every life decision that led me to this moment. Namaste, I guess.",
        isGuidedPost: true,
      },
    ],
  },
  {
    name:  "Nomvula Dlamini",
    email: "nomvula.dlamini.fake@ownmytwin.dev",
    slug:  "nomvula-dlamini",
    twin:  { name: "Nomvula AI", bio: "CFP & financial educator. Breaking down money in plain Zulu and English. Your bank account has feelings — let's talk about them." },
    posts: [
      {
        title:       "I grew up thinking debt was normal. It isn't.",
        description: "My family never talked about money except to say there wasn't enough. Took me 28 years to understand that was a cycle, not a fact. Now I talk about money every day so the next generation doesn't have to start from zero.",
        isGuidedPost: true,
      },
      {
        title:       "The R50 you waste every day is R18,000 a year",
        description: "R50 on takeaway coffee. Daily. Sounds small. Feels small. But that's R18,250 a year — which is a flight to London and back, or three months of groceries, or the start of an emergency fund. I'm not saying stop. I'm saying know.",
        isAiGenerated: true,
      },
    ],
  },
  {
    name:  "Liam Ferreira",
    email: "liam.ferreira.fake@ownmytwin.dev",
    slug:  "liam-ferreira",
    twin:  { name: "Liam AI", bio: "Cape Town-based UX designer & startup guy. I make apps that don't make people angry." },
    posts: [
      {
        title:       "Shipped at 2am. Slept at 2:03am.",
        description: "After six weeks of builds, reworks, and one full delete-everything moment, we went live last night. No fanfare, no tweet, just me and VS Code and a green deploy screen. The quiet after a launch is its own kind of loud.",
        isGuidedPost: true,
      },
      {
        title:       "Stop designing for your portfolio. Design for confusion.",
        description: "The most useful thing I do is watch someone use my product for the first time. Not a designer. Not a techie. Someone's mum. The confusion on her face in the first 30 seconds is worth more than a month of meetings.",
        isAiGenerated: true,
      },
    ],
  },
];

async function main() {
  console.log("Seeding showcase posts…");

  for (const person of FAKE_USERS) {
    // Upsert user
    const user = await db.user.upsert({
      where:  { email: person.email },
      update: {},
      create: {
        name:              person.name,
        email:             person.email,
        publicSlug:        person.slug,
        accountType:       "talent",
        onboardingComplete: true,
        verificationStatus: Math.random() > 0.5 ? "verified" : "unverified",
      },
    });

    // Upsert twin
    const twin = await db.twin.upsert({
      where:  { userId: user.id },
      update: {},
      create: {
        userId:            user.id,
        name:              person.twin.name,
        bio:               person.twin.bio,
        marketplaceVisible: true,
        systemPrompt:      `You are ${person.twin.name}. ${person.twin.bio}`,
      },
    });

    // Create posts (skip if already exist for this twin + title combo)
    for (const p of person.posts) {
      const existing = await db.showcasePost.findFirst({
        where: { twinId: twin.id, title: p.title },
      });
      if (existing) { console.log(`  skip: "${p.title}"`); continue; }

      await db.showcasePost.create({
        data: {
          buyerId:       user.id,
          twinId:        twin.id,
          title:         p.title,
          description:   p.description,
          mediaType:     "text",
          isGuidedPost:  p.isGuidedPost  ?? false,
          isAiGenerated: p.isAiGenerated ?? false,
        },
      });
      console.log(`  ✓ "${p.title}"`);
    }
  }

  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
