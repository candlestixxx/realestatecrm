'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { sendSmsAction } from '@/lib/actions/sms';

export default function SmsForm({ leadId, phone }: { leadId?: string; phone?: string | null }) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [customPhone, setCustomPhone] = useState(phone || '');

  const targetPhone = phone || customPhone;

  const handleTwilioSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPhone) {
      toast.error('No phone number entered.');
      return;
    }
    setIsSending(true);
    const formData = new FormData();
    if (leadId) formData.append('leadId', leadId);
    formData.append('phone', targetPhone);
    formData.append('message', message);

    try {
      const res = await sendSmsAction(formData);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Message sent successfully via Twilio!');
        setMessage('');
      }
    } catch (err) {
      toast.error('Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleNativeSend = () => {
    if (!targetPhone) {
      toast.error('No phone number entered.');
      return;
    }
    // Open OS default SMS client
    const smsUrl = `sms:${targetPhone}${targetPhone.includes('@') ? '' : `?body=${encodeURIComponent(message)}`}`;
    window.location.href = smsUrl;
    toast.success('Opening native SMS client...');
  };

  return (
    <div className="border border-border rounded-xl p-4 bg-muted/5 space-y-4">
      <h3 className="text-sm font-bold flex items-center gap-2">
         <span className="text-primary">📱</span> Draft SMS Message
      </h3>

      {!phone && (
        <div className="mb-2">
          <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Recipient Phone</label>
          <input
            type="text"
            value={customPhone}
            onChange={(e) => setCustomPhone(e.target.value)}
            placeholder="Enter phone number..."
            className="w-full p-2.5 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
      )}

      <textarea 
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full h-24 p-3 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary focus:outline-none" 
        placeholder={targetPhone ? `Type message to ${targetPhone}...` : "Type message here..."}
        disabled={!targetPhone}
        required
      ></textarea>
      <div className="flex flex-wrap gap-2 justify-end">
        <button 
          onClick={handleNativeSend}
          disabled={!targetPhone || !message.trim()}
          className="px-3 py-2 bg-secondary text-secondary-foreground font-bold text-xs rounded-md disabled:opacity-50 hover:bg-secondary/90 transition-colors flex items-center gap-1.5"
          type="button"
          title="Send text using your personal phone connected to this device"
        >
          📲 Use Personal Phone
        </button>
        <button 
          onClick={handleTwilioSend}
          disabled={!targetPhone || isSending || !message.trim()}
          className="px-3 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-md disabled:opacity-50 hover:bg-primary/90 transition-colors"
          type="button"
        >
          {isSending ? 'Sending...' : 'Send via Twilio'}
        </button>
      </div>
    </div>
  );
}