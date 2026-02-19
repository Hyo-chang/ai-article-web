// tailwind.config.cjs
module.exports = {
    darkMode: 'class',
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}" // src 아래 모든 React 파일들 감지
    ],
    theme: {
      extend: {
        colors: {
          'ai-purple': '#7C3AED',
          'ai-pink': '#EC4899',
          'text-strong': '#1F1F25',
          'text-subtle': '#7D7D8A',
        },
        boxShadow: {
          'glass': '0 8px 30px rgba(0,0,0,0.08)',
        },
        borderRadius: {
          '3xl': '1.5rem'
        },
        keyframes: {
          'fade-in': {
            '0%': { opacity: '0', transform: 'translateX(10px)' },
            '100%': { opacity: '1', transform: 'translateX(0)' },
          },
        },
        animation: {
          'fade-in': 'fade-in 0.3s ease-out forwards',
        },
      },
    },
    plugins: [
      require("@tailwindcss/typography"), // prose 클래스 쓰려면 필요
    ],
  };
  