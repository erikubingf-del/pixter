// src/components/NavBar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  CreditCard,
  History,
  Settings,
  ExternalLink,
} from "lucide-react";
import { useMotoristaProfile } from "@/hooks/useMotoristaProfile";
import {
  buildPathWithSearch,
  sanitizeInternalCallbackUrl,
} from "@/lib/utils/navigation";
import Logo from "./Logo";

// Define a type for the user object within the session for better type safety
interface UserSession {
  id?: string;
  tipo?: "cliente" | "motorista";
  celular?: string; // Use celular for public page link
  email?: string; // For displaying in profile dropdown
  name?: string; // For displaying in profile dropdown
  image?: string; // For avatar in profile dropdown
  stripeAccountId?: string; // Assuming this exists when Stripe is connected
  // Add other user properties if available and needed
}

interface SessionData {
  user?: UserSession;
  expires?: string;
}

export default function NavBar() {
  // Use the specific type for the session data
  const { data: session, status } = useSession() as {
    data: SessionData | null;
    status: "loading" | "authenticated" | "unauthenticated";
  };
  const { profile } = useMotoristaProfile();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const userType = session?.user?.tipo;
  const canUseDriverView = Boolean(profile?.can_use_driver_view || userType === "motorista");
  const prefersDriverView = Boolean(profile?.tipo === "motorista" || userType === "motorista");
  const currentPathWithSearch = buildPathWithSearch(pathname, searchParams);
  const isPublicPaymentPage =
    pathname.startsWith("/pagamento/") || /^\/\+?[0-9]{10,}$/.test(pathname);

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  // --- Close mobile menu on route change ---
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [pathname]);

  // --- Close menus when clicking outside ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    }

    if (isMobileMenuOpen || isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen, isProfileDropdownOpen]);

  // --- Redirection Logic ---
  useEffect(() => {
    if (isLoading) return;

    // Regex to specifically match /[phoneNumber] (assuming it's numeric) and not other root paths

    const isClientAuthPage = ["/login", "/cadastro"].includes(pathname);
    const isDriverAuthPage = pathname === "/motorista/login";
    const defaultAuthenticatedPath =
      canUseDriverView && prefersDriverView
        ? "/motorista/dashboard/overview"
        : "/cliente/dashboard";
    const authPageTarget = sanitizeInternalCallbackUrl(
      searchParams.get("callbackUrl"),
      "/auth/post-login"
    );

    if (isAuthenticated) {
      if (isClientAuthPage || isDriverAuthPage) {
        router.replace(authPageTarget);
        return;
      }
      if (pathname === "/") {
        router.replace(defaultAuthenticatedPath);
        return;
      }
      if (!canUseDriverView && pathname.startsWith("/motorista/")) {
        router.replace("/cliente/dashboard");
        return;
      }
    }

    if (status === "unauthenticated") {
      // Only redirect if definitively unauthenticated
      const callbackUrlParam = `?callbackUrl=${encodeURIComponent(currentPathWithSearch)}`;
      if (
        pathname.startsWith("/cliente/") ||
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/payment-methods")
      ) {
        router.replace(`/login${callbackUrlParam}`);
        return;
      }
      if (pathname.startsWith("/motorista/") && !isDriverAuthPage) {
        router.replace(`/login?callbackUrl=${encodeURIComponent(currentPathWithSearch)}`);
        return;
      }
    }
  }, [
    status,
    userType,
    canUseDriverView,
    prefersDriverView,
    pathname,
    router,
    searchParams,
    currentPathWithSearch,
    isAuthenticated,
    isLoading,
  ]);

  // --- Sign-out Handler ---
  const handleSignOut = async () => {
    setIsProfileDropdownOpen(false);
    await signOut({ redirect: false });
    router.push("/");
  };

  // --- Determine Logo Link ---
  let logoHref = "/";
  if (isAuthenticated) {
    if (canUseDriverView && prefersDriverView) logoHref = "/motorista/dashboard/overview";
    else logoHref = "/cliente/dashboard";
  }

  // --- Profile Menu Items ---
  const getProfileMenuItems = () => {
    // if (!isAuthenticated) return [];

    if (!canUseDriverView) {
      return [
        {
          href: "/cliente/dashboard/historico",
          text: "Histórico",
          icon: <History className="w-4 h-4 mr-2" />,
        },
        {
          href: "/cliente/payment-methods",
          text: "Meus Cartões",
          icon: <CreditCard className="w-4 h-4 mr-2" />,
        },
        {
          href: "/settings",
          text: "Configurações",
          icon: <Settings className="w-4 h-4 mr-2" />,
        },
        {
          onClick: handleSignOut,
          text: "Sair da Conta",
          icon: <LogOut className="w-4 h-4 mr-2" />,
        },
      ];
    } else if (canUseDriverView) {
      const isStripeConnected = profile?.stripe_ready;

      return [
        {
          href: "/cliente/dashboard",
          text: "Área do Cliente",
          icon: <CreditCard className="w-4 h-4 mr-2" />,
        },
        {
          href: "/motorista/dashboard/pagamentos",
          text: "Histórico",
          icon: <History className="w-4 h-4 mr-2" />,
        },
        {
          href: "/motorista/lucro",
          text: "Analytics",
          icon: <CreditCard className="w-4 h-4 mr-2" />,
        },
        {
          href: isStripeConnected
            ? "/motorista/dashboard/pagina-pagamento"
            : "/motorista/stripe-onboarding",
          text: isStripeConnected
            ? "Página de Pagamento"
            : "Conectar Stripe",
          icon: <ExternalLink className="w-4 h-4 mr-2" />,
        },
        {
          href: "/settings",
          text: "Configurações",
          icon: <Settings className="w-4 h-4 mr-2" />,
        },
        {
          onClick: handleSignOut,
          text: "Sair da Conta",
          icon: <LogOut className="w-4 h-4 mr-2" />,
        },
      ];
    }

    return [];
  };

  // --- Navigation Links ---
  const getNavigationLinks = () => {
    const callbackUrlParam = `?callbackUrl=${encodeURIComponent(currentPathWithSearch)}`;

    if (isPublicPaymentPage) {
      if (!isAuthenticated) {
        return [
          { href: `/login${callbackUrlParam}`, text: "Entrar" },
          { href: `/cadastro${callbackUrlParam}`, text: "Criar Conta" },
        ];
      }

      if (canUseDriverView) {
        return [
          { href: "/cliente/dashboard", text: "Área do Cliente" },
          { href: "/motorista/dashboard/overview", text: "Área do Motorista" },
        ];
      }

      return [];
    } else if (!isAuthenticated) {
      // Unauthenticated user on non-public page
      return [
        { href: "/login", text: "Acesse sua Conta" },
        { href: "/cadastro", text: "Criar Conta" },
        { href: "/cadastro?mode=driver", text: "Receber Pagamentos" },
      ];
    }

    // Authenticated user will use profile dropdown, no additional nav links needed
    return [];
  };

  // Helper to render link or button
  const renderLink = (
    link: {
      href?: string;
      text: string;
      onClick?: () => void;
      icon?: React.ReactNode;
      disabled?: boolean;
      title?: string;
    },
    isMobile: boolean
  ) => {
    const baseStyle = isMobile
      ? "block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors duration-150 cursor-pointer"
      : "text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-xl transition-colors duration-150 cursor-pointer";

    if (link.href && !link.disabled) {
      return (
        <Link
          key={link.text}
          href={link.href}
          className={`${baseStyle} flex items-center`}
          title={link.title}
        >
          {link.icon && link.icon}
          {link.text}
        </Link>
      );
    } else if (link.href && link.disabled) {
      return (
        <span
          key={link.text}
          className={`${baseStyle} opacity-50 cursor-not-allowed flex items-center`}
          title={link.title}
        >
          {link.icon && link.icon}
          {link.text} (Unavailable)
        </span>
      );
    } else if (link.onClick) {
      return (
        <button
          key={link.text}
          onClick={link.onClick}
          className={`${baseStyle} flex items-center`}
          title={link.title}
        >
          {link.icon && link.icon}
          {link.text}
        </button>
      );
    }
    return null;
  };

  // --- Render NavBar ---
  // Determine if the simplified public view should be shown (Guests and Drivers on Public Page)
  const showSimplifiedPublicView =
    isPublicPaymentPage && (!isAuthenticated || canUseDriverView);

  return (
    <header
      className={`sticky top-0 z-50 border-b ${showSimplifiedPublicView ? "bg-transparent border-transparent shadow-none" : "bg-white/95 backdrop-blur-md border-gray-100 shadow-sm"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Simplified view for Guests/Drivers on Public Page */}
        {showSimplifiedPublicView ? (
          <div className="flex items-center justify-center h-16 space-x-6">
            {isLoading ? (
              <div className="h-6 w-40 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              getNavigationLinks().map((link) => renderLink(link, false))
            )}
          </div>
        ) : (
          /* Standard view for all other cases */
          <div className="flex items-center justify-between h-16">
            {/* Logo - Hidden in simplified view */}
            <div className="flex-shrink-0">
              <Link href={logoHref} className="flex items-center" style={{ textDecoration: 'none' }}>
                <Logo />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              {isLoading ? (
                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : isAuthenticated ? (
                <>
                  {canUseDriverView && (
                    <div className="flex items-center rounded-full bg-gray-100 p-1">
                      <Link
                        href="/cliente/dashboard"
                        className={`px-3 py-1.5 text-sm font-medium rounded-full transition ${!pathname.startsWith("/motorista/")
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600"
                          }`}
                      >
                        Cliente
                      </Link>
                      <Link
                        href="/motorista/dashboard/overview"
                        className={`px-3 py-1.5 text-sm font-medium rounded-full transition ${pathname.startsWith("/motorista/")
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600"
                          }`}
                      >
                        Comerciante
                      </Link>
                    </div>
                  )}
                  {/* <span onClick={handleSignOut}>Logout</span> */}
                  <div className="relative" ref={profileDropdownRef}>
                    <button
                      onClick={() =>
                        setIsProfileDropdownOpen(!isProfileDropdownOpen)
                      }
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full pl-1 pr-3 py-1 transition-colors duration-150 cursor-pointer"
                      aria-expanded={isProfileDropdownOpen}
                      aria-haspopup="true"
                    >
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {session?.user?.image ? (
                          <div
                            className="h-7 w-7 rounded-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${session.user.image})` }}
                            aria-hidden="true"
                          />
                        ) : (
                          <User className="w-3.5 h-3.5 text-purple-600" />
                        )}
                      </div>
                      <span className="max-w-[120px] truncate">
                        {(session?.user?.name || session?.user?.email || "User").split(' ')[0]}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Profile Dropdown Menu */}
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl py-1.5 z-10 border border-gray-100 overflow-hidden">
                        {getProfileMenuItems().map((item, i, arr) => (
                          <div key={item.text}>
                            {i === arr.length - 1 && (
                              <div className="mx-3 my-1 h-px bg-gray-100" />
                            )}
                            {renderLink(item, false)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Regular links for unauthenticated users
                getNavigationLinks().map((link) => renderLink(link, false))
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {!showSimplifiedPublicView && isMobileMenuOpen && (
        <div
          ref={menuRef}
          className="md:hidden absolute top-16 inset-x-0 z-40 bg-white shadow-lg border-t border-gray-200"
          id="mobile-menu"
        >
          <div className="pt-2 pb-3 space-y-1">
            {isLoading ? (
              <div className="px-4 py-2">
                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : isAuthenticated ? (
              // User profile section in mobile menu
              <div className="px-4 py-2 border-b border-gray-200 mb-2">
                {canUseDriverView && (
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <Link
                      href="/cliente/dashboard"
                      className={`rounded-lg px-3 py-2 text-center text-sm font-medium ${!pathname.startsWith("/motorista/")
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      Cliente
                    </Link>
                    <Link
                      href="/motorista/dashboard/overview"
                      className={`rounded-lg px-3 py-2 text-center text-sm font-medium ${pathname.startsWith("/motorista/")
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      Comerciante
                    </Link>
                  </div>
                )}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    {session?.user?.image ? (
                      <div
                        className="h-10 w-10 rounded-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${session.user.image})` }}
                        aria-hidden="true"
                      />
                    ) : (
                      <User className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {session?.user?.name || "User"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {session?.user?.email || ""}
                    </div>
                  </div>
                </div>

                {/* Profile menu items */}
                {getProfileMenuItems().map((item) => renderLink(item, true))}
              </div>
            ) : (
              // Regular links for unauthenticated users
              getNavigationLinks().map((link) => renderLink(link, true))
            )}
          </div>
        </div>
      )}
    </header>
  );
}
