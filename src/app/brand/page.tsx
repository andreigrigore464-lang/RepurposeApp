/**
 * Brand Redirect
 * Redirects legacy /brand route to the consolidated /templates workspace.
 * System Layer: ui / brand
 */

import { redirect } from "next/navigation";

export default function BrandPage() {
  redirect("/templates");
}
