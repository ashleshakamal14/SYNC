import React from 'react'
import Link from 'next/link'
import {
  Heart,
  Calendar,
  Sparkles,
  Activity,
  Smile,
  Apple,
  Shield,
  ArrowRight,
  MessageCircle,
  Users,
  CheckCircle2,
  Lock,
  ChevronRight,
  BookOpen,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-rose-100/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center shadow-md shadow-pink-500/20">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                SYNC
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#how-it-works" className="hover:text-pink-600 transition">How it Works</a>
            <a href="#features" className="hover:text-pink-600 transition">Features</a>
            <a href="#ai" className="hover:text-pink-600 transition">AI Technology</a>
            <a href="#privacy" className="hover:text-pink-600 transition">Privacy</a>
            <a href="#faq" className="hover:text-pink-600 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-gray-700 hover:text-pink-600 px-4 py-2 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold px-5 py-2.5 rounded-full wellness-gradient-btn shadow-md flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-pink-700 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>AI-Powered Women&apos;s Wellness Companion</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight mb-6">
            Understand Your Body. <br />
            <span className="bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 bg-clip-text text-transparent">
              Track Your Health.
            </span> <br />
            Feel Your Best.
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            SYNC is your intelligent wellness companion for menstrual cycle tracking, mood insights, nutrition guidance, and personalized AI-powered holistic support.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-semibold wellness-gradient-btn flex items-center justify-center gap-2 text-white shadow-lg shadow-pink-500/25 hover:shadow-xl transition-all"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-semibold bg-white border border-rose-200 text-gray-700 hover:bg-rose-50/50 hover:border-pink-300 transition-all flex items-center justify-center gap-2"
            >
              Explore Features
            </a>
          </div>

          {/* Value props bullets */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Zero Medical Jargon</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>100% Private &amp; Secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Explainable AI Insights</span>
            </div>
          </div>
        </div>
      </section>

      {/* How SYNC Works */}
      <section id="how-it-works" className="py-20 px-6 bg-white/60 border-y border-rose-100/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-pink-600 mb-2">
              Simple 4-Step Journey
            </h2>
            <p className="text-3xl font-bold text-gray-900">
              How SYNC Supports You Daily
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Log Your Day',
                desc: 'Easily log period dates, daily moods, physical symptoms, and hydration in seconds.',
                icon: Calendar,
                color: 'from-pink-500 to-rose-400',
              },
              {
                step: '02',
                title: 'Phase Calculation',
                desc: 'Our rule-based engine calculates your current phase: Menstrual, Follicular, Ovulation, or Luteal.',
                icon: Activity,
                color: 'from-rose-400 to-purple-400',
              },
              {
                step: '03',
                title: 'AI Pattern Analysis',
                desc: 'Sentiment analysis and RAG engines surface personalized lifestyle, sleep, and nutrition ideas.',
                icon: Sparkles,
                color: 'from-purple-500 to-indigo-400',
              },
              {
                step: '04',
                title: 'Thrive & Share',
                desc: 'Receive helpful reminders, export health summaries, or optionally share phase status with a partner.',
                icon: Users,
                color: 'from-emerald-400 to-teal-500',
              },
            ].map((s, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm relative group hover:-translate-y-1 transition-all"
              >
                <div className="text-3xl font-black text-rose-100 group-hover:text-pink-100 transition mb-4">
                  {s.step}
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${s.color} text-white flex items-center justify-center mb-4 shadow-sm`}
                >
                  <s.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-pink-600 mb-2">
              Holistic Features
            </h2>
            <p className="text-3xl font-bold text-gray-900">
              Everything You Need for Mind &amp; Body
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Cycle & Ovulation Prediction',
                desc: 'Rule-based and ML-assisted estimation of next period, ovulation day, and fertile windows.',
                icon: Calendar,
                badge: 'Cycle Engine',
              },
              {
                title: 'AI Phase Guidance',
                desc: 'Phase-specific recommendations for nutrition, exercise, sleep, productivity, and self-care.',
                icon: Sparkles,
                badge: 'Lifestyle',
              },
              {
                title: 'Mood & Sentiment Log',
                desc: 'Track feelings, journal entries, and stress levels with automated sentiment score trends.',
                icon: Smile,
                badge: 'Mindfulness',
              },
              {
                title: 'Symptom Tracker',
                desc: 'Log cramps, headaches, bloating, and fatigue with severity ratings from 1 to 5.',
                icon: Activity,
                badge: 'Health',
              },
              {
                title: 'Nutrition & Hydration',
                desc: 'Track water intake, iron-rich meals, hemoglobin notes, and dietary balance.',
                icon: Apple,
                badge: 'Vitality',
              },
              {
                title: 'Smart Reminders',
                desc: 'Gentle alerts for medicine, daily water goals, upcoming periods, and doctor visits.',
                icon: Heart,
                badge: 'Reminders',
              },
              {
                title: 'RAG AI Wellness Chatbot',
                desc: 'Ask questions and receive reliable, cited wellness answers powered by LangChain and FAISS.',
                icon: MessageCircle,
                badge: 'AI Assistant',
              },
              {
                title: 'Privacy-First Partner Mode',
                desc: 'Granular permissions to share cycle phase or mood with a trusted partner on your terms.',
                icon: Users,
                badge: 'Partner Care',
              },
              {
                title: 'Health Reports & Analytics',
                desc: 'Visual trend charts and downloadable PDF wellness summaries for your records or appointments.',
                icon: BookOpen,
                badge: 'Analytics',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="wellness-card p-6 flex flex-col justify-between hover:border-pink-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-pink-600 flex items-center justify-center">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section id="privacy" className="py-16 px-6 bg-rose-50/60 border-y border-rose-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-rose-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Your Health Data Belongs to You. Period.
          </h2>
          <p className="text-gray-600 text-base leading-relaxed mb-6">
            We believe women&apos;s health data is sensitive and personal. SYNC employs industry-standard encryption, strict user-scoped database isolation, and never shares your private journal entries without your explicit permission.
          </p>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-700 bg-white px-4 py-2 rounded-full border border-rose-200 shadow-xs">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Encrypted Data • User-Isolated Tables • No Third-Party Ad Selling</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-pink-600 mb-2">FAQ</h2>
          <p className="text-3xl font-bold text-gray-900">Frequently Asked Questions</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'Is SYNC a medical diagnosis tool?',
              a: 'No. SYNC provides general wellness information and lifestyle suggestions based on logged data. It is not a substitute for professional medical advice, diagnosis, or treatment.',
            },
            {
              q: 'How does the cycle prediction work?',
              a: 'SYNC uses a rule-based calculation based on your period start date and cycle length, and automatically applies weighted historical averages as you log more cycles.',
            },
            {
              q: 'What is Partner Mode?',
              a: 'Partner Mode allows you to invite a trusted partner with fine-grained permissions. You choose whether they can view your current cycle phase, mood, or profile.',
            },
            {
              q: 'Does the AI chatbot replace a doctor?',
              a: 'No. The AI wellness assistant provides general health education from curated wellness literature. For urgent or serious symptoms, always seek professional medical care.',
            },
          ].map((faq, idx) => (
            <div key={idx} className="bg-white rounded-xl p-5 border border-rose-100/80 shadow-xs">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-16 px-6 bg-gradient-to-tr from-pink-50 via-rose-50 to-purple-50 text-center border-t border-rose-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Start Your Wellness Journey Today
          </h2>
          <p className="text-gray-600 mb-8">
            Join SYNC and experience a compassionate, intelligent companion designed for your rhythm.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold wellness-gradient-btn shadow-lg text-white"
          >
            <span>Create Your Free Account</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-rose-100/80 py-8 px-6 text-center text-xs text-gray-500">
        <p className="mb-2">
          SYNC — AI-Powered Women&apos;s Wellness Companion. &copy; {new Date().getFullYear()} All rights reserved.
        </p>
        <p className="text-gray-400">
          Disclaimer: SYNC provides general wellness information and is not a substitute for professional medical advice.
        </p>
      </footer>
    </div>
  )
}
