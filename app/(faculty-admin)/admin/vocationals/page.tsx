import { redirect } from "next/navigation";

export default function AdminVocationalsPage() {
  redirect("/admin?tab=vocationals");
}
