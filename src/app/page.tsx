import { redirect } from "next/navigation";
import { Suspense } from "react";

import LoginPage from "@/components/LoginPage";
import { getCurrentUser } from "@/lib/auth/session";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/onboarding");
  }

  return <LoginPage />;
}
