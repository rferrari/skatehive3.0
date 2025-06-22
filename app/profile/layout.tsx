import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile | Skatehive",
  description: "View and manage your Skatehive profile.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
