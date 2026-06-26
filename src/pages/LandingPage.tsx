import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Calendar, Activity, Heart, Shield, Stethoscope, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function LandingPage() {
  const easeOut = [0.16, 1, 0.3, 1] as const;

  const fadeInUp = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
  };

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <span className="font-display text-xl tracking-tight">MediCare+</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Services</a>
            <a href="#doctors" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Doctors</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
          <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-accent-secondary/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="max-w-2xl"
            >
              <motion.div variants={fadeInUp}>
                <Badge pulsing className="mb-6">Next-Gen Healthcare</Badge>
              </motion.div>
              
              <motion.h1 variants={fadeInUp} className="font-display text-5xl sm:text-6xl lg:text-[5.25rem] leading-[1.05] tracking-tight mb-8">
                Healthcare that revolves around <span className="gradient-text relative inline-block">you<div className="gradient-underline" /></span>
              </motion.h1>
              
              <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
                Experience a new standard of medical care. Seamless appointments, instant digital records, and world-class specialists at your fingertips.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" icon={<ArrowRight size={20} />} iconPosition="right" className="w-full sm:w-auto">
                    Book Appointment
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Patient Portal
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div variants={fadeInUp} className="mt-12 flex items-center gap-6 pt-8 border-t border-border">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-10 h-10 rounded-full border-2 border-background" />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-accent">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Trusted by 10,000+ patients</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Abstract Graphic */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="hidden lg:block relative h-[600px] w-full"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Rotating Ring */}
                <div className="absolute w-[500px] h-[500px] border border-border border-dashed rounded-full animate-[spin_60s_linear_infinite]" />
                
                {/* Center Core */}
                <div className="absolute w-64 h-64 bg-gradient-to-br from-accent/10 to-accent-secondary/20 rounded-full blur-2xl" />
                
                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-20 right-10 bg-card rounded-2xl p-4 shadow-xl border border-border flex items-center gap-4 w-64"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Appointment Confirmed</p>
                    <p className="text-xs text-muted-foreground">Today, 10:30 AM</p>
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [15, -15, 15] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-32 left-0 bg-card rounded-2xl p-4 shadow-xl border border-border flex items-center gap-4 w-60 z-10"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Vitals Normal</p>
                    <p className="text-xs text-muted-foreground">Updated 2m ago</p>
                  </div>
                </motion.div>
                
                {/* Main Visual */}
                <div className="relative w-80 h-[420px] bg-foreground rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-white dot-pattern flex flex-col justify-between p-6">
                  <div className="flex justify-between items-center text-white/80">
                    <Heart size={24} className="text-accent" />
                    <span className="font-mono text-xs">LIVE</span>
                  </div>
                  <div className="space-y-4">
                    <div className="h-20 bg-white/10 rounded-xl w-full" />
                    <div className="flex gap-4">
                      <div className="h-24 bg-accent rounded-xl w-1/2" />
                      <div className="h-24 bg-white/10 rounded-xl w-1/2" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Inverted Section */}
        <section id="services" className="py-28 bg-foreground text-background dot-pattern relative">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-20">
              <Badge className="mb-6 border-white/20 bg-white/5 text-white">Why Choose Us</Badge>
              <h2 className="font-display text-4xl md:text-5xl mb-6 tracking-tight">Excellence in every interaction</h2>
              <p className="text-lg text-white/60">We've redesigned the healthcare experience from the ground up to be intuitive, transparent, and built around your needs.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Stethoscope, title: "Expert Specialists", desc: "Access to top-tier medical professionals across 20+ specialized departments." },
                { icon: Shield, title: "Secure Records", desc: "Your medical history is encrypted and accessible only to you and authorized doctors." },
                { icon: Users, title: "Family Management", desc: "Manage appointments and records for your entire family from a single intuitive dashboard." }
              ].map((feature, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
                  <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-white mb-6">
                    <feature.icon size={28} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-12 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} MediCare+ Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
