import EditPadPage from "./components/EditPadPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EditPadPage id={id} />;
}
