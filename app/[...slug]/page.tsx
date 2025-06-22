// app/[...slug]/page.tsx

import PostPage from "@/components/blog/PostPage";
import NotificationsComp from "@/components/notifications/NotificationsComp";
import ProfilePage from "@/components/profile/ProfilePage";
import MainWallet from "@/components/wallet/MainWallet";
import HiveClient from "@/lib/hive/hiveclient";
import { cleanUsername } from "@/lib/utils/cleanUsername";
import { Metadata, ResolvingMetadata } from "next";

// Constants
const DOMAIN_URL = "https://my.skatehive.app";
const FALLBACK_IMAGE = "https://my.skatehive.app/ogimage.png";
const FALLBACK_METADATA = {
  title: "Skatehive",
  description: "The infinity skateboard magazine",
};

// Helper function to check if slug is a username
const isUsername = (slug: string): boolean => {
  return decodeURIComponent(slug).startsWith("@");
};

// Helper function to generate post metadata
const generatePostMetadata = async (user: string, permlink: string) => {
  const decodedUser = decodeURIComponent(user);
  const decodedPermlink = decodeURIComponent(permlink);

  const post = await getData(decodedUser, decodedPermlink);
  if (!post || !post.author) {
    throw new Error("Post not found");
  }
  const author = cleanUsername(post.author);
  const title = post.title || "Untitled Post";
  const description = post.body
    ? post.body.slice(0, 160) + "..."
    : "No description available";
  const image = post.json_metadata?.image
    ? post.json_metadata.image[0]
    : FALLBACK_IMAGE;

  return {
    title: `${title} | ${author} | Skatehive`,
    description: description,
    openGraph: {
      title: `${title} | ${author} | Skatehive`,
      description: description,
      url: `${DOMAIN_URL}/@${author}/${decodedPermlink}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      siteName: "Skatehive",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${author} | Skatehive`,
      description: description,
      images: [image],
    },
    alternates: {
      canonical: `${DOMAIN_URL}/@${author}/${decodedPermlink}`,
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: image,
        button: {
          title: "View Post",
          action: {
            type: "launch_frame",
            name: "Skatehive",
            url: `${DOMAIN_URL}/@${author}/${decodedPermlink}`,
          },
        },
        postUrl: `${DOMAIN_URL}/@${author}/${decodedPermlink}`,
      }),
      "fc:frame:image": image,
      "fc:frame:post_url": `${DOMAIN_URL}/@${author}/${decodedPermlink}`,
    },
  };
};

export async function generateMetadata(
  props: { params: Promise<{ slug?: string[] }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;

  if (!params?.slug || !Array.isArray(params.slug)) {
    return FALLBACK_METADATA;
  }

  const { slug } = params;

  // Profile page
  if (slug.length === 1 && isUsername(slug[0])) {
    const username = cleanUsername(slug[0]);
    return {
      title: `${username} | Skatehive Profile`,
      description: `View ${username}'s profile on Skatehive.`,
    };
  }

  // Wallet page
  if (slug.length === 2 && isUsername(slug[0]) && slug[1] === "wallet") {
    const username = cleanUsername(slug[0]);
    console.log("wallet logs");
    return {
      title: `${username} | Wallet | Skatehive`,
      description: `View ${username}'s wallet on Skatehive.`,
    };
  }

  // Notifications page
  if (slug.length === 2 && isUsername(slug[0]) && slug[1] === "notifications") {
    const username = cleanUsername(slug[0]);
    return {
      title: `${username} | Notifications | Skatehive`,
      description: `View notifications for ${username} on Skatehive.`,
    };
  }

  // Post page
  const isPost =
    (slug.length === 2 &&
      isUsername(slug[0]) &&
      slug[1] !== "wallet" &&
      slug[1] !== "notifications") ||
    (slug.length === 3 && isUsername(slug[1]));

  if (isPost) {
    try {
      const [user, permlink] = slug;
      return await generatePostMetadata(user, permlink);
    } catch (error) {
      console.error("Error generating post metadata:", error);
      return {
        title: "Post | Skatehive",
        description: "View this post on Skatehive.",
      };
    }
  }

  // Fallback
  return FALLBACK_METADATA;
}

async function getData(user: string, permlink: string) {
  try {
    const cleanUser = user.startsWith("@") ? user.slice(1) : user;
    const postContent = await HiveClient.database.call("get_content", [
      cleanUser,
      permlink,
    ]);

    if (!postContent || !postContent.author) {
      throw new Error("Post not found");
    }

    return postContent;
  } catch (error) {
    console.error("Failed to fetch post content:", error);
    throw new Error("Failed to fetch post content");
  }
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;

  if (!params?.slug || !Array.isArray(params.slug)) {
    return <></>;
  }

  const { slug } = params;

  // Profile page: /@username
  if (slug.length === 1 && isUsername(slug[0])) {
    return <ProfilePage username={cleanUsername(slug[0])} />;
  }

  // Wallet page: /@username/wallet
  if (slug.length === 2 && isUsername(slug[0]) && slug[1] === "wallet") {
    return <MainWallet username={cleanUsername(slug[0])} />;
  }

  // Notifications page: /@username/notifications
  if (slug.length === 2 && isUsername(slug[0]) && slug[1] === "notifications") {
    return <NotificationsComp username={cleanUsername(slug[0])} />;
  }

  // Post page: /@username/permlink or /category/@username/permlink
  const isPostRoute =
    (slug.length === 2 &&
      isUsername(slug[0]) &&
      slug[1] !== "wallet" &&
      slug[1] !== "notifications") ||
    (slug.length === 3 && isUsername(slug[1]));

  if (isPostRoute) {
    const [user, permlink] = slug;
    return <PostPage author={cleanUsername(user)} permlink={permlink} />;
  }

  return <></>;
}
