import Hero from "@/components/home/hero";
import Features from "@/components/home/features";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-12 text-center text-white space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold">
                Ready to Book Your Turf?
              </h2>
              <p className="text-lg md:text-xl opacity-90">
                Join thousands of players who trust TurfBook AI for their sports
                booking needs
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/book">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-8"
                  >
                    Start Booking
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/10"
                  >
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
