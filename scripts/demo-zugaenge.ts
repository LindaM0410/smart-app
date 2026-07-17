import { bootstrapDemoZugaenge } from "../src/lib/demo-zugaenge.ts";
import { prisma } from "../src/lib/prisma.ts";

if (process.env.NODE_ENV === "production") {
  console.error("Der Demo-Zugangs-Bootstrap darf nicht in Produktion ausgeführt werden.");
  process.exitCode = 1;
} else {
  try {
    const benutzernamen = await bootstrapDemoZugaenge(prisma);
    console.log(`Lokale Demo-Zugänge wurden eingerichtet: ${benutzernamen.join(", ")}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Demo-Zugänge konnten nicht eingerichtet werden.");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
