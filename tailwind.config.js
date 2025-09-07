/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			
  			// Editorial Brand Colors
  			brand: {
  				teal: 'hsl(var(--brand-teal))',
  				orange: 'hsl(var(--brand-orange))',
  				purple: 'hsl(var(--brand-purple))',
  				warm: {
  					50: 'hsl(var(--brand-warm-50))',
  					100: 'hsl(var(--brand-warm-100))',
  					200: 'hsl(var(--brand-warm-200))'
  				}
  			},
  			
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			xl: 'calc(var(--radius) + 2px)',
  			'2xl': 'calc(var(--radius) + 4px)'
  		},
  		animation: {
  			'float': 'float 6s ease-in-out infinite',
  			'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
  			'fade-in': 'fade-in 0.5s ease-out',
  			'slide-up': 'slide-up 0.3s ease-out',
  			'scale-in': 'scale-in 0.2s ease-out'
  		},
  		keyframes: {
  			float: {
  				'0%, 100%': { transform: 'translateY(0px)' },
  				'50%': { transform: 'translateY(-10px)' }
  			},
  			'pulse-slow': {
  				'0%, 100%': { opacity: '1' },
  				'50%': { opacity: '0.8' }
  			},
  			'fade-in': {
  				'from': { opacity: '0', transform: 'translateY(10px)' },
  				'to': { opacity: '1', transform: 'translateY(0)' }
  			},
  			'slide-up': {
  				'from': { opacity: '0', transform: 'translateY(20px)' },
  				'to': { opacity: '1', transform: 'translateY(0)' }
  			},
  			'scale-in': {
  				'from': { opacity: '0', transform: 'scale(0.9)' },
  				'to': { opacity: '1', transform: 'scale(1)' }
  			}
  		},
  		boxShadow: {
  			'editorial': '0 4px 20px -2px hsl(var(--primary) / 0.1)',
  			'warm': '0 4px 20px -2px hsl(var(--warning) / 0.15)',
  			'accent': '0 4px 20px -2px hsl(var(--accent) / 0.2)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
