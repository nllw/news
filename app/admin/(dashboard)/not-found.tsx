import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-xl font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-muted-ui-foreground">That page or record does not exist.</p>
      <Button className="mt-6" asChild>
        <Link href="/admin">Back to dashboard</Link>
      </Button>
    </div>
  );
}
