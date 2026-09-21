import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase exclusivo do servidor.
 *
 * Toda a leitura/escrita acontece em Server Components e Server Actions, com a
 * chave secreta do projeto (sb_secret_... nos projetos novos, service_role nos
 * antigos). O browser nunca recebe a chave nem fala diretamente com a base de
 * dados, o que garante que uma workspace só devolve os seus dados.
 */
let cached: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Configuração em falta: define NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ver .env.example).",
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "my-life-manager" } },
  });
  return cached;
}

export function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
