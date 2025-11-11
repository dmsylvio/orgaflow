"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/ib/trpc/client";

export default function CustomersTestPage() {
  const [q, setQ] = useState("");
  const query = trpc.customers.list.useQuery(
    { q },
    { refetchOnWindowFocus: false },
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Customers (teste via tRPC)</h1>

      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar..."
          className="rounded-md border px-3 py-2 outline-none focus:ring"
        />
        <Button
          onClick={() => query.refetch()}
          className="rounded-md bg-black text-white px-4 py-2"
        >
          Buscar
        </Button>
      </div>

      {query.isLoading ? <p>Carregando...</p> : null}
      {query.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
          <div className="font-medium">Erro</div>
          <div>{query.error.message}</div>
        </div>
      ) : null}

      {query.data ? (
        <div className="rounded-lg border p-4 bg-white">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(query.data, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

