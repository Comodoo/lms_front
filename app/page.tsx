'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  Users,
  BookOpen,
  Award,
  Briefcase,
  Globe,
  Smartphone,
  Wifi,
  WifiOff,
  Bot,
  TrendingUp,
  Star,
  ArrowRight,
  Menu,
  X,
  ChevronRight,
  Zap,
  Shield,
  CreditCard,
  Building2,
  MapPin,
} from 'lucide-react';

const stats = [
  { value: '50,000+', label: 'Active Learners' },
  { value: '500+', label: 'Expert Courses' },
  { value: '95%', label: 'Completion Rate' },
  { value: '12', label: 'African Countries' },
];

const features = [
  {
    icon: BookOpen,
    title: 'Expert-Led Courses',
    description: 'Learn from industry professionals with real-world experience across Africa.',
  },
  {
    icon: Award,
    title: 'Verified Certificates',
    description: 'Earn blockchain-verified certificates recognized by top employers.',
  },
  {
    icon: Briefcase,
    title: 'Career Pipeline',
    description: 'Direct pathways to jobs and internships with partner companies.',
  },
  {
    icon: Users,
    title: 'Cohort Learning',
    description: 'Join live classes with peers and get mentorship from instructors.',
  },
  {
    icon: Bot,
    title: 'AI Learning Assistant',
    description: 'Get instant help, quiz generation, and personalized study plans.',
  },
  {
    icon: WifiOff,
    title: 'Offline Learning',
    description: 'Download courses and learn anywhere, even without internet.',
  },
];

const paymentMethods = [
  { name: 'M-Pesa', countries: 'Kenya, Tanzania' },
  { name: 'MTN MoMo', countries: 'Ghana, Uganda, Rwanda' },
  { name: 'Airtel Money', countries: 'Multiple countries' },
  { name: 'Cards', countries: 'Visa, Mastercard' },
];

const testimonials = [
  {
    name: 'Amina Okonkwo',
    role: 'Software Developer',
    company: 'Andela',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amina',
    content: 'AfriLearn helped me transition from accounting to tech. The Python course was practical and the career support landed me my dream job.',
    rating: 5,
  },
  {
    name: 'Kwame Asante',
    role: 'Data Analyst',
    company: 'Safaricom',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kwame',
    content: 'The cohort-based learning kept me accountable. I completed the Data Science track in 3 months and got promoted at work.',
    rating: 5,
  },
  {
    name: 'Fatima Hassan',
    role: 'UX Designer',
    company: 'Flutterwave',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
    content: 'Being able to pay with M-Pesa made education accessible. The offline mode was a lifesaver when studying in rural areas.',
    rating: 5,
  },
];

const courses = [
  {
    title: 'Python for Data Science',
    instructor: 'Dr. Amara Nwosu',
    students: 12500,
    rating: 4.9,
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=250&fit=crop',
    category: 'Technology',
  },
  {
    title: 'Digital Marketing Mastery',
    instructor: 'James Mwangi',
    students: 8900,
    rating: 4.8,
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
    category: 'Marketing',
  },
  {
    title: 'Business Finance Fundamentals',
    instructor: 'Sarah Kimani',
    students: 6700,
    rating: 4.7,
    price: 44.99,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
    category: 'Finance',
  },
];

const partners = [
  'Safaricom', 'Andela', 'Flutterwave', 'Interswitch', 'Jumia', 'MTN',
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-background">
      {/* Announcement Banner */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm">
        <span className="font-medium">New: Career Track Program</span>
        <span className="mx-2">-</span>
        <span>Get job-ready with guaranteed internship placement.</span>
        <Link href="/careers" className="ml-2 underline underline-offset-2 font-medium">
          Learn more
        </Link>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">AfriLearn</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Courses
            </Link>
            <Link href="/cohorts" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Cohorts
            </Link>
            <Link href="/careers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Careers
            </Link>
            <Link href="/enterprise" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Enterprise
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background p-4">
            <div className="flex flex-col gap-4">
              <Link href="/courses" className="text-sm font-medium py-2">Courses</Link>
              <Link href="/cohorts" className="text-sm font-medium py-2">Cohorts</Link>
              <Link href="/careers" className="text-sm font-medium py-2">Careers</Link>
              <Link href="/enterprise" className="text-sm font-medium py-2">Enterprise</Link>
              <Link href="/pricing" className="text-sm font-medium py-2">Pricing</Link>
              <hr />
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/signup">Get Started Free</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-6">
                <Zap className="h-3 w-3 mr-1" />
                Trusted by 50,000+ African learners
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-6">
                Learn Skills That
                <span className="text-primary block">Transform Careers</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 text-pretty">
                Africa's premier learning platform. Expert-led courses, verified certificates, 
                and direct pathways to employment. Pay with M-Pesa, learn offline.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" asChild className="text-base">
                  <Link href="/signup">
                    Start Learning Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base">
                  <Link href="/demo">
                    <Play className="mr-2 h-4 w-4" />
                    Watch Demo
                  </Link>
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Hero Image/Card */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border">
                <div className="absolute -top-4 -right-4 bg-background rounded-lg shadow-lg p-3 border">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Completion Rate</p>
                      <p className="text-sm font-bold">95%</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-background rounded-lg p-4 border">
                    <img
                      src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=80&h=80&fit=crop"
                      alt="Course"
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Python for Data Science</p>
                      <p className="text-sm text-muted-foreground">12,500 students enrolled</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">4.9</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-background rounded-lg p-4 border">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Certificate Earned!</p>
                      <p className="text-sm text-muted-foreground">Verified on blockchain</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-background rounded-lg p-4 border">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                      <Briefcase className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Job Offer Received</p>
                      <p className="text-sm text-muted-foreground">From Safaricom Kenya</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-background rounded-lg shadow-lg p-3 border">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Countries</p>
                      <p className="text-sm font-bold">12 African Nations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Logos */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Our graduates work at leading African companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {partners.map((partner) => (
              <div key={partner} className="text-xl font-bold text-muted-foreground/50">
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From learning to employment, we provide the complete journey for African professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
              <Badge variant="outline" className="mb-4">Popular Courses</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                Start Your Learning Journey
              </h2>
            </div>
            <Button variant="outline" asChild>
              <Link href="/courses">
                View All Courses
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.title} className="overflow-hidden hover:shadow-lg transition-shadow">
                <img
                  src={course.image}
                  alt={course.title}
                  className="h-48 w-full object-cover"
                />
                <CardContent className="p-6">
                  <Badge variant="secondary" className="mb-3">{course.category}</Badge>
                  <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{course.instructor}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{course.rating}</span>
                      <span className="text-sm text-muted-foreground">({course.students.toLocaleString('en-US')})</span>
                    </div>
                    <p className="font-bold">${course.price}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4">Africa-First</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pay Your Way
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We support the payment methods you use every day. M-Pesa, MTN MoMo, 
                Airtel Money, and more. No international card required.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <div key={method.name} className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-xs text-muted-foreground">{method.countries}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 border">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-2xl font-bold">TSH 4,999</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-background rounded-lg border-2 border-green-500">
                    <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">M-Pesa</p>
                      <p className="text-sm text-muted-foreground">+254 7XX XXX XXX</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
                  </div>
                  <Button className="w-full" size="lg">
                    Pay with M-Pesa
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Success Stories</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Hear From Our Graduates
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of African professionals who transformed their careers with AfriLearn.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">{testimonial.content}</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-primary-foreground">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <Badge variant="secondary" className="mb-4 bg-primary-foreground/20 text-primary-foreground">
                  Enterprise
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Train Your Workforce
                </h2>
                <p className="text-lg text-primary-foreground/80 mb-8">
                  Custom learning paths, team analytics, and dedicated support for organizations. 
                  Upskill your entire team with AfriLearn for Business.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="secondary" size="lg" asChild>
                    <Link href="/enterprise">
                      <Building2 className="mr-2 h-4 w-4" />
                      Learn More
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                    <Link href="/enterprise/demo">Request Demo</Link>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary-foreground/10 rounded-lg p-6">
                  <Users className="h-8 w-8 mb-3" />
                  <p className="text-2xl font-bold">500+</p>
                  <p className="text-sm text-primary-foreground/70">Companies</p>
                </div>
                <div className="bg-primary-foreground/10 rounded-lg p-6">
                  <Award className="h-8 w-8 mb-3" />
                  <p className="text-2xl font-bold">50,000+</p>
                  <p className="text-sm text-primary-foreground/70">Trained</p>
                </div>
                <div className="bg-primary-foreground/10 rounded-lg p-6">
                  <Shield className="h-8 w-8 mb-3" />
                  <p className="text-2xl font-bold">SOC2</p>
                  <p className="text-sm text-primary-foreground/70">Compliant</p>
                </div>
                <div className="bg-primary-foreground/10 rounded-lg p-6">
                  <Globe className="h-8 w-8 mb-3" />
                  <p className="text-2xl font-bold">24/7</p>
                  <p className="text-sm text-primary-foreground/70">Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Career?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join 50,000+ African learners already building their future with AfriLearn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
            />
            <Button size="lg" asChild>
              <Link href={`/signup?email=${email}`}>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Free forever for basic features. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">AfriLearn</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4">
                Empowering Africa's future through accessible, quality education.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Nairobi, Kenya</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/courses" className="hover:text-foreground">Courses</Link></li>
                <li><Link href="/cohorts" className="hover:text-foreground">Cohorts</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="/enterprise" className="hover:text-foreground">Enterprise</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/community" className="hover:text-foreground">Community</Link></li>
                <li><Link href="/instructors" className="hover:text-foreground">Become Instructor</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="/careers/jobs" className="hover:text-foreground">We're Hiring</Link></li>
                <li><Link href="/press" className="hover:text-foreground">Press</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="/cookies" className="hover:text-foreground">Cookies</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              2024 AfriLearn. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Available in 12 countries
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

