import Image from "next/image";
import { CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

type WorkflowStepProps = {
  step: number;
  title: string;
  image: string;
  badgeGradient: string;
  pulseColor: string;
  shadowColor: string;
  offsetY?: string;
  footerNote?: string;
  desc?: string;
  index?: number;
};

function WorkflowStep({
  step,
  title,
  image,
  badgeGradient,
  pulseColor,
  shadowColor,
  offsetY = "",
  footerNote,
  desc = "",
  index
}: WorkflowStepProps) {
  return (
    <motion.div className={`relative group ${offsetY}`}
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 , delay: 0.2 * (index || 0), ease: "easeInOut" }}
      viewport={{ once: false }}
    >
      {/* Step Number Badge */}
      <div
        className={`absolute -top-4 -left-4 w-12 h-12 ${badgeGradient} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg z-20`}
      >
        {step}
      </div>

      <div
        className={`bg-black/40 backdrop-blur-sm overflow-hidden transition-all duration-500 group-hover:shadow-2xl ${shadowColor} rounded-2xl `}
      >
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-6 pt-10 pb-2 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 ${pulseColor} rounded-full`}></div>
              <span className="text-white font-semibold">{title}</span>
            </div>
            {footerNote && <span className="text-xs text-gray-400">{footerNote}</span>}
          </div>

          {/* Description */}
          <div className="p-6 pt-0 text-gray-300">
            <p className="text-xs">
              {desc}
            </p>
          </div>

          {/* Image */}
          <div>
            <Image src={image} alt={title} width={500} height={300} className="rounded-t-2xl" />
          </div>
        </CardContent>
      </div>
    </motion.div>
  );
}


const steps = [
  {
    step: 1,
    title: "Get valuable insights",
    image: "/db1.png",
    badgeGradient: "bg-gradient-to-br from-red-500 to-red-600",
    pulseColor: "bg-red-500",
    shadowColor: "group-hover:shadow-red-500/20",
    offsetY: "",
    desc: "We analyze your codebase to give you insigihts that matter.",
  },
  {
    step: 2,
    title: "Play with your LLM",
    image: "/db2.png",
    badgeGradient: "bg-gradient-to-br from-yellow-500 to-orange-500",
    pulseColor: "bg-yellow-500",
    shadowColor: "group-hover:shadow-yellow-500/20",
    offsetY: "lg:mt-12",
    desc: "In the playground, you can fine-tune your LLM with custom user prompts and settings.",
  },
  {
    step: 3,
    title: "Analyze your PR",
    image: "/db3.png",
    badgeGradient: "bg-gradient-to-br from-green-500 to-emerald-500",
    pulseColor: "bg-green-500",
    shadowColor: "group-hover:shadow-green-500/20",
    offsetY: "lg:mt-24",
    desc: "You can analyze your pull requests with our AI-powered system, which will help you find issues and improve your code quality.",
  },
];

export default function WorkflowSection() {
  return (
    <section className="relative z-10 px-6 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            How PReviwer Works
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Our AI-powered system analyzes your code in three simple steps, delivering insights that matter.
          </p>
        </div>

        <div className="relative">
          {/* Connecting background SVG */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg className="w-full h-32" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M50 100 Q200 50 400 100 T750 100"
                stroke="url(#gradient)"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="animate-pulse"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#EC4899" stopOpacity="0.5" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((s, i) => (
              <WorkflowStep key={i} {...s} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
