import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
				mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// BI Platform specific colors
				revenue: 'hsl(var(--revenue))',
				growth: 'hsl(var(--growth))',
				warning: 'hsl(var(--warning))',
				info: 'hsl(var(--info))',
				success: 'hsl(var(--success))',
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-success': 'var(--gradient-success)',
				'gradient-bg': 'var(--gradient-bg)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-surface': 'var(--gradient-surface)',
			},
			boxShadow: {
				'glow': 'var(--shadow-glow-primary)',
				'glow-primary': 'var(--shadow-glow-primary)',
				'glow-secondary': 'var(--shadow-glow-secondary)',
				'card': 'var(--shadow-card)',
				'card-hover': 'var(--shadow-card-hover)',
				'professional': '0 1px 2px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.1), 0 6px 12px rgba(0,0,0,0.08)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-in-up': {
					from: { opacity: '0', transform: 'translateY(16px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					from: { opacity: '0', transform: 'scale(0.97)' },
					to: { opacity: '1', transform: 'scale(1)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: 'var(--shadow-glow-primary)' },
					'50%': { boxShadow: '0 0 30px hsl(224 100% 64% / 0.25), 0 0 50px hsl(258 65% 68% / 0.15)' }
				},
				'gradient-shift': {
					'0%, 100%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' }
				},
				'slide-in-left': {
					from: { opacity: '0', transform: 'translateX(-12px)' },
					to: { opacity: '1', transform: 'translateX(0)' }
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
				'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
				'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
				'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
				'gradient-shift': 'gradient-shift 6s ease infinite',
				'slide-in-left': 'slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;