"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function WhatsAppDemoPage() {
  const [userId, setUserId] = useState<string>("");
  const [contactsText, setContactsText] = useState<string>("");
  const [messageText, setMessageText] = useState<string>("Bonjour! Rejoignez ma cagnotte WOLO 🎉");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  function parseContacts(text: string) {
    return text
      .split(/\n|,|;|\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((phone) => ({ phone_number: phone }));
  }

  async function importContacts() {
    setLoading(true);
    try {
      const contacts = parseContacts(contactsText);
      const res = await fetch("/next_api/whatsapp/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), contacts }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  async function sendBulk() {
    setLoading(true);
    try {
      const recipients = contactsText
        .split(/\n|,|;|\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await fetch("/next_api/whatsapp/messages/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(userId),
          message: {
            message_text: messageText,
            recipients,
          },
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <Textarea placeholder="Enter phone numbers (newline/comma separated)" value={contactsText} onChange={(e) => setContactsText(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={importContacts} disabled={loading || !userId || !contactsText}>Import Contacts</Button>
            <Button onClick={sendBulk} variant="secondary" disabled={loading || !userId || !contactsText}>Send Bulk</Button>
          </div>
          <Input placeholder="Message text" value={messageText} onChange={(e) => setMessageText(e.target.value)} />
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
}