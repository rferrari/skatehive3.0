import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications | Skatehive",
  description: "View your notifications on Skatehive.",
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
