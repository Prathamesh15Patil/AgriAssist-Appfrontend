import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { sendChatMessage } from '../../services/api/chatService';
import { Audio } from 'expo-av';
import { useLanguage } from '../../context/LanguageContext';
import Markdown from 'react-native-markdown-display';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'bot';
};

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function ChatModal({ visible, onClose }: Props) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const { language } = useLanguage();
    const soundRef = useRef<Audio.Sound | null>(null);


    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: input,
            sender: 'user',
        };

        setMessages((prev) => [...prev, userMessage]);

        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            // 🔥 THIS is your entry point
            const response = await sendChatMessage(currentInput, language);

            setIsLoading(false);

            const botId = Date.now().toString();

            setMessages((prev) => [
                ...prev,
                { id: botId, text: '', sender: 'bot' },
            ]);

            let index = 0;
            const fullText = response.text;

            const interval = setInterval(() => {
                index += 5;

                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === botId
                            ? { ...msg, text: fullText.slice(0, index) }
                            : msg
                    )
                );

                if (index >= fullText.length) {
                    clearInterval(interval);

                    // 🔊 play audio from backend
                    if (response.audioUrl) {
                        playAudio(response.audioUrl);
                    }
                    console.log(response.audioUrl);
                }
            }, 40);

        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };


    const playAudio = async (url: string) => {
        try {
            // Stop previous audio if any
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync({ uri: url });

            soundRef.current = sound;

            await sound.playAsync();
        } catch (error) {
            console.error('Audio error:', error);
        }
    };

    const handleClose = async () => {
        if (soundRef.current) {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
            soundRef.current = null;
        }

        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.container}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>AgriExpert Chat</Text>
                    <TouchableOpacity onPress={handleClose}>
                        <Text style={styles.close}>Close</Text>
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    inverted={false}
                    renderItem={({ item }) => (
                        <View
                            style={[
                                styles.message,
                                item.sender === 'user' ? styles.user : styles.bot,
                            ]}
                        >
                            <Markdown
                                style={{
                                    body: {
                                        color: item.sender === 'user' ? '#fff' : '#000',
                                        fontSize: 15,
                                        lineHeight: 22,
                                    },
                                }}
                            >
                                {item.text}
                            </Markdown>
                        </View>
                    )}
                />
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#2E7D32" />
                        <Text style={styles.loadingText}>AgriExpert is thinking...</Text>
                    </View>
                )}

                {/* Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder={t('chat.placeholder')}
                        style={styles.input}
                    />

                    <TouchableOpacity onPress={sendMessage} style={styles.send}>
                        <Text style={{ color: '#fff' }}>➤</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#2E7D32',
    },
    title: { color: '#fff', fontSize: 18, fontWeight: '600' },
    close: { color: '#fff' },

    message: {
        padding: 12,
        marginVertical: 6,
        marginHorizontal: 10,
        borderRadius: 16,
        maxWidth: '75%',
    },

    user: {
        alignSelf: 'flex-end',
        backgroundColor: '#2E7D32',
    },

    bot: {
        alignSelf: 'flex-start',
        backgroundColor: '#F1F1F1',
    },

    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },

    text: { color: '#000' },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderColor: '#eee',
    },

    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },

    send: {
        backgroundColor: '#2E7D32',
        marginLeft: 8,
        padding: 10,
        borderRadius: 20,
    },
    listeningText: {
        textAlign: 'center',
        marginBottom: 5,
        color: '#2E7D32',
    },

    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#F8F9FA',
        marginHorizontal: 10,
        marginBottom: 8,
        borderRadius: 16,
    },

    loadingText: {
        marginLeft: 8,
        color: '#2E7D32',
        fontSize: 14,
        fontStyle: 'italic',
    },
});