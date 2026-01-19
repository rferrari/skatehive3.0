import { Metadata } from "next";
import ProfilePage from "@/components/profile/ProfilePage";
import { cleanUsername } from "@/lib/utils/cleanUsername";
import HiveClient from "@/lib/hive/hiveclient";
import { APP_CONFIG } from "@/config/app.config";

// Constants
const DOMAIN_URL = APP_CONFIG.BASE_URL;
const FALLBACK_AVATAR = "https://images.ecency.com/webp/u/default/avatar/small";
const FALLBACK_BANNER = `${APP_CONFIG.BASE_URL}/ogimage.png`;

type Props = {
  params: Promise<{ username: string }>;
};

async function getUserData(username: string) {
  try {
    const [profileInfo, hiveAccount] = await Promise.all([
      HiveClient.call("bridge", "get_profile", { account: username }),
      HiveClient.database.call("get_accounts", [[username]]),
    ]);

    if (!hiveAccount || hiveAccount.length === 0) {
      throw new Error("User not found");
    }

    const account = hiveAccount[0];
    let profileImage = `https://images.ecency.com/webp/u/${username}/avatar/small`;
    let coverImage = FALLBACK_BANNER;
    let about = "";
    let name = username;

    // Parse posting_json_metadata for profile info
    if (account?.posting_json_metadata) {
      try {
        const parsedMetadata = JSON.parse(account.posting_json_metadata);
        const profile = parsedMetadata?.profile || {};
        profileImage = profile.profile_image || profileImage;
        coverImage = profile.cover_image || coverImage;
        about = profile.about || "";
        name = profile.name || username;
      } catch (err) {
        console.warn("Failed to parse posting_json_metadata", err);
      }
    }

    return {
      username,
      name,
      about,
      profileImage,
      coverImage,
      followers: profileInfo?.stats?.followers || 0,
      following: profileInfo?.stats?.following || 0,
    };
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    throw new Error("Failed to fetch user data");
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const username = cleanUsername(params.username);

  try {
    const userData = await getUserData(username);
    const profileUrl = `${DOMAIN_URL}/user/${username}`;

    // Create description from about text or fallback
    const description = userData.about
      ? `${userData.about.slice(0, 128)}...`
      : `View ${userData.name || username}'s profile on Skatehive - ${
          userData.followers
        } followers, ${userData.following} following`;

    // Generate dynamic OpenGraph image using our gamified API
    const frameImage = `${DOMAIN_URL}/api/og/profile/${username}`;

    return {
      title: `${userData.name || username} | Skatehive Profile`,
      description: description,
      authors: [{ name: username }],
      applicationName: "Skatehive",
      openGraph: {
        title: `${userData.name || username} (@${username})`,
        description: description,
        url: profileUrl,
        images: [
          {
            url: frameImage,
            width: 1200,
            height: 630,
          },
        ],
        siteName: "Skatehive",
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title: `${userData.name || username} (@${username})`,
        description: description,
        images: frameImage,
      },
      other: {
        "fc:frame": JSON.stringify({
          version: "next",
          imageUrl: frameImage,
          button: {
            title: "View Profile",
            action: {
              type: "launch_frame",
              name: "Skatehive",
              url: profileUrl,
            },
          },
          postUrl: profileUrl,
        }),
        "fc:frame:image": frameImage,
        "fc:frame:post_url": profileUrl,
      },
    };
  } catch (error) {
    console.error("Error generating profile metadata:", error);
    return {
      title: `${username} | Skatehive Profile`,
      description: `View ${username}'s profile on Skatehive.`,
    };
  }
}

export default async function UserProfilePage(props: Props) {
  const params = await props.params;
  const username = cleanUsername(params.username);

  return <ProfilePage username={username} />;
}
