import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const AVATARS = [
  { email: "sipho.nkosi.fake@ownmytwin.dev",    image: "https://i.pravatar.cc/300?img=12"  },
  { email: "aisha.patel.fake@ownmytwin.dev",     image: "https://i.pravatar.cc/300?img=47"  },
  { email: "kagiso.sithole.fake@ownmytwin.dev",  image: "https://i.pravatar.cc/300?img=33"  },
  { email: "nomvula.dlamini.fake@ownmytwin.dev", image: "https://i.pravatar.cc/300?img=56"  },
  { email: "liam.ferreira.fake@ownmytwin.dev",   image: "https://i.pravatar.cc/300?img=8"   },
];

async function main() {
  for (const { email, image } of AVATARS) {
    await db.user.update({ where: { email }, data: { image } });
    console.log(`✓ ${email}`);
  }
  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
