import { 
  User, 
  FileText, 
  MessageSquare, 
  TrendingUp 
} from "lucide-react";

export const howItWorks = [
  {
    icon: <User className="h-8 w-8 text-primary" />,
    title: "Sign Up & Profile",
    description: "Create your account and build your professional profile with your skills, experience, and career goals."
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: "AI Resume Builder",
    description: "Our AI analyzes your profile and creates a tailored resume optimized for your target roles and industries."
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: "Interview Preparation",
    description: "Practice with AI-powered mock interviews and get personalized feedback to improve your performance."
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-primary" />,
    title: "Career Growth",
    description: "Track your progress, get insights, and receive recommendations to advance your career journey."
  }
];