import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface ToastMessage {
  text: string;
  id: number;
}

let showToastFn: ((text: string) => void) | null = null;

export function showToast(text: string) {
  showToastFn?.(text);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addMessage = useCallback((text: string) => {
    const id = Date.now();
    setMessages((prev) => [...prev, { text, id }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 2200);
  }, []);

  useEffect(() => {
    showToastFn = addMessage;
    return () => { showToastFn = null; };
  }, [addMessage]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      <View style={s.container} pointerEvents="none">
        {messages.map((m) => (
          <ToastItem key={m.id} text={m.text} />
        ))}
      </View>
    </View>
  );
}

function ToastItem({ text }: { text: string }) {
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.toast, { opacity }]}>
      <Text style={s.check}>✓</Text>
      <Text style={s.text}>{text}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { position: 'absolute', bottom: 80, left: 0, right: 0, alignItems: 'center', gap: 6 },
  toast: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  check: { color: '#fff', fontSize: 18, fontWeight: '900' },
  text: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
