import DynamicPad from "../components/DynamidPad";
import PadToolbar from "../components/PadToolbar";
import EditableMediaPanel from "./components/EditableMediaPanel";
import { supabase } from "@/lib/supabase/supabase-server";

export default async function SpacePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  const { data: sketch } = await supabase
    .from("sketch")
    .select(`
      *,
      sketch_media (
        *,
        media (*)
      )
    `)
    .eq("id", id)
    .single();


  return (
    <div className="h-screen flex justify-center flex-col items-center">
      <PadToolbar sketchId={id} />
      <EditableMediaPanel sketchMedia={sketch?.sketch_media || []} sketchId={id} />
      <div>
        <DynamicPad sketch={sketch} />
      </div>
    </div>
  );
}