"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/AppLayout";
import { 
  Search,
  TrendingUp,
  Target,
  Users,
  Lightbulb,
  Eye,
  Video,
  Image as ImageIcon,
  Download,
  RefreshCw,
  ChevronRight,
  Sparkles,
  BarChart3,
  Heart,
  Share2,
  MessageCircle,
  ExternalLink,
  TrendingDown,
  Minus,
  Brain
} from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";

// Dummy data for demonstration
const DUMMY_KEYWORDS = [
  { 
    id: 1, 
    keyword: "Fitness Supplements", 
    volume: 45000, 
    competition: "High",
    trend: "up",
    adsFound: 127 
  },
  { 
    id: 2, 
    keyword: "Protein Powder", 
    volume: 82000, 
    competition: "High",
    trend: "up",
    adsFound: 234 
  },
  { 
    id: 3, 
    keyword: "Pre-workout", 
    volume: 38000, 
    competition: "Medium",
    trend: "stable",
    adsFound: 89 
  },
  { 
    id: 4, 
    keyword: "Weight Loss", 
    volume: 165000, 
    competition: "Very High",
    trend: "down",
    adsFound: 456 
  },
  { 
    id: 5, 
    keyword: "Muscle Building", 
    volume: 24000, 
    competition: "Medium",
    trend: "up",
    adsFound: 67 
  },
];

const DUMMY_COMPETITOR_ADS = [
  {
    id: 1,
    brand: "ProFit Nutrition",
    adType: "video",
    thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
    title: "Transform Your Body in 90 Days",
    engagement: { likes: 12500, comments: 453, shares: 892 },
    performance: { spend: 8500, reach: 245000, ctr: 3.8, impressions: 890000 },
    audienceAvatars: [
      { name: "Gym Enthusiast Mike", age: "25-34", interests: ["Bodybuilding", "CrossFit", "Nutrition"], painPoints: "Wants faster muscle gains, struggles with plateau" },
      { name: "Health-conscious Sarah", age: "28-38", interests: ["Yoga", "Wellness", "Healthy Living"], painPoints: "Looking for natural supplements, skeptical of chemicals" }
    ],
    marketingAngles: [
      { angle: "Transformation Story", effectiveness: "High", description: "Real customer testimonials showing before/after" },
      { angle: "Scientific Backing", effectiveness: "Medium", description: "Clinical studies and expert endorsements" },
      { angle: "Time-based Promise", effectiveness: "High", description: "90-day guarantee creates urgency and trust" }
    ],
    psychologicalTriggers: ["Social Proof", "Scarcity", "Authority", "Transformation"],
    painPoints: ["Slow progress", "Confusion about nutrition", "Lack of energy"],
    tonality: "Motivational and Aspirational",
    hookHeadline: "Still not seeing results? Here's why...",
    cta: "Get 30% OFF Today Only"
  },
  {
    id: 2,
    brand: "MaxStrength Co",
    adType: "image",
    thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop",
    title: "The Protein Your Muscles Are Begging For",
    engagement: { likes: 8300, comments: 234, shares: 456 },
    performance: { spend: 5200, reach: 178000, ctr: 4.2, impressions: 520000 },
    audienceAvatars: [
      { name: "Professional Athlete Jake", age: "22-30", interests: ["Sports", "Athletic Performance", "Nutrition Science"], painPoints: "Needs optimal performance, wants clean ingredients" },
      { name: "Busy Professional Emma", age: "30-45", interests: ["Fitness", "Time Management", "Health"], painPoints: "Limited time to prepare meals, needs convenience" }
    ],
    marketingAngles: [
      { angle: "Quality Over Quantity", effectiveness: "High", description: "Premium ingredients, third-party tested" },
      { angle: "Problem-Solution", effectiveness: "High", description: "Identifies common protein powder issues and solves them" },
      { angle: "Lifestyle Integration", effectiveness: "Medium", description: "Shows how product fits into busy lifestyle" }
    ],
    psychologicalTriggers: ["Quality", "Trust", "Results", "Convenience"],
    painPoints: ["Low-quality ingredients", "Poor taste", "Digestive issues"],
    tonality: "Professional and Educational",
    hookHeadline: "Most protein powders are lying to you...",
    cta: "Try Risk-Free for 60 Days"
  },
  {
    id: 3,
    brand: "Lean Body Labs",
    adType: "video",
    thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop",
    title: "Burn Fat While You Sleep",
    engagement: { likes: 15700, comments: 678, shares: 1234 },
    performance: { spend: 12400, reach: 412000, ctr: 5.1, impressions: 1200000 },
    audienceAvatars: [
      { name: "Weight Loss Warrior Lisa", age: "35-50", interests: ["Weight Loss", "Health", "Self-Improvement"], painPoints: "Tried everything, frustrated with yo-yo dieting" },
      { name: "Dad Bod Dave", age: "40-55", interests: ["Fitness", "Family", "Sports"], painPoints: "Lost motivation, wants to feel young again" }
    ],
    marketingAngles: [
      { angle: "Effortless Solution", effectiveness: "Very High", description: "Works while you sleep - no extra effort needed" },
      { angle: "Science Breakthrough", effectiveness: "High", description: "New discovery in metabolism research" },
      { angle: "Relatable Struggle", effectiveness: "High", description: "Addresses common frustrations with dieting" }
    ],
    psychologicalTriggers: ["Desire", "Hope", "Innovation", "Ease"],
    painPoints: ["Slow metabolism", "Can't stick to diet", "No time for gym"],
    tonality: "Empathetic and Encouraging",
    hookHeadline: "What if I told you the gym is optional?",
    cta: "Start Your Transformation"
  },
  {
    id: 4,
    brand: "Alpha Nutrition",
    adType: "image",
    thumbnail: "https://images.unsplash.com/photo-1593476123561-2c4c71c04b37?w=400&h=300&fit=crop",
    title: "Fuel Like The Pros Do",
    engagement: { likes: 9400, comments: 312, shares: 567 },
    performance: { spend: 6800, reach: 201000, ctr: 3.9, impressions: 680000 },
    audienceAvatars: [
      { name: "Aspiring Bodybuilder Tom", age: "20-28", interests: ["Bodybuilding", "Competitive Sports", "Nutrition"], painPoints: "Wants to compete, needs professional-grade nutrition" },
      { name: "Fitness Influencer Nina", age: "23-32", interests: ["Social Media", "Fitness", "Brand Partnerships"], painPoints: "Needs results for content, wants quality products" }
    ],
    marketingAngles: [
      { angle: "Professional Grade", effectiveness: "High", description: "Used by professional athletes and trainers" },
      { angle: "Aspiration", effectiveness: "High", description: "Become like your fitness idols" },
      { angle: "Competitive Edge", effectiveness: "Medium", description: "Get ahead of the competition" }
    ],
    psychologicalTriggers: ["Aspiration", "Status", "Achievement", "Belonging"],
    painPoints: ["Amateur products don't work", "Want professional results", "Need competitive advantage"],
    tonality: "Bold and Confident",
    hookHeadline: "The secret weapon of champions...",
    cta: "Join The Elite"
  },
  {
    id: 5,
    brand: "Pure Energy Labs",
    adType: "video",
    thumbnail: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=300&fit=crop",
    title: "Natural Energy That Actually Works",
    engagement: { likes: 11200, comments: 445, shares: 723 },
    performance: { spend: 7900, reach: 287000, ctr: 4.5, impressions: 850000 },
    audienceAvatars: [
      { name: "Coffee-Dependent Carol", age: "28-42", interests: ["Productivity", "Health", "Natural Products"], painPoints: "Coffee crashes, wants sustainable energy" },
      { name: "Morning Workout Mark", age: "25-35", interests: ["Early Morning Workouts", "Performance", "Efficiency"], painPoints: "Needs energy before 5am workout, avoids stimulants" }
    ],
    marketingAngles: [
      { angle: "Natural Alternative", effectiveness: "High", description: "Better than coffee, no crash" },
      { angle: "Sustained Energy", effectiveness: "High", description: "All-day energy without jitters" },
      { angle: "Health-Conscious", effectiveness: "Medium", description: "Clean ingredients, no artificial additives" }
    ],
    psychologicalTriggers: ["Relief", "Natural", "Health", "Performance"],
    painPoints: ["Energy crashes", "Too much caffeine", "Artificial ingredients"],
    tonality: "Calm and Reassuring",
    hookHeadline: "Tired of the coffee rollercoaster?",
    cta: "Get Natural Energy"
  },
  {
    id: 6,
    brand: "Beast Mode Nutrition",
    adType: "video",
    thumbnail: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400&h=300&fit=crop",
    title: "Unleash Your Inner Beast",
    engagement: { likes: 18900, comments: 823, shares: 1456 },
    performance: { spend: 15200, reach: 534000, ctr: 5.8, impressions: 1450000 },
    audienceAvatars: [
      { name: "Hardcore Henry", age: "22-32", interests: ["Extreme Sports", "Powerlifting", "Intensity"], painPoints: "Wants maximum intensity, bored with regular workouts" },
      { name: "Comeback Chris", age: "30-45", interests: ["Transformation", "Motivation", "Achievement"], painPoints: "Lost fitness level, wants to reclaim former glory" }
    ],
    marketingAngles: [
      { angle: "Intensity and Power", effectiveness: "Very High", description: "For those who want extreme results" },
      { angle: "Identity and Belonging", effectiveness: "High", description: "Join the beast mode community" },
      { angle: "Challenge and Achievement", effectiveness: "High", description: "Prove what you're capable of" }
    ],
    psychologicalTriggers: ["Power", "Identity", "Challenge", "Belonging"],
    painPoints: ["Mediocre results", "Low intensity", "Need motivation"],
    tonality: "Aggressive and Empowering",
    hookHeadline: "Are you going beast mode or going home?",
    cta: "Unleash Your Potential"
  }
];

export default function ResearchPage() {
  const { selectedAccountId, accounts } = useAccount();
  const [selectedKeyword, setSelectedKeyword] = useState(DUMMY_KEYWORDS[0]);
  const [selectedAd, setSelectedAd] = useState<typeof DUMMY_COMPETITOR_ADS[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "video" | "image">("all");

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  const filteredAds = DUMMY_COMPETITOR_ADS.filter(ad => {
    const matchesSearch = ad.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || ad.adType === filterType;
    return matchesSearch && matchesFilter;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Search className="h-8 w-8 text-primary" />
              Competitor Research
            </h1>
            <p className="text-muted-foreground mt-1">
              Discover competitor ads, marketing angles, and audience insights for {selectedAccount?.account_name || "your brand"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Keywords/Products Section */}
        <Card className="shadow-card border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Target Keywords & Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {DUMMY_KEYWORDS.map((keyword) => (
                <button
                  key={keyword.id}
                  onClick={() => setSelectedKeyword(keyword)}
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-md text-left ${
                    selectedKeyword.id === keyword.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm text-foreground">{keyword.keyword}</h3>
                    {keyword.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {keyword.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {keyword.trend === "stable" && <Minus className="h-4 w-4 text-yellow-500" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Volume: <span className="font-medium text-foreground">{formatNumber(keyword.volume)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ads Found: <span className="font-medium text-primary">{keyword.adsFound}</span>
                    </p>
                    <Badge 
                      variant={keyword.competition === "Very High" ? "destructive" : keyword.competition === "High" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {keyword.competition}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search competitor ads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              onClick={() => setFilterType("all")}
              size="sm"
            >
              All Ads ({DUMMY_COMPETITOR_ADS.length})
            </Button>
            <Button
              variant={filterType === "video" ? "default" : "outline"}
              onClick={() => setFilterType("video")}
              size="sm"
              className="gap-2"
            >
              <Video className="h-4 w-4" />
              Video ({DUMMY_COMPETITOR_ADS.filter(a => a.adType === "video").length})
            </Button>
            <Button
              variant={filterType === "image" ? "default" : "outline"}
              onClick={() => setFilterType("image")}
              size="sm"
              className="gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Image ({DUMMY_COMPETITOR_ADS.filter(a => a.adType === "image").length})
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Competitor Ads List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Competitor Ads ({filteredAds.length})
            </h2>
            <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
              {filteredAds.map((ad) => (
                <Card
                  key={ad.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedAd?.id === ad.id ? "border-primary border-2" : "border-border"
                  }`}
                  onClick={() => setSelectedAd(ad)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden">
                        <img
                          src={ad.thumbnail}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1">
                          <Badge className="text-xs" variant={ad.adType === "video" ? "destructive" : "secondary"}>
                            {ad.adType === "video" ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">{ad.brand}</p>
                        <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-2">
                          {ad.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(ad.performance.reach)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {formatNumber(ad.engagement.likes)}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {ad.performance.ctr}% CTR
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right: Detailed Analysis */}
          <div className="lg:col-span-2">
            {selectedAd ? (
              <div className="space-y-6">
                {/* Ad Preview Card */}
                <Card className="shadow-card border">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="relative rounded-lg overflow-hidden aspect-video mb-4">
                          <img
                            src={selectedAd.thumbnail}
                            alt={selectedAd.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2">
                            <Badge variant="secondary">
                              {selectedAd.adType === "video" ? "VIDEO AD" : "IMAGE AD"}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full gap-2">
                          <ExternalLink className="h-4 w-4" />
                          View Original Ad
                        </Button>
                      </div>
                      <div>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-1">Brand</p>
                          <h2 className="text-2xl font-bold text-foreground">{selectedAd.brand}</h2>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-1">Ad Title</p>
                          <p className="text-lg font-medium text-foreground">{selectedAd.title}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Est. Spend</p>
                            <p className="text-lg font-bold text-foreground">{formatCurrency(selectedAd.performance.spend)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Reach</p>
                            <p className="text-lg font-bold text-primary">{formatNumber(selectedAd.performance.reach)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">CTR</p>
                            <p className="text-lg font-bold text-accent">{selectedAd.performance.ctr}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Impressions</p>
                            <p className="text-lg font-bold text-foreground">{formatNumber(selectedAd.performance.impressions)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs for Detailed Analysis */}
                <Tabs defaultValue="avatars" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="avatars" className="gap-2">
                      <Users className="h-4 w-4" />
                      Audience
                    </TabsTrigger>
                    <TabsTrigger value="angles" className="gap-2">
                      <Target className="h-4 w-4" />
                      Angles
                    </TabsTrigger>
                    <TabsTrigger value="psychology" className="gap-2">
                      <Brain className="h-4 w-4" />
                      Psychology
                    </TabsTrigger>
                    <TabsTrigger value="creative" className="gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Creative
                    </TabsTrigger>
                  </TabsList>

                  {/* Audience Avatars Tab */}
                  <TabsContent value="avatars" className="space-y-4 mt-4">
                    <Card className="shadow-card border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          Target Audience Avatars
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedAd.audienceAvatars.map((avatar, index) => (
                          <Card key={index} className="border-2 border-primary/20">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                                  {avatar.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-foreground mb-1">{avatar.name}</h3>
                                  <p className="text-sm text-muted-foreground mb-3">Age: {avatar.age}</p>
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Interests</p>
                                      <div className="flex flex-wrap gap-2">
                                        {avatar.interests.map((interest, i) => (
                                          <Badge key={i} variant="secondary">{interest}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Pain Points</p>
                                      <p className="text-sm text-foreground">{avatar.painPoints}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Marketing Angles Tab */}
                  <TabsContent value="angles" className="space-y-4 mt-4">
                    <Card className="shadow-card border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-primary" />
                          Marketing Angles & Strategies
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedAd.marketingAngles.map((angle, index) => (
                          <Card key={index} className="border-2 border-accent/20">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-semibold text-foreground">{angle.angle}</h3>
                                <Badge 
                                  variant={
                                    angle.effectiveness === "Very High" ? "default" :
                                    angle.effectiveness === "High" ? "secondary" :
                                    "outline"
                                  }
                                >
                                  {angle.effectiveness} Effectiveness
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{angle.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                        <Card className="border-2 border-primary/20 bg-primary/5">
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              Hook Headline
                            </h4>
                            <p className="text-lg font-medium text-foreground mb-3">&quot;{selectedAd.hookHeadline}&quot;</p>
                            <h4 className="font-semibold text-sm text-foreground mb-2">Call-to-Action</h4>
                            <Badge variant="default" className="text-sm">{selectedAd.cta}</Badge>
                          </CardContent>
                        </Card>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Psychology Tab */}
                  <TabsContent value="psychology" className="space-y-4 mt-4">
                    <Card className="shadow-card border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-primary" />
                          Psychological Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                            Psychological Triggers
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            {selectedAd.psychologicalTriggers.map((trigger, index) => (
                              <Card key={index} className="border-2 border-purple-200 dark:border-purple-800">
                                <CardContent className="p-3 text-center">
                                  <p className="font-medium text-foreground">{trigger}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                            Pain Points Addressed
                          </h3>
                          <div className="space-y-2">
                            {selectedAd.painPoints.map((point, index) => (
                              <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                                <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                                <p className="text-sm text-foreground">{point}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                            Tonality
                          </h3>
                          <Card className="border-2 border-accent/30 bg-accent/5">
                            <CardContent className="p-4">
                              <p className="text-lg font-medium text-foreground">{selectedAd.tonality}</p>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Creative Analysis Tab */}
                  <TabsContent value="creative" className="space-y-4 mt-4">
                    <Card className="shadow-card border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-primary" />
                          Creative Elements Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                              Engagement Metrics
                            </h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                                <div className="flex items-center gap-2">
                                  <Heart className="h-4 w-4 text-red-500" />
                                  <span className="text-sm text-foreground">Likes</span>
                                </div>
                                <span className="font-bold text-foreground">{formatNumber(selectedAd.engagement.likes)}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                                <div className="flex items-center gap-2">
                                  <MessageCircle className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm text-foreground">Comments</span>
                                </div>
                                <span className="font-bold text-foreground">{formatNumber(selectedAd.engagement.comments)}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                                <div className="flex items-center gap-2">
                                  <Share2 className="h-4 w-4 text-green-500" />
                                  <span className="text-sm text-foreground">Shares</span>
                                </div>
                                <span className="font-bold text-foreground">{formatNumber(selectedAd.engagement.shares)}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                              Performance Metrics
                            </h3>
                            <div className="space-y-3">
                              <div className="p-3 rounded-lg bg-primary/10 border-2 border-primary/20">
                                <p className="text-xs text-muted-foreground mb-1">Click-Through Rate</p>
                                <p className="text-2xl font-bold text-primary">{selectedAd.performance.ctr}%</p>
                              </div>
                              <div className="p-3 rounded-lg bg-accent/10 border-2 border-accent/20">
                                <p className="text-xs text-muted-foreground mb-1">Total Reach</p>
                                <p className="text-2xl font-bold text-accent">{formatNumber(selectedAd.performance.reach)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20">
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            AI Insights
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            This ad performs exceptionally well due to its strong hook, relatable pain points, and clear call-to-action. 
                            The {selectedAd.tonality.toLowerCase()} tone resonates with the target audience, while the use of 
                            {selectedAd.psychologicalTriggers.slice(0, 2).join(" and ").toLowerCase()} triggers creates urgency and trust.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card className="shadow-card border h-full">
                <CardContent className="flex items-center justify-center h-[600px]">
                  <div className="text-center">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Select an ad to view detailed analysis
                    </h3>
                    <p className="text-muted-foreground">
                      Click on any competitor ad from the list to see audience avatars, marketing angles, and insights
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

