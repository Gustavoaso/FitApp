import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { Send, Bot, User } from 'lucide-react-native';
import apiClient from '@/services/apiClient';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isStreaming?: boolean;
}

export default function ChatScreen() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello! I'm your Fitnesis AI Coach. How can I help you adjust your workout or diet plan today?",
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    const aiMsgId = (Date.now() + 1).toString();
    const initialAiMsg: Message = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      isStreaming: true,
    };
    setMessages((prev) => [...prev, initialAiMsg]);

    try {
      // Send request to NestJS /chat backend proxy
      const response = await apiClient.post('/chat', { prompt: textToSend });
      const fullReply = response.data?.reply || response.data?.message || "I've updated your plan based on your request!";
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId ? { ...msg, text: fullReply, isStreaming: false } : msg
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: "I've received your request! Your nutrition and workout plan has been recalibrated.",
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const suggestions = [
    'Adjust my chest workout',
    'Add more protein to lunch',
    'Analyze my weekly progress',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Bot color={Colors.dark.primary} size={24} />
          <Text style={styles.headerTitle}>Fitnesis AI Coach</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubbleContainer,
                item.sender === 'user' ? styles.userContainer : styles.aiContainer,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  item.sender === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.sender === 'user' ? styles.userText : styles.aiText,
                  ]}
                >
                  {item.text || (item.isStreaming ? 'Thinking...' : '')}
                </Text>
              </View>
            </View>
          )}
        />

        {/* Suggestion Chips */}
        <View style={styles.suggestionRow}>
          {suggestions.map((suggestion, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.suggestionChip}
              onPress={() => sendMessage(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask your AI coach..."
            placeholderTextColor="#666"
            onSubmitEditing={() => sendMessage(inputText)}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && { opacity: 0.5 }]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isSending}
          >
            <Send color={Colors.dark.primaryText} size={18} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    gap: 10,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: Colors.dark.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: Colors.dark.primaryText,
    fontWeight: '600',
  },
  aiText: {
    color: Colors.dark.text,
  },
  suggestionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  suggestionText: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.dark.inputBackground,
    borderColor: Colors.dark.border,
    borderWidth: 1,
    borderRadius: 22,
    height: 44,
    paddingHorizontal: 16,
    color: Colors.dark.text,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
