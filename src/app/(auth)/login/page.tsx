import AuthCard from "../AuthCard";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams;
  return <AuthCard initialMode="login" redirectTo={redirect} />;
}