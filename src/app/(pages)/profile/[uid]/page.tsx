import ProfilePage from "./components/ProfilePage";

type PageProps = {
  params: Promise<{ uid: string }>;
};

export default async function Page({ params }: PageProps) {
  const { uid } = await params;
  return <ProfilePage uid={uid} />;
}
