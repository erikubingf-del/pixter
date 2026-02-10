import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import { safeErrorResponse } from '@/lib/utils/api-error';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const userId = session.id;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.' }, { status: 400 });
    }

    // Validate extension
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: 'Extensão de arquivo não permitida.' }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Arquivo muito grande. O limite é 5MB.' }, { status: 413 });
    }

    const fileName = `${userId}-${Date.now()}${ext}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabaseServer.storage
      .from('avatars')
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      return safeErrorResponse(uploadError, 'Falha no upload do avatar');
    }

    const { data: urlData } = supabaseServer.storage.from('avatars').getPublicUrl(filePath);
    if (!urlData?.publicUrl) {
      await supabaseServer.storage.from('avatars').remove([filePath]);
      return NextResponse.json({ error: 'Não foi possível obter a URL do avatar.' }, { status: 500 });
    }

    const { error: updateError } = await supabaseServer
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      await supabaseServer.storage.from('avatars').remove([filePath]);
      return safeErrorResponse(updateError, 'Falha ao atualizar perfil');
    }

    return NextResponse.json({ success: true, message: 'Avatar atualizado com sucesso!', avatarUrl: urlData.publicUrl });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, 'Erro interno do servidor');
  }
}
