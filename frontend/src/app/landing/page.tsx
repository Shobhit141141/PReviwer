"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {  CardContent } from "@/components/ui/card";
import {
  Zap,
  Shield,
  TrendingUp,
  Code,
  Users,
  
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  Bot,
  Sparkles,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import WorkflowSection from "@/components/workflow";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Bot className="h-8 w-8 text-blue-400" />,
      title: "AI-Powered Analysis",
      description: "Advanced AI analyzes PRs for code quality, security, and performan.",
      color: "bg-blue-400"
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-400" />,
      title: "Lightning Fast",
      description: "Get instant feedback on PRs with our optimized engine and smart caching.",
      color: "yellow"
    },
    {
      icon: <Shield className="h-8 w-8 text-green-400" />,
      title: "Security First",
      description: "Detect vulnerabilities and get recommendations before deployment.",
      color: "green"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-purple-400" />,
      title: "Actionable Insights",
      description: "Detailed reports with clear steps to improve your code quality.",
      color: "purple"
    },
    {
      icon: <Code className="h-8 w-8 text-pink-400" />,
      title: "Multi-Language Support",
      description: "Supports many languages and frameworks with custom rules.",
      color: "pink"
    },
    {
      icon: <Users className="h-8 w-8 text-cyan-400" />,
      title: "Team Collaboration",
      description: "Share reports and track code improvements with your team.",
      color: "cyan"
    }
  ];


  const {login} = useAuth();

  return (
    <div className="min-h-screen text-white overflow-hidden w-full">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-blue-500 rounded-full blur-[160px] opacity-20 animate-pulse"></div>
        <div className="absolute top-[20%] right-[5%] w-[300px] h-[300px] bg-purple-500 rounded-full blur-[140px] opacity-15 animate-pulse delay-1000"></div>
        <div className="absolute bottom-[15%] left-[20%] w-[350px] h-[350px] bg-pink-500 rounded-full blur-[150px] opacity-10 animate-pulse delay-2000"></div>
        <div className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] bg-cyan-500 rounded-full blur-[180px] opacity-15 animate-pulse delay-3000"></div>
      </div>

      <header className=" backdrop-blur-sm fixed top-0 z-50 w-full">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img src="/git.png" alt="" className="w-[40px]" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent hidden sm:block font-mono">
                  PReviewer <span className="text-xs 
                text-white 
                bg-white/15 
                p-2 py-1 rounded-full
                ">v1.5</span>
                </h1>
              </div>

            </div>


            <div className="flex items-center space-x-4">


              <Button
                onClick={login}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2"
              >
                <Github className="w-4 h-4" />
                <span>Connect GitHub</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="relative z-10 px-6 py-10 pt-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
              <Sparkles className="h-4 w-4 text-blue-400 mr-2" />
              <span className="text-sm text-blue-400">Powered by Advanced AI</span>
            </div>

            <h1 className="text-5xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
              Revolutionize Your
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Code Reviews
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Harness the power of AI to analyze your pull requests, identify issues, and get actionable insights
              that elevate your code quality to the next level.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/playground">
                <Button size="lg" className="">
                  Start Analyzing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 rounded-full text-lg font-semibold">
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </Button>
            </div>
          </div>

          {/* Demo Preview */}
          {/* <div className={`transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm max-w-4xl mx-auto">
              <CardContent className="p-8">
                <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-400">PReviwer Analysis Dashboard</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                      <div className="text-lg font-semibold text-green-400">9.2/10</div>
                      <div className="text-sm text-gray-300">Code Quality</div>
                    </div>
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
                      <Shield className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                      <div className="text-lg font-semibold text-blue-400">Secure</div>
                      <div className="text-sm text-gray-300">Security Score</div>
                    </div>
                    <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 text-center">
                      <TrendingUp className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <div className="text-lg font-semibold text-purple-400">+15%</div>
                      <div className="text-sm text-gray-300">Performance</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div> */}

          <div className={`transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} hover:scale-[1.02] transition-all duration-500 cursor-pointer`}>
            <Image
              src="/dashboard.png"
              alt="Demo Preview"
              width={800}
              height={450}
              className="rounded-lg shadow-lg mx-auto mt-12"
            />
          </div>

          {/* Scroll indicator */}
          <div className="mt-16 animate-bounce">
            <ChevronDown className="h-6 w-6 text-gray-400 mx-auto" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Everything you need to streamline your code review process and maintain high-quality code standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="relative bg-black/35 transition-all duration-500 transform rounded-lg hover:scale-[1.01] hover:shadow-xl group overflow-hidden cursor-pointer"
              >
                {/* Gradient overlay on hover */}
                <div
                  className={`
                  absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500
                  ${feature.color === "bg-blue-400" ? "bg-gradient-to-t from-blue-600/40 to-transparent" : ""}
                  ${feature.color === "yellow" ? "bg-gradient-to-t from-yellow-600/40 to-transparent" : ""}
                  ${feature.color === "green" ? "bg-gradient-to-t from-green-600/40 to-transparent" : ""}
                  ${feature.color === "purple" ? "bg-gradient-to-t from-purple-600/40 to-transparent" : ""}
                  ${feature.color === "pink" ? "bg-gradient-to-t from-pink-600/40 to-transparent" : ""}
                  ${feature.color === "cyan" ? "bg-gradient-to-t from-cyan-600/40 to-transparent" : ""}
                `}
                  style={{ zIndex: 1 }}
                />
                <CardContent className="relative p-8 z-10">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WorkflowSection />


      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-black/20 bg-black/35 backdrop-blur-sm rounded-t-4xl">
        <div className="max-w-7xl mx-auto">
          <Image

            src="/git.png"
            alt="PReviwer Logo"
            width={100}
            height={30}
            className="mx-auto mb-6"
          />

          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2">
              <h2 className="text-3xl font-bold text-white mb-2">Previwer</h2>
              <span className="bg-black/30 px-3 py-1 rounded-full text-sm">v1.5</span>
            </div>
            <p className="text-xl text-white mb-2 relative inline-block">
              <span className="bg-gradient-to-r from-yellow-300 via-orange-600 to-yellow-300 bg-clip-text text-transparent animate-shine">
                Analyze your github like never before with PReviwer
              </span>
              <style jsx>{`
                .animate-shine {
                  background-size: 200% 100%;
                  animation: shine 2s linear infinite;
                }
                @keyframes shine {
                  0% {
                    background-position: -100% 0;
                  }
                  100% {
                    background-position: 100% 0;
                  }
                }
              `}</style>
            </p>
          </div>
          <p className="text-gray-200 text-center mb-1">Follow us on social media for updates and discussions.</p>
          <div className="flex justify-center space-x-6 mb-8">
            <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 flex items-center">
              <Github className="h-5 w-5" />
              <p className="ml-2 hidden sm:block">GitHub</p>
            </Button>
            <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 flex items-center">
              <Twitter className="h-5 w-5" />
              <p className="ml-2 hidden sm:block">Twitter</p>
            </Button>
            <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 flex items-center">
              <Linkedin className="h-5 w-5" />
              <p className="ml-2 hidden sm:block">LinkedIn</p>
            </Button>
          </div>

        </div>
      </footer>
    </div>
  );
}
