import dynamic from "next/dynamic";
import { Metadata } from "next";
import { skatespotsMetadata } from "../metadata";

export const metadata = skatespotsMetadata;

const EmbeddedMap = dynamic(() => import("@/components/spotmap/EmbeddedMap"), { ssr: true });

export default function MapPage() {
  return <EmbeddedMap />;
}