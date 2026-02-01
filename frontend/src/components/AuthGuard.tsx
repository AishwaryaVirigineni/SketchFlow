"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (!isLoggedIn()) {
            router.push("/login"); // Redirect if not logged in
        } else {
            setAuthorized(true);
        }
    }, [router]);

    if (!authorized) {
        // Optional: Render a loader or nothing while checking
        return (
            <div className="flex items-center justify-center w-screen h-screen">
                <p>Checking authentication...</p>
            </div>
        );
    }

    return <>{children}</>;
}
