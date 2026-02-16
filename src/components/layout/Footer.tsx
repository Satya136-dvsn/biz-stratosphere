// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { Link } from "react-router-dom";
import { Github, FileText, Info } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm mt-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <img
                                src="/logo-orbit.png"
                                alt="Biz Stratosphere"
                                className="h-8 w-8 rounded-full bg-transparent object-contain"
                            />
                            <span className="font-bold text-lg">Biz Stratosphere</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Enterprise-grade business intelligence platform
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm">Quick Links</h3>
                        <nav className="flex flex-col space-y-2">
                            <Link
                                to="/platform-status"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                            >
                                <Info className="h-4 w-4" />
                                Platform Status
                            </Link>
                            <a
                                href="https://github.com/Satya136-dvsn/biz-stratosphere"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                            >
                                <Github className="h-4 w-4" />
                                GitHub
                            </a>
                            <Link
                                to="/auth"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                            >
                                <FileText className="h-4 w-4" />
                                Get Started
                            </Link>
                        </nav>
                    </div>

                    {/* Legal */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm">Resources</h3>
                        <p className="text-xs text-muted-foreground">
                            Built with React, TypeScript, and Supabase
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Designed for analytical clarity and enterprise scale
                        </p>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-8 pt-6 border-t border-border/50">
                    <p className="text-center text-sm text-muted-foreground">
                        © 2024 Biz Stratosphere. Built for analytical clarity and enterprise scale.
                    </p>
                </div>
            </div>
        </footer>
    );
}
