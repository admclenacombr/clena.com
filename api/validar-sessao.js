import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // 🔐 1. LÊ TOKEN DO HEADER
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    // 🔐 2. VALIDA USUÁRIO VIA AUTH
    const { data: auth, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !auth?.user) {
      return res.status(401).json({ error: "Sessão inválida" });
    }

    // 🔑 3. BUSCA USUÁRIO PELO ID (NUNCA POR EMAIL)
    const { data, error } = await supabase
      .from("usuarios")
      .select("status, trial_expires_at")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (error || !data) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    // 🚫 BLOQUEADO
    if (data.status === "bloqueado") {
      return res.status(403).json({ bloqueado: true });
    }

    // ⏳ TRIAL EXPIRADO
    if (
      data.trial_expires_at &&
      new Date() > new Date(data.trial_expires_at)
    ) {
      return res.status(403).json({ expirado: true });
    }

    // ✅ OK
    return res.json({ ok: true });

  } catch (err) {
    return res.status(500).json({ error: "Erro interno" });
  }
}
