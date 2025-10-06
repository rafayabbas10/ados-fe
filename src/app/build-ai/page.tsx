"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLayout } from "@/components/AppLayout";
import { useAccount } from "@/contexts/AccountContext";
import { 
  Sparkles, 
  Play, 
  BarChart3,
  ChevronDown,
  ChevronRight,
  Video,
  Eye,
  Clock,
  Target,
  Lightbulb,
  Layers,
  Wand2,
  RefreshCw
} from "lucide-react";

// Types for the Build with AI Generator
interface SourceAd {
  id: string;
  name: string;
  video_url: string;
  thumbnail: string;
  ad_type?: string;
  performance: {
    views: number;
    roas: number;
    spend: number;
  };
}

interface GeneratedIdeaSource {
  concept: string;
  target_audience: string;
  pain_point: string;
  solution_angle: string;
  emotional_trigger: string;
}

interface GeneratedElement {
  type: 'hook' | 'visual' | 'cta' | 'text' | 'audio';
  content: string;
  rationale: string;
  psychological_trigger: string;
  estimated_performance: number;
}

interface GeneratedBlock {
  scene_number: number;
  timestamp: string;
  duration: number;
  scene_type: 'hook' | 'problem' | 'solution' | 'proof' | 'cta';
  description: string;
  visual_elements: string[];
  script: string;
  purpose: string;
}

interface GeneratedVersion {
  version: string;
  idea_source: GeneratedIdeaSource;
  elements: GeneratedElement[];
  blocks: GeneratedBlock[];
  overall_strategy: string;
  estimated_performance: {
    engagement_score: number;
    conversion_potential: number;
    virality_factor: number;
  };
}

export default function BuildWithAI() {
  const { selectedAccountId } = useAccount();
  const [selectedSourceAd, setSelectedSourceAd] = useState<string>("");
  const [activeVersion, setActiveVersion] = useState("v1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVersions, setGeneratedVersions] = useState<Record<string, GeneratedVersion>>({});
  const [expandedSections, setExpandedSections] = useState({
    ideaSource: true,
    elements: true,
    blocks: true
  });

  // Available source ads for inspiration
  const [availableSourceAds] = useState<SourceAd[]>([
    {
      id: "1",
      name: "Summer Sale Campaign - Video Ad",
      video_url: "https://example.com/video1.mp4",
      thumbnail: "https://via.placeholder.com/300x200",
      performance: {
        views: 125000,
        roas: 4.2,
        spend: 2500
      }
    },
    {
      id: "2", 
      name: "Product Demo - Mobile First",
      video_url: "https://example.com/video2.mp4",
      thumbnail: "https://via.placeholder.com/300x200",
      performance: {
        views: 89000,
        roas: 3.8,
        spend: 1800
      }
    },
    {
      id: "3",
      name: "Brand Awareness - Lifestyle",
      video_url: "https://example.com/video3.mp4", 
      thumbnail: "https://via.placeholder.com/300x200",
      performance: {
        views: 67000,
        roas: 3.2,
        spend: 1200
      }
    }
  ]);

  // Mock generated versions - replace with actual AI generation
  const mockGeneratedVersions: Record<string, GeneratedVersion> = {
    v1: {
      version: "V1 - Problem-Solution Focus",
      idea_source: {
        concept: "Pain Point Amplification",
        target_audience: "Busy professionals aged 25-40",
        pain_point: "Lack of time for self-care and wellness",
        solution_angle: "Quick, effective solutions that fit into busy schedules",
        emotional_trigger: "Fear of missing out on health and happiness"
      },
      elements: [
        {
          type: 'hook',
          content: "Still using outdated methods that waste your precious time?",
          rationale: "Creates immediate relevance and urgency",
          psychological_trigger: "Loss aversion and time scarcity",
          estimated_performance: 87
        },
        {
          type: 'visual',
          content: "Split-screen: Chaotic morning vs. Organized, calm morning",
          rationale: "Visual contrast shows transformation clearly",
          psychological_trigger: "Aspiration and social comparison",
          estimated_performance: 82
        },
        {
          type: 'cta',
          content: "Transform Your Mornings in 7 Days",
          rationale: "Specific timeframe creates urgency and believability",
          psychological_trigger: "Instant gratification and achievement",
          estimated_performance: 79
        }
      ],
      blocks: [
        {
          scene_number: 1,
          timestamp: "0:00-0:03",
          duration: 3,
          scene_type: 'hook',
          description: "Pattern interrupt with relatable struggle",
          visual_elements: ["Close-up of frustrated face", "Messy background", "Clock showing early time"],
          script: "Another morning feeling overwhelmed before you even start?",
          purpose: "Immediately grab attention with universal pain point"
        },
        {
          scene_number: 2,
          timestamp: "0:03-0:08",
          duration: 5,
          scene_type: 'problem',
          description: "Amplify the problem with consequences",
          visual_elements: ["Montage of chaotic scenes", "Stress indicators", "Time pressure visuals"],
          script: "You're not alone. 73% of professionals start their day stressed, affecting their entire performance.",
          purpose: "Build emotional connection and validate the problem"
        },
        {
          scene_number: 3,
          timestamp: "0:08-0:15",
          duration: 7,
          scene_type: 'solution',
          description: "Introduce the solution with transformation",
          visual_elements: ["Smooth transition", "Organized environment", "Calm, confident person"],
          script: "But what if I told you there's a simple system that transforms your mornings in just 7 days?",
          purpose: "Present hope and specific solution"
        },
        {
          scene_number: 4,
          timestamp: "0:15-0:20",
          duration: 5,
          scene_type: 'proof',
          description: "Social proof and results",
          visual_elements: ["Testimonial clips", "Before/after shots", "Statistics overlay"],
          script: "Over 10,000 people have already transformed their lives. Here's what they're saying...",
          purpose: "Build credibility and trust"
        },
        {
          scene_number: 5,
          timestamp: "0:20-0:25",
          duration: 5,
          scene_type: 'cta',
          description: "Clear call to action with urgency",
          visual_elements: ["Product/service showcase", "Limited time indicator", "Easy action steps"],
          script: "Ready to join them? Click below to start your 7-day transformation today.",
          purpose: "Drive immediate action"
        }
      ],
      overall_strategy: "Focus on immediate pain point recognition followed by clear transformation promise with social proof",
      estimated_performance: {
        engagement_score: 85,
        conversion_potential: 78,
        virality_factor: 72
      }
    },
    v2: {
      version: "V2 - Curiosity-Driven Approach",
      idea_source: {
        concept: "Secret Knowledge Revelation",
        target_audience: "Achievement-oriented individuals 30-50",
        pain_point: "Feeling stuck despite trying everything",
        solution_angle: "Insider knowledge that others don't have",
        emotional_trigger: "Curiosity and exclusivity"
      },
      elements: [
        {
          type: 'hook',
          content: "The one thing successful people do differently (and why no one talks about it)",
          rationale: "Creates curiosity gap and positions viewer as insider",
          psychological_trigger: "Curiosity and social proof",
          estimated_performance: 91
        },
        {
          type: 'visual',
          content: "Mysterious figure revealing hidden information",
          rationale: "Visual metaphor for exclusive knowledge",
          psychological_trigger: "Exclusivity and mystery",
          estimated_performance: 86
        },
        {
          type: 'cta',
          content: "Discover the Secret (Limited Access)",
          rationale: "Maintains mystery while creating scarcity",
          psychological_trigger: "FOMO and exclusivity",
          estimated_performance: 83
        }
      ],
      blocks: [
        {
          scene_number: 1,
          timestamp: "0:00-0:04",
          duration: 4,
          scene_type: 'hook',
          description: "Intriguing question that creates curiosity gap",
          visual_elements: ["Silhouette of successful person", "Question mark overlay", "Mysterious lighting"],
          script: "What if I told you the most successful people have one secret habit that changes everything?",
          purpose: "Create immediate curiosity and engagement"
        },
        {
          scene_number: 2,
          timestamp: "0:04-0:10",
          duration: 6,
          scene_type: 'problem',
          description: "Reveal why most people fail",
          visual_elements: ["Common failure scenarios", "Frustrated people", "Crossed-out methods"],
          script: "Most people try the obvious strategies everyone talks about. But here's why they don't work...",
          purpose: "Position common knowledge as insufficient"
        },
        {
          scene_number: 3,
          timestamp: "0:10-0:18",
          duration: 8,
          scene_type: 'solution',
          description: "Reveal the secret method",
          visual_elements: ["Lightbulb moment", "Behind-the-scenes footage", "Success transformation"],
          script: "The secret? It's not what you do, it's when and how you do it. Let me show you...",
          purpose: "Deliver on the curiosity promise"
        },
        {
          scene_number: 4,
          timestamp: "0:18-0:23",
          duration: 5,
          scene_type: 'proof',
          description: "Evidence and case studies",
          visual_elements: ["Success stories", "Data visualization", "Expert endorsements"],
          script: "This method has been tested by thousands, with a 94% success rate. Here's the proof...",
          purpose: "Validate the secret with concrete evidence"
        },
        {
          scene_number: 5,
          timestamp: "0:23-0:28",
          duration: 5,
          scene_type: 'cta',
          description: "Exclusive access offer",
          visual_elements: ["VIP access visual", "Limited spots counter", "Exclusive badge"],
          script: "Ready to join the inner circle? Limited spots available. Click now to secure your access.",
          purpose: "Maintain exclusivity while driving action"
        }
      ],
      overall_strategy: "Build curiosity through secret knowledge positioning, then deliver exclusive solution with proof",
      estimated_performance: {
        engagement_score: 92,
        conversion_potential: 85,
        virality_factor: 88
      }
    }
  };

  // Generate AI versions function
  const generateVersions = async () => {
    if (!selectedSourceAd) {
      alert('Please select a source ad first');
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For now, use mock data - replace with actual AI API calls
    setGeneratedVersions(mockGeneratedVersions);
    setIsGenerating(false);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSceneTypeColor = (type: string) => {
    const colors = {
      hook: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      problem: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      solution: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      proof: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      cta: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (!selectedAccountId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Select an Account</h3>
            <p className="text-muted-foreground">
              Please select an ad account from the sidebar to start building with AI
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Build with AI</h1>
              <p className="text-muted-foreground text-lg">
                Generate new creative ideas with AI-powered inspiration
              </p>
            </div>
          </div>
        </div>

        {/* Generator Controls */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Creative Generator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Select Source Ad for Inspiration
                </label>
                <Select value={selectedSourceAd} onValueChange={setSelectedSourceAd}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an ad to inspire new ideas..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSourceAds.map((ad) => (
                      <SelectItem key={ad.id} value={ad.id}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded flex items-center justify-center">
                            <Play className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{ad.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(ad.performance.views / 1000).toFixed(0)}K views • {ad.performance.roas.toFixed(1)}x ROAS
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={generateVersions}
                disabled={!selectedSourceAd || isGenerating}
                className="bg-gradient-primary hover:opacity-90 transition-opacity gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Ideas
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated Versions Tabs */}
        {Object.keys(generatedVersions).length > 0 && (
          <Tabs value={activeVersion} onValueChange={setActiveVersion}>
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="v1">Version 1</TabsTrigger>
              <TabsTrigger value="v2">Version 2</TabsTrigger>
              <TabsTrigger value="v3">Version 3</TabsTrigger>
              <TabsTrigger value="v4">Version 4</TabsTrigger>
              <TabsTrigger value="v5">Version 5</TabsTrigger>
            </TabsList>
            
            {Object.entries(generatedVersions).map(([version, versionData]) => (
              <TabsContent key={version} value={version}>
                <div className="space-y-6">
                  {/* Version Header */}
                  <Card className="shadow-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{versionData.version}</CardTitle>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Engagement</p>
                            <p className={`font-bold ${getPerformanceColor(versionData.estimated_performance.engagement_score)}`}>
                              {versionData.estimated_performance.engagement_score}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Conversion</p>
                            <p className={`font-bold ${getPerformanceColor(versionData.estimated_performance.conversion_potential)}`}>
                              {versionData.estimated_performance.conversion_potential}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Virality</p>
                            <p className={`font-bold ${getPerformanceColor(versionData.estimated_performance.virality_factor)}`}>
                              {versionData.estimated_performance.virality_factor}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground">{versionData.overall_strategy}</p>
                    </CardHeader>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Idea Source */}
                    <Card className="shadow-card">
                      <CardHeader 
                        className="cursor-pointer"
                        onClick={() => toggleSection('ideaSource')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <CardTitle className="text-lg">Idea Source</CardTitle>
                          </div>
                          {expandedSections.ideaSource ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                      
                      {expandedSections.ideaSource && (
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Concept</p>
                              <p className="text-sm">{versionData.idea_source.concept}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Target Audience</p>
                              <p className="text-sm">{versionData.idea_source.target_audience}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Pain Point</p>
                              <p className="text-sm">{versionData.idea_source.pain_point}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Solution Angle</p>
                              <p className="text-sm">{versionData.idea_source.solution_angle}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Emotional Trigger</p>
                              <p className="text-sm">{versionData.idea_source.emotional_trigger}</p>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Elements */}
                    <Card className="shadow-card">
                      <CardHeader 
                        className="cursor-pointer"
                        onClick={() => toggleSection('elements')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                              <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <CardTitle className="text-lg">Elements</CardTitle>
                          </div>
                          {expandedSections.elements ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                      
                      {expandedSections.elements && (
                        <CardContent className="space-y-4">
                          {versionData.elements.map((element, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="capitalize">
                                  {element.type}
                                </Badge>
                                <span className={`text-sm font-medium ${getPerformanceColor(element.estimated_performance)}`}>
                                  {element.estimated_performance}%
                                </span>
                              </div>
                              <p className="text-sm font-medium mb-1">{element.content}</p>
                              <p className="text-xs text-muted-foreground mb-2">{element.rationale}</p>
                              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                                <p className="text-xs">
                                  <span className="font-medium">Trigger:</span> {element.psychological_trigger}
                                </p>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      )}
                    </Card>

                    {/* Blocks */}
                    <Card className="shadow-card">
                      <CardHeader 
                        className="cursor-pointer"
                        onClick={() => toggleSection('blocks')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                              <Video className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <CardTitle className="text-lg">Blocks</CardTitle>
                          </div>
                          {expandedSections.blocks ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                      
                      {expandedSections.blocks && (
                        <CardContent className="space-y-4">
                          {versionData.blocks.map((block, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge className={getSceneTypeColor(block.scene_type)}>
                                    Scene {block.scene_number}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{block.timestamp}</span>
                                </div>
                                <span className="text-xs text-muted-foreground capitalize">
                                  {block.scene_type}
                                </span>
                              </div>
                              
                              <h4 className="text-sm font-medium mb-1">{block.description}</h4>
                              <p className="text-xs text-muted-foreground mb-2">{block.purpose}</p>
                              
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Script:</p>
                                  <p className="text-xs p-2 bg-muted rounded">{block.script}</p>
                                </div>
                                
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Visual Elements:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {block.visual_elements.map((element, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {element}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      )}
                    </Card>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Empty State */}
        {Object.keys(generatedVersions).length === 0 && (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Generate Creative Ideas?</h3>
              <p className="text-muted-foreground mb-6">
                Select a source ad for inspiration and click "Generate Ideas" to create 5 unique creative variations
              </p>
              <div className="text-sm text-muted-foreground">
                Each version will include:
                <div className="flex items-center justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    <span>Idea Source</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <span>Creative Elements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    <span>Video Blocks</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
