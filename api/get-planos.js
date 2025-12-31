export const config = {
  runtime: "nodejs"
};

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // 🔐 1. LÊ O TOKEN DO HEADER
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    // 🔐 2. VALIDA O USUÁRIO VIA AUTH
    const { data: auth, error: authError } =
      await sb.auth.getUser(token);

    if (authError || !auth?.user) {
      return res.status(401).json({ error: "Sessão inválida" });
    }

    // ✅ 3. USUÁRIO AUTENTICADO → BUSCA PLANOS
    const { data, error } = await sb
      .from("planos")
      .select("id, nome, valor")
      .eq("ativo", true)
      .gt("dias", 0)
      .order("valor", { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);

  } catch (err) {
    return res.status(500).json({ error: "Erro interno" });
  }
}
