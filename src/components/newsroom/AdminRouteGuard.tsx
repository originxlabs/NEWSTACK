import { OwnerOnlyGuard } from "@/components/newsroom/OwnerOnlyGuard";

interface AdminRouteGuardProps {
  children: React.ReactNode;
  pageName: string;
}

export function AdminRouteGuard({ children, pageName }: AdminRouteGuardProps) {
  return (
    <OwnerOnlyGuard requireOwner={false} pageName={pageName}>
      {children}
    </OwnerOnlyGuard>
  );
}