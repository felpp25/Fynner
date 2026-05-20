/**
 * useDatabase — inicializa o banco (abre conexão + migrations + seed em DEV)
 * e expõe estado de loading/erro para a UI mostrar splash ou mensagem.
 *
 * Chame uma vez no RootLayout. Componentes filhos não precisam usar este hook
 * — eles consomem o banco diretamente via `getDb()` dos queries.
 */
import { useEffect, useState } from "react";

import { getDb } from "@/database/db";
import { runSeed } from "@/database/seed";
import { runSanityCheck } from "@/database/__sanity_check";

interface UseDatabaseResult {
  ready: boolean;
  error: Error | null;
}

export function useDatabase(): UseDatabaseResult {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // getDb() já abre conexão e roda as migrations.
        await getDb();
        await runSeed();

        if (__DEV__) {
          await runSanityCheck();
        }

        if (!cancelled) setReady(true);
      } catch (err) {
        console.error("[useDatabase] falha ao inicializar:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error };
}
