// src/components/ChatApp.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

type Chat = {
  id: string;
  username: string;
  message: string;
  created_at: string;
};

function ChatApp() {
  const [username, setUsername] = useState('익명');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Chat[]>([]);

  const sendMessage = async () => {
    if (!message) return;
    await supabase.from('chats').insert([{ username, message }]);
    setMessage('');
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chats')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setMessages(data as Chat[]);
  };

  useEffect(() => {
    fetchMessages();

    const subscription = supabase
      .channel('public:chats')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chats' },
        (payload) => {
          const newMsg = payload.new as Chat;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div>
      <h2>Supabase 채팅</h2>
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={sendMessage}>보내기</button>

      <div style={{ marginTop: '20px' }}>
        {messages.map((chat) => (
          <div key={chat.id}>
            <strong>{chat.username}:</strong> {chat.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatApp;
