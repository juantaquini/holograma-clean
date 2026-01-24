import Link from "next/link";
import { supabase } from "@/lib/supabase/supabase-server";
import CreateSpaceButton from "./components/CreateSpaceButton";

export default async function SpacesPage() {
  const { data: sketches } = await supabase
    .from("sketch")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div style={{ marginTop: "100px" }} className="min-h-screen flex items-center justify-center px-6">
      <div  style={{ marginTop: "100px" }}  className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Spaces</h1>

        {/* BOTÓN */}
        <div className="flex justify-center mb-10">
          <CreateSpaceButton />
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sketches?.map((s) => (
            <Link
              key={s.id}
              href={`/space/${s.id}`}
              className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-center"
            >
              <div className="font-semibold">{s.name}</div>
              <div className="text-sm opacity-60 mt-2">
                {new Date(s.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
