/**
 * Hook que encapsula o ciclo de reconhecimento de voz em estado React.
 *
 * Uso:
 *   const { isListening, transcript, error, start, stop, cancel } = useVoice();
 *
 * Características:
 *   - Mantém transcript parcial em tempo real (atualiza enquanto o usuário fala)
 *   - Limpa transcript antigo ao chamar start() de novo
 *   - Pede permissão automaticamente no primeiro `start()` — se negada, vira `error`
 *   - Setup/cleanup automático dos listeners do service
 */
import { useCallback, useEffect, useRef, useState } from "react";

import {
  cancelListening,
  removeListeners,
  requestPermissions,
  setListeners,
  startListening,
  stopListening,
} from "@/services/voice";

interface UseVoiceReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  cancel: () => Promise<void>;
}

export function useVoice(): UseVoiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subs = setListeners({
      onStart: () => {
        setIsListening(true);
        setError(null);
      },
      onPartialResults: (t) => {
        setTranscript(t);
      },
      onResults: (t) => {
        setTranscript(t);
      },
      onError: (msg) => {
        setError(msg);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    return () => {
      removeListeners(subs);
    };
  }, []);

  const start = useCallback(async () => {
    // Pede permissão antes de tentar gravar. Se já estiver concedida, o módulo
    // resolve imediatamente — sem custo de UX.
    const perm = await requestPermissions();
    if (!perm.granted) {
      setError(
        perm.canAskAgain
          ? "Permissão de microfone negada."
          : "Habilite o microfone nas configurações do app."
      );
      setIsListening(false);
      return;
    }

    setTranscript("");
    setError(null);
    try {
      await startListening();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao iniciar gravação";
      setError(msg);
      setIsListening(false);
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      await stopListening();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao parar gravação";
      setError(msg);
    }
  }, []);

  const cancel = useCallback(async () => {
    try {
      await cancelListening();
    } catch {
      // cancel é "best effort" — não propagar erro pra UI
    }
    setTranscript("");
    setIsListening(false);
  }, []);

  // Ref pra leitura síncrona do estado atual sem disparar re-render.
  // Atualmente não é usada externamente, mas reservada caso a tela
  // ai.tsx precise checar transcript sem reatividade no futuro.
  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  return { isListening, transcript, error, start, stop, cancel };
}
