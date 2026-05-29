/**
 * Bubble de mensagem do chat com a Fynner IA.
 *
 * - role='user': bubble accent (roxo), alinhado à direita, canto inferior
 *   direito reduzido (estilo WhatsApp).
 * - role='assistant': bubble card escuro, alinhado à esquerda, canto inferior
 *   esquerdo reduzido.
 *
 * Markdown bold (**texto**) é renderizado em negrito + accent. Parser inline
 * simples — não é Markdown completo, só negrito, que é o único marcador que
 * o system prompt instrui a IA a usar.
 */
import { Text, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

/**
 * Divide o texto em runs alternados (normal / negrito) preservando a ordem.
 * Recebe a cor do negrito como parâmetro pra evitar acoplar a função ao
 * shape do theme inteiro.
 */
function renderContent(text: string, boldColor: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return (
        <Text key={idx} style={{ fontWeight: "600", color: boldColor }}>
          {inner}
        </Text>
      );
    }
    return <Text key={idx}>{part}</Text>;
  });
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const { theme } = useTheme();
  const isUser = role === "user";

  return (
    <View
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "78%",
        backgroundColor: isUser ? theme.accent : theme.card,
        borderWidth: isUser ? 0 : 0.5,
        borderColor: theme.accentBorder,
        borderRadius: 14,
        borderBottomRightRadius: isUser ? 4 : 14,
        borderBottomLeftRadius: isUser ? 14 : 4,
        paddingVertical: 9,
        paddingHorizontal: 12,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          lineHeight: 17,
          color: isUser ? "#fff" : theme.text,
        }}
      >
        {renderContent(content, isUser ? "#fff" : theme.accentLight)}
      </Text>
    </View>
  );
}
