import FeedPage from "./components/FeedPage";

type PageProps = {
  params: Promise<{ uid: string }>;
};

export default async function Page({ params }: PageProps) {
  const { uid } = await params;
  return <FeedPage uid={uid} />;
}
