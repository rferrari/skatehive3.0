import { Metadata } from "next";
import ProfilePage from "@/components/profile/ProfilePage";
import { cleanUsername } from "@/lib/utils/cleanUsername";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const username = cleanUsername(params.username);

  return {
    title: `${username} | Skatehive Profile`,
    description: `View ${username}'s profile on Skatehive.`,
  };
}

export default async function UserProfilePage(props: Props) {
  const params = await props.params;
  const username = cleanUsername(params.username);

  return <ProfilePage username={username} />;
}
