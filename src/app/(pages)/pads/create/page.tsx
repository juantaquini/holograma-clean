import CreatePadPage from "./components/CreatePadPage";

type PageProps = {
  searchParams?: Promise<{ channelId?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  return <CreatePadPage channelId={params.channelId ?? null} />;
}
