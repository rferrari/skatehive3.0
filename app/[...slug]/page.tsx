// app/[...slug]/page.tsx

import PostPage from "@/components/blog/PostPage";
import NotificationsComp from "@/components/notifications/NotificationsComp";
import ProfilePage from "@/components/profile/ProfilePage";
import MainWallet from "@/components/wallet/MainWallet";
import HiveClient from "@/lib/hive/hiveclient";
import { Metadata, ResolvingMetadata } from "next";

// Constants
const DOMAIN_URL = "https://my.skatehive.app";
const FALLBACK_IMAGE = "https://my.skatehive.app/ogimage.png";
const FALLBACK_METADATA = {
  title: 'Skatehive',
  description: 'The infinity skateboard magazine',
};

// Helper function to clean username from @ symbol
const cleanUsername = (slug: string): string => {
  const decoded = decodeURIComponent(slug);
  return decoded.startsWith("@") ? decoded.slice(1) : decoded;
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

  // Extract images from markdown and metadata
  const images = post.body ? post.body.match(/!\[.*?\]\((.*?)\)/g) : [];
  const imageUrls = images
    ? images.map((img: string) => {
      const match = img.match(/\((.*?)\)/);
      return match ? match[1] : "";
    })
    : [];

  const originalBanner = post.json_metadata?.image || imageUrls[0] || [];
  const postUrl = new URL(`/@${decodedUser}/${decodedPermlink}`, DOMAIN_URL).toString();

  const frameImage =
    (Array.isArray(imageUrls) && imageUrls[0]) ||
    (Array.isArray(originalBanner) && originalBanner[0]) ||
    FALLBACK_IMAGE;

  const frameObject = {
    version: "next",
    imageUrl: frameImage,
    button: {
      title: "Open post",
      action: {
        type: "launch_frame",
        name: "Skatehive",
        url: postUrl,
      },
    },
    postUrl: postUrl,
  };

  return {
    title: post.title,
    description: `${String(post.body).slice(0, 128)}...`,
    authors: [{ name: post.author }],
    applicationName: "SkateHive",
    openGraph: {
      url: postUrl,
      images: Array.isArray(originalBanner)
        ? originalBanner.map((img: string) => ({
          url: new URL(img, DOMAIN_URL).toString(),
          width: 1200,
          height: 630,
        }))
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: `${String(post.body).slice(0, 128)}...`,
      images: frameImage,
    },
    other: {
      "fc:frame": JSON.stringify(frameObject),
      "fc:frame:image": frameImage,
      "fc:frame:post_url": postUrl,
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
  const isPost = (slug.length === 2 && isUsername(slug[0]) &&
    slug[1] !== "wallet" && slug[1] !== "notifications") ||
    (slug.length === 3 && isUsername(slug[1]));

  if (isPost) {
    try {
      const [user, permlink] = slug;
      return await generatePostMetadata(user, permlink);
    } catch (error) {
      console.error("Error generating post metadata:", error);
      return {
        title: 'Post | Skatehive',
        description: 'View this post on Skatehive.',
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

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
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
  const isPostRoute = (slug.length === 2 && isUsername(slug[0]) &&
    slug[1] !== "wallet" && slug[1] !== "notifications") ||
    (slug.length === 3 && isUsername(slug[1]));

  if (isPostRoute) {
    const [user, permlink] = slug;
    return <PostPage author={cleanUsername(user)} permlink={permlink} />;
  }

  return <></>;
}
