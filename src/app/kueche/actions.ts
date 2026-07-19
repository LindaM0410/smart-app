"use server";

import { revalidatePath } from "next/cache";

import { FAEHIGKEITEN, verlangeFaehigkeit } from "@/lib/autorisierung";
import { aktualisiereKuechenstatus } from "@/lib/kuechenstatus-persistenz";
import { prisma } from "@/lib/prisma";

export async function kuechenstatusAktualisieren(formular: FormData) {
  await verlangeFaehigkeit(FAEHIGKEITEN.kuechenstatusPflegen);
  const positionId = String(formular.get("positionId") ?? "").trim();
  const zielstatus = String(formular.get("zielstatus") ?? "").trim();
  await aktualisiereKuechenstatus(prisma, positionId, zielstatus);
  revalidatePath("/kueche");
}
