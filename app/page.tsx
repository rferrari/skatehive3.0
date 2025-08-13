import { Metadata } from "next";
import HomePageClient from "./HomePageClient";
import {mainMetadata} from "./metadata"

export const metadata = mainMetadata;

export default function Home() {
  return <HomePageClient />;
}
