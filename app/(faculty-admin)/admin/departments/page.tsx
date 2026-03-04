import { redirect } from "next/navigation";

export default function AdminDepartmentsPage() {
  redirect("/admin?tab=departments");
}
