import HomePage from "@/views/HomePage";
import { buildMetadata } from "./site";

export async function generateMetadata() {
  return buildMetadata("home");
}

export default function Page() {
  return <HomePage />;
}
