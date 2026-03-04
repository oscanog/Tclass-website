import { redirect } from "next/navigation";

export default function AdminAdmissionsPage() {
  redirect("/admin?tab=admissions");
}
