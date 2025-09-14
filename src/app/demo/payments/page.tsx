"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentsDemoPage() {
  const [potId, setPotId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function initiatePayment() {
    setLoading(true);
    try {
      const res = await fetch("/next_api/payments/wave/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pot_id: Number(potId),
          amount: Number(amount),
          donor_email: email || undefined,
          donor_name: name || undefined,
          donor_phone: phone || undefined,
          is_anonymous: false,
          show_name_consent: true,
          show_amount_consent: true,
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data?.data?.payment_url) {
        window.open(data.data.payment_url, "_blank");
      }
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Wave Payment Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Pot ID" value={potId} onChange={(e) => setPotId(e.target.value)} />
          <Input placeholder="Amount (CFA)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input placeholder="Donor email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Donor name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Donor phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button onClick={initiatePayment} disabled={loading || !potId || !amount}>
            {loading ? "Creating session..." : "Create Wave Session"}
          </Button>
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
}