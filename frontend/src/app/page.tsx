"use client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ArrowRight, BookOpen } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to Our
            <span className="text-primary block">Booking Platform</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with facilitators, book sessions, and grow your skills. 
            Whether you&apos;re a learner or a professional, we&apos;ve got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/register">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-6">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Easy Booking</CardTitle>
              <CardDescription>
                Book sessions with just a few clicks. Secure payments and instant confirmations.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center p-6">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Expert Facilitators</CardTitle>
              <CardDescription>
                Connect with qualified professionals and industry experts.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center p-6">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Flexible Learning</CardTitle>
              <CardDescription>
                Choose from various formats - workshops, sessions, and virtual events.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of learners and facilitators on our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/register">Create Account</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
