import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl text-zinc-50">Contact</h1>
      <Card>
        <CardHeader>
          <CardTitle>Send Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3">
            <Input placeholder="Email" type="email" required />
            <Input placeholder="Subject" required />
            <Textarea placeholder="Message" required />
            <Button type="submit">Submit</Button>
          </form>
          <p className="mt-3 text-sm text-zinc-400">
            This MVP form is informational. Configure a transactional provider in V1 for delivery.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
