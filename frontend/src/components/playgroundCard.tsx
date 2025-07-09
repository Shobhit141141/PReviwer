'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RocketIcon, ToolCaseIcon } from 'lucide-react';
import Link from 'next/link';

export default function PlaygroundCard() {
    return (
        <Link href="/playground" className="w-full">
            <Card className="w-full mx-auto shadow-xl border-muted/40 mb-4 bg-gradient-to-br from-pink-700/60 via-fuchsia-500/60 to-cyan-700/60">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            Playground is Live
                            <ToolCaseIcon className="w-6 h-6" />
                        </CardTitle>
                    </div>
                    <RocketIcon className="text-primary w-7 h-7" />
                </CardHeader>
                <CardContent className="space-y-3 text-white">
                    <p className=" text-sm">
                        Use the playground to test system prompts for PR reviews.
                    </p>
                    <p className="text-sm">
                        You can configure your model, set API keys, and view prompt responses side-by-side in a modal.
                    </p>
                    <Button variant="default" className="mt-2 w-full">
                        Open Playground
                    </Button>
                </CardContent>
            </Card>
        </Link>
    );
}
