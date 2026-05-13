import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const AVATARS = [
  { email: "sipho.nkosi.fake@ownmytwin.dev",    image: "https://images.pexels.com/photos/9655155/pexels-photo-9655155.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop"  },
  { email: "aisha.patel.fake@ownmytwin.dev",     image: "https://i.pravatar.cc/300?img=47"  },
  { email: "kagiso.sithole.fake@ownmytwin.dev",  image: "https://images.pexels.com/photos/2464687/pexels-photo-2464687.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop"  },
  { email: "nomvula.dlamini.fake@ownmytwin.dev", image: "https://images.pexels.com/photos/11526914/pexels-photo-11526914.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop" },
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
