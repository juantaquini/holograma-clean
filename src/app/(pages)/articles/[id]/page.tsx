import ArticlePage from "./components/ArticlePage";

export default async function Page({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  return <ArticlePage id={id} />;
}
