import { Metadata } from "next";
import NotificationsPageClient from "./NotificationsPageClient";

export const metadata: Metadata = {
  title: "Notifications | Skatehive",
  description: "View your notifications on Skatehive.",
};

export default function NotificationsPage() {
  return <NotificationsPageClient />;
}
