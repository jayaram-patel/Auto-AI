"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Brain, Database, Upload, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";
import { RecentModels } from "@/components/dashboard/recent-models";
import { DashboardLoading } from "@/components/ui/loading";

export default function Dashboard() {
  const { data: stats, isLoading, error } = trpc.stats.useQuery();

  if (isLoading) return <DashboardLoading />;
  if (error) return <div>Error: {error.message}</div>;


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card key="active-models">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active ML Models
            </CardTitle>
            <Brain className={`h-4 w-4 text-blue-600`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalModels}</div>
            <p className="text-xs text-muted-foreground">Total Models</p>
          </CardContent>
        </Card>
        <Card key="uploaded-datasets">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Uploaded Datasets
            </CardTitle>
            <Database className={`h-4 w-4 text-green-600`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDatasets}</div>
            <p className="text-xs text-muted-foreground">Total Datasets</p>
          </CardContent>
        </Card>
        <Card key="total-predictions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Predictions
            </CardTitle>
            <Zap className={`h-4 w-4 text-purple-600`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.predictions}</div>
            <p className="text-xs text-muted-foreground">Total Predictions</p>
          </CardContent>
        </Card>
        <Card key="average-accuracy">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Accuracy
            </CardTitle>
            <TrendingUp className={`h-4 w-4 text-orange-600`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.avgAccuracy.toFixed(2) ?? 0)}%
            </div>
            <p className="text-xs text-muted-foreground">Average Accuracy</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Models</CardTitle>
            <CardDescription>
              Your latest machine learning models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentModels />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your ML workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/dashboard/upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Dataset
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/models">
                <Brain className="h-4 w-4 mr-2" />
                View Models
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/inference">
                <Zap className="h-4 w-4 mr-2" />
                Make Prediction
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
