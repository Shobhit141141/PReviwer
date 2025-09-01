"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "../ui/skeleton";

function PrSkeleton() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20">
        {/* Background Effects */}
        <div className="fixed pointer-events-none top-[10%] left-[5%] w-[400px] h-[400px] bg-purple-500 rounded-full blur-[160px] opacity-50"></div>
        <div className="fixed pointer-events-none top-[20%] right-[5%] w-[300px] h-[300px] bg-pink-500 rounded-full blur-[140px] opacity-35"></div>
        <div className="fixed pointer-events-none bottom-[15%] left-[20%] w-[350px] h-[350px] bg-blue-500 rounded-full blur-[150px] opacity-30"></div>

        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-gray-700 hover:bg-gray-800"
            >
              ← Back
            </Button>
            {/* <Loader className="w-5 h-5 animate-spin" />
            <span>Loading PR details...</span> */}
          </div>

          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-6">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

export default PrSkeleton;
