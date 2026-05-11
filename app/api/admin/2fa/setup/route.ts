import { auth } from "@/auth";
import { generateSecret, keyuri } from "@/lib/totp";
import QRCode from "qrcode";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const secret = generateSecret();
  const uri    = keyuri(session.user.email ?? session.user.id, "OwnMyTwin", secret);
  const qr     = await QRCode.toDataURL(uri);

  return Response.json({ secret, qr });
}
