# 🌊 Flow: The Minimalist Financial Tracker

**Flow** is a high-performance, minimalist financial tracking application designed to help you master your money without the friction of complex spreadsheets. Built with a focus on speed, aesthetics, and intelligence.

![Flow Dashboard](https://github.com/vinishhs/Flow-tracker/raw/main/public/demo.png) *(Note: Add a real screenshot here later)*

## ✨ Key Features

- **🚀 Instant Parser**: Paste your raw transaction notes (e.g., "₹500 for lunch") and let Flow handle the categorization and math.
- **👻 Ghost Impact Logic**: See the real-time impact of your spending before you even save it.
- **🛡️ Debt Recovery**: Specialized tracking for "What I Lent" vs "What is Owed".
- **📊 Interactive Analytics**: Beautifully rendered charts and trends using Recharts and Framer Motion.
- **🌙 Dark-First Design**: Glassmorphism and high-contrast UI for a premium experience.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **3D Elements**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- **Charts**: [Recharts](https://recharts.org/)

## 🚀 Getting Started

Follow these steps to get the project running locally.

### 1. Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.org/)

### 2. Clone the Repository

```bash
git clone https://github.com/vinishhs/Flow-tracker.git
cd Flow-tracker
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Variables

Create a `.env.local` file in the root directory and add your Supabase credentials:

```bash
# Copy from .env.example
cp .env.example .env.local
```

Then edit `.env.local` with your actual values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

- `/app`: Next.js App Router pages and API routes.
- `/components`: Reusable UI components.
- `/lib`: Helper functions, services (parser), and Supabase client.
- `/supabase`: Database migrations and configuration.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is private and for personal use.

---

Built with ❤️ by [vinishhs](https://github.com/vinishhs)
