/**
 * Serviço de reconhecimento de voz (Stage 8c).
 *
 * Wrapper sobre `expo-speech-recognition` (substituiu `@react-native-voice/voice`
 * que ficou deprecated antes do Sub-stage 8c). API exposta segue o padrão
 * `XXX_AVAILABLE` + funções imperativas + setListeners — coerente com
 * `services/ocr.ts` e `services/ai.ts`.
 *
 * Por que wrapper:
 *   - O módulo nativo dispara eventos via `addListener`. Centralizar aqui
 *     deixa o hook `useVoice` lidando só com estado React, sem importar
 *     o módulo nativo diretamente.
 *   - Idioma travado em pt-BR — sem fallback, sem autodetect (decisão de
 *     produto). Se o usuário falar inglês, a transcrição vai sair ruim
 *     e ele aprende a falar em PT — comportamento desejado.
 */
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
import type { EventSubscription } from "expo-modules-core";

const LOCALE = "pt-BR";

/**
 * Indica se a voz está disponível. No Sub-stage 8c sempre `true` (módulo
 * nativo instalado e linkado via prebuild). Mantém o padrão XXX_AVAILABLE
 * para coerência com `OCR_AVAILABLE` e `AI_AVAILABLE`.
 */
export const VOICE_AVAILABLE = true;

export interface VoiceCallbacks {
  onStart?: () => void;
  /** Disparado a cada update parcial enquanto o usuário fala. */
  onPartialResults?: (transcript: string) => void;
  /** Disparado quando o reconhecimento termina com texto final. */
  onResults?: (transcript: string) => void;
  /** Mensagem de erro pronta pra UI (já em PT-BR). */
  onError?: (error: string) => void;
  /** Disparado quando o reconhecimento encerra (sucesso ou erro). */
  onEnd?: () => void;
}

/**
 * Registra callbacks pros eventos do reconhecimento.
 * Retorna a lista de subscriptions — passar pra `removeListeners` no cleanup.
 */
export function setListeners(callbacks: VoiceCallbacks): EventSubscription[] {
  const subs: EventSubscription[] = [];

  if (callbacks.onStart) {
    subs.push(ExpoSpeechRecognitionModule.addListener("start", callbacks.onStart));
  }

  // `result` é disparado tanto pra parciais (isFinal=false) quanto pra final
  // (isFinal=true). Roteamos pro callback certo aqui pra UI ficar simples.
  if (callbacks.onPartialResults || callbacks.onResults) {
    subs.push(
      ExpoSpeechRecognitionModule.addListener("result", (event) => {
        const transcript = event.results?.[0]?.transcript ?? "";
        if (!transcript) return;
        if (event.isFinal) {
          callbacks.onResults?.(transcript);
        } else {
          callbacks.onPartialResults?.(transcript);
        }
      })
    );
  }

  if (callbacks.onError) {
    subs.push(
      ExpoSpeechRecognitionModule.addListener("error", (event) => {
        callbacks.onError?.(humanizeError(event.error, event.message));
      })
    );
  }

  if (callbacks.onEnd) {
    subs.push(ExpoSpeechRecognitionModule.addListener("end", callbacks.onEnd));
  }

  return subs;
}

/**
 * Remove todos os listeners passados. Chamar no cleanup do useEffect pra
 * evitar que callbacks rodem após unmount (memory leak + setState em árvore
 * já desmontada).
 */
export function removeListeners(subs: EventSubscription[]): void {
  for (const sub of subs) sub.remove();
}

/**
 * Pede permissão de microfone (Android) + speech recognizer (iOS).
 * Idempotente — se já concedido, retorna direto.
 *
 * `canAskAgain=false` significa que o usuário marcou "Não perguntar de novo"
 * e a UI precisa direcionar ele pras Configurações do sistema.
 */
export async function requestPermissions(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  return { granted: result.granted, canAskAgain: result.canAskAgain };
}

/**
 * Inicia o reconhecimento de voz com:
 *   - lang: pt-BR (decisão de produto)
 *   - interimResults: true (atualiza transcript em tempo real na UI)
 *   - continuous: false (encerra ao detectar fim da fala — fits tap-tap)
 *   - addsPunctuation: true (formata pontuação automaticamente)
 *
 * NÃO chama requestPermissions — quem cuida disso é o `useVoice.start()`.
 * Aqui se a permissão não estiver concedida, o módulo dispara `error` com
 * code `not-allowed` (que o setListeners traduz pra mensagem amigável).
 */
export async function startListening(): Promise<void> {
  ExpoSpeechRecognitionModule.start({
    lang: LOCALE,
    interimResults: true,
    continuous: false,
    addsPunctuation: true,
  });
}

/**
 * Para o reconhecimento e tenta retornar um resultado final via evento `result`.
 * Use quando o usuário quer ENVIAR o que falou.
 */
export async function stopListening(): Promise<void> {
  ExpoSpeechRecognitionModule.stop();
}

/**
 * Cancela o reconhecimento sem retornar resultado final.
 * Use quando o usuário quer DESCARTAR o que falou.
 */
export async function cancelListening(): Promise<void> {
  ExpoSpeechRecognitionModule.abort();
}

/**
 * Indica se o motor de reconhecimento está disponível no device.
 * Em Android <12 pode retornar false (API antiga). Em devices novos é `true`.
 */
export function isVoiceRecognitionAvailable(): boolean {
  try {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
}

/**
 * Traduz códigos de erro nativos pra mensagens amigáveis em PT-BR.
 * A mensagem original em inglês fica no `message`; aqui priorizamos o
 * `code` porque ele é estável entre versões do módulo.
 */
function humanizeError(code: string, fallback?: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Permissão de microfone negada. Habilite nas configurações.";
    case "audio-capture":
      return "Não foi possível acessar o microfone.";
    case "no-speech":
    case "speech-timeout":
      return "Não detectei nada. Tente falar de novo.";
    case "language-not-supported":
      return "Português brasileiro não está disponível neste device.";
    case "network":
      return "Sem conexão. O reconhecimento precisa de internet.";
    case "busy":
      return "Reconhecimento já está em uso. Aguarde.";
    case "aborted":
      return "Gravação cancelada.";
    default:
      return fallback || `Erro de voz (${code}).`;
  }
}
