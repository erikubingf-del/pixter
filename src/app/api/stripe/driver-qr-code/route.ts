import { NextResponse, NextRequest } from "next/server";
import QRCode from "qrcode";
import { supabaseServer } from "@/lib/supabase/client";
import { safeErrorResponse } from "@/lib/utils/api-error";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");

    if (!driverId) {
      return NextResponse.json({ error: "ID do motorista não fornecido." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("celular")
      .eq("id", driverId)
      .eq("tipo", "motorista")
      .single();

    if (profileError || !profile || !profile.celular) {
      return NextResponse.json({ error: "Perfil do motorista não encontrado." }, { status: 404 });
    }

    const digitsOnly = profile.celular.replace(/\D/g, "");
    const formattedPhoneForUrl = digitsOnly.startsWith("55") ? digitsOnly.substring(2) : digitsOnly;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const paymentUrl = `${appUrl}/${formattedPhoneForUrl}`;

    const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl, {
      errorCorrectionLevel: "H",
      type: "image/png",
      margin: 1,
      width: 200,
    });

    return NextResponse.json({ qrCode: qrCodeDataUrl, paymentUrl });
  } catch (error: any) {
    return safeErrorResponse(error, "Falha ao gerar QR code.");
  }
}
