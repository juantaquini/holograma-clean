import EditChannelPage from "./components/EditChannelPage";

type PageProps = {
  params: Promise<{ uid: string; channelSlug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { uid, channelSlug } = await params;
  return <EditChannelPage uid={uid} channelSlug={channelSlug} />;
}
