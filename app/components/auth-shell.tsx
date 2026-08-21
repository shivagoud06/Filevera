import type { ReactNode } from "react";

export default function AuthShell({ children }: { children: ReactNode }) {
    return <div className="auth-shell"><main className="auth-page flex flex-1 items-center justify-center bg-white px-5 py-6 sm:py-8">{children}</main><p className="auth-copyright">© {new Date().getFullYear()} Filevera. All rights reserved.</p></div>;
}
