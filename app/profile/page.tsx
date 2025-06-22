import { Metadata } from "next";
import ProfilePageClient from "./ProfilePageClient";

export const metadata: Metadata = {
  title: "Profile | Skatehive",
  description: "View your profile on Skatehive.",
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}
