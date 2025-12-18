import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! I\'m LK Travel AI Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');

  const responses = {
    booking: 'To make a booking, please go to the Booking page from the dashboard menu. You can select your seats, enter passenger details, and complete payment.',
    price: 'Our standard fare is Rp 85,000 per seat for routes between Rokan Hulu and Pekanbaru.',
    schedule: 'We have regular departures daily. Please check the Departure Info section for the latest schedule.',
    payment: 'We accept Bank Transfer, QRIS, and Cash payments. All payment methods are available during checkout.',
    contact: 'You can reach our Rokan Hulu office via WhatsApp at the number provided in the footer. We\'re here to help!',
    default: 'I\'m here to help! You can ask me about bookings, prices, schedules, payments, or contact information.'
  };

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([...messages, { type: 'user', text: input }]);
    
    const lowerInput = input.toLowerCase();
    let response = responses.default;
    
    if (lowerInput.includes('book') || lowerInput.includes('reservation')) response = responses.booking;
    else if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('fare')) response = responses.price;
    else if (lowerInput.includes('schedule') || lowerInput.includes('time')) response = responses.schedule;
    else if (lowerInput.includes('payment') || lowerInput.includes('pay')) response = responses.payment;
    else if (lowerInput.includes('contact') || lowerInput.includes('phone')) response = responses.contact;

    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text: response }]);
    }, 500);

    setInput('');
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-slate-900/95 backdrop-blur-xl rounded-2xl border-2 border-yellow-500/30 shadow-2xl z-50 flex flex-col"
          >
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-slate-900" />
                <h3 className="font-bold text-slate-900">LK Travel AI Assistant</h3>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-slate-900 hover:bg-yellow-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.type === 'user'
                        ? 'bg-yellow-500 text-slate-900'
                        : 'bg-slate-800 text-white border border-gray-700'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="bg-slate-800 border-gray-700 text-white"
                />
                <Button
                  onClick={handleSend}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-900"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg z-50"
      >
        <MessageCircle className="w-6 h-6 text-slate-900" />
      </motion.button>
    </>
  );
};

export default ChatBot;