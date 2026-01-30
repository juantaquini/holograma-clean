import ChannelPage from "./components/ChannelPage";

type PageProps = {
  params: Promise<{ uid: string; channelSlug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { uid, channelSlug } = await params;
  return <ChannelPage uid={uid} channelSlug={channelSlug} />;
}
