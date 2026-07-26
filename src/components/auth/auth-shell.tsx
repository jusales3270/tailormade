import Image from "next/image";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="tela-auth">
      <div className="auth-card">
        <div className="auth-card__marca">
          <Image src="/logo.png" alt="Tailor Made" width={140} height={77} priority className="auth-card__logo" />
        </div>
        {children}
      </div>
    </div>
  );
}
