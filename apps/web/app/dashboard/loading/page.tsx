"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Brain, Database, Zap, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoadingPage() {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  const steps = [
    { name: "Uploading Dataset", icon: Database, description: "Validating and processing your data" },
    { name: "Preprocessing Data", icon: Zap, description: "Cleaning and preparing features" },
    { name: "Training Model", icon: Brain, description: "Building your machine learning model" },
    { name: "Validating Results", icon: CheckCircle, description: "Testing model performance" },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 3

        // Update current step based on progress
        if (newProgress > 25 && currentStep < 1) setCurrentStep(1)
        if (newProgress > 50 && currentStep < 2) setCurrentStep(2)
        if (newProgress > 75 && currentStep < 3) setCurrentStep(3)

        if (newProgress >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            router.push("/dashboard/models")
          }, 2000)
          return 100
        }

        return newProgress
      })
    }, 200)

    return () => clearInterval(interval)
  }, [currentStep, router])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-2">
        <SidebarTrigger />
        <h2 className="text-3xl font-bold tracking-tight">Training Model</h2>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Training in Progress</CardTitle>
            <CardDescription>Your model is being trained. This may take a few minutes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => {
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                const StepIcon = step.icon

                return (
                  <div
                    key={step.name}
                    className={`flex items-center space-x-4 p-4 rounded-lg border transition-all ${
                      isActive
                        ? "border-blue-500 bg-blue-50"
                        : isCompleted
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isActive
                          ? "bg-blue-600 text-white animate-pulse"
                          : isCompleted
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          isActive ? "text-blue-900" : isCompleted ? "text-green-900" : "text-gray-600"
                        }`}
                      >
                        {step.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Training Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Dataset Size</p>
                <p className="font-medium">10,000 rows</p>
              </div>
              <div>
                <p className="text-muted-foreground">Features</p>
                <p className="font-medium">15 columns</p>
              </div>
              <div>
                <p className="text-muted-foreground">Model Type</p>
                <p className="font-medium">Random Forest</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estimated Time</p>
                <p className="font-medium">3-5 minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
