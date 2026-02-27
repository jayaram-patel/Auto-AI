"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Brain, Calendar, TrendingUp, Play, Trash2, Download, Zap, Loader2 } from "lucide-react"
import Link from "next/link"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

export default function ModelsPage() {
  const router = useRouter()
  const [selectedModelForInference, setSelectedModelForInference] = useState<any>(null)
  const [inputData, setInputData] = useState<Record<string, any>>({})
  const [predictionResult, setPredictionResult] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { toast } = useToast()
  const { data: models = [], isLoading, refetch } = trpc.models.useQuery()
  
  const inferenceMutation = trpc.inference.useMutation({
    onSuccess: (result) => {
      setPredictionResult(result.output)
      toast({
        title: "Prediction Complete",
        description: "Your model has successfully made a prediction.",
      })
    },
    onError: (error) => {
      toast({
        title: "Prediction Failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleInputChange = (key: string, value: any) => {
    setInputData(prev => ({ ...prev, [key]: value }))
  }

  const handleInference = () => {
    if (!selectedModelForInference || Object.keys(inputData).length === 0) {
      toast({
        title: "Missing Data",
        description: "Please provide all input values.",
        variant: "destructive",
      })
      return
    }

    inferenceMutation.mutate({
      modelId: selectedModelForInference.id,
      input: inputData,
    })
  }

  const openInferenceDialog = (model: any) => {
    setSelectedModelForInference(model)
    setInputData({})
    setPredictionResult(null)
    setIsDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'READY':
        return <Badge className="bg-green-600">Ready</Badge>
      case 'TRAINING':
        return <Badge variant="secondary">Training</Badge>
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">{state}</Badge>
    }
  }

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <div>
          <h2 className="text-3xl font-bold tracking-tight">My Models</h2>
            <p className="text-muted-foreground">Manage and run predictions with your trained models</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/upload">
            <Brain className="h-4 w-4 mr-2" />
            Train New Model
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-muted-foreground">Loading models...</span>
        </div>
      ) : models.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No models yet</h3>
            <p className="text-muted-foreground mb-4">Get started by training your first model</p>
            <Button asChild>
              <Link href="/dashboard/upload">
                <Brain className="h-4 w-4 mr-2" />
                Train New Model
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
          {(models as any[]).map((model: any) => (
          <Card key={model.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{model.name || `Model ${model.id.slice(0, 8)}`}</CardTitle>
                  {getStatusBadge(model.state)}
              </div>
                <CardDescription>
                  {model.description || 'Machine learning model'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-muted-foreground">Model ID</p>
                    <p className="font-mono text-xs">{model.id.slice(0, 12)}...</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Accuracy</p>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="font-medium">
                        {model.accuracy ? `${(model.accuracy).toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                  <span>Created {formatDate(model.createdAt)}</span>
              </div>

              <div className="flex space-x-2">
                  {model.state === "READY" ? (
                    <>
                      <Dialog open={isDialogOpen && selectedModelForInference?.id === model.id} onOpenChange={(open) => {
                        setIsDialogOpen(open)
                        if (!open) {
                          setSelectedModelForInference(null)
                          setPredictionResult(null)
                          setInputData({})
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              router.push(`/dashboard/inference?modelId=${model.id}`)
                            }}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Run Inference
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Run Inference - {model.name || `Model ${model.id.slice(0, 8)}`}</DialogTitle>
                            <DialogDescription>
                              Provide input values to get predictions from your model
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            {/* Dynamic input fields */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="age">Age</Label>
                                <Input 
                                  id="age" 
                                  type="number" 
                                  placeholder="45" 
                                  value={inputData.Age || ''} 
                                  onChange={(e) => handleInputChange('Age', Number(e.target.value))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="tenure">Tenure</Label>
                                <Input 
                                  id="tenure" 
                                  type="number" 
                                  placeholder="60" 
                                  value={inputData.Tenure || ''} 
                                  onChange={(e) => handleInputChange('Tenure', Number(e.target.value))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="usage">Usage Frequency</Label>
                                <Input 
                                  id="usage" 
                                  type="number" 
                                  placeholder="30" 
                                  value={inputData['Usage Frequency'] || ''} 
                                  onChange={(e) => handleInputChange('Usage Frequency', Number(e.target.value))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="support">Support Calls</Label>
                                <Input 
                                  id="support" 
                                  type="number" 
                                  placeholder="0" 
                                  value={inputData['Support Calls'] || ''} 
                                  onChange={(e) => handleInputChange('Support Calls', Number(e.target.value))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="delay">Payment Delay</Label>
                                <Input 
                                  id="delay" 
                                  type="number" 
                                  placeholder="0" 
                                  value={inputData['Payment Delay'] || ''} 
                                  onChange={(e) => handleInputChange('Payment Delay', Number(e.target.value))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="spend">Total Spend</Label>
                                <Input 
                                  id="spend" 
                                  type="number" 
                                  placeholder="5000" 
                                  value={inputData['Total Spend'] || ''} 
                                  onChange={(e) => handleInputChange('Total Spend', Number(e.target.value))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="interaction">Last Interaction</Label>
                                <Input 
                                  id="interaction" 
                                  type="number" 
                                  placeholder="1" 
                                  value={inputData['Last Interaction'] || ''} 
                                  onChange={(e) => handleInputChange('Last Interaction', Number(e.target.value))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select onValueChange={(value) => handleInputChange('Gender', value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="subscription">Subscription Type</Label>
                                <Select onValueChange={(value) => handleInputChange('Subscription Type', value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Basic">Basic</SelectItem>
                                    <SelectItem value="Premium">Premium</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="contract">Contract Length</Label>
                                <Select onValueChange={(value) => handleInputChange('Contract Length', value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1 Month">1 Month</SelectItem>
                                    <SelectItem value="12 Months">12 Months</SelectItem>
                                    <SelectItem value="24 Months">24 Months</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Prediction Result */}
                            {predictionResult && (
                              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                                <CardHeader>
                                  <CardTitle className="text-green-800 flex items-center">
                                    <TrendingUp className="h-5 w-5 mr-2" />
                                    Prediction Result
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="text-center p-4 bg-white rounded-lg">
                                    <p className="text-3xl font-bold text-blue-600">
                                      {predictionResult.prediction !== undefined 
                                        ? (typeof predictionResult.prediction === 'number'
                                          ? (predictionResult.prediction === 0 ? 'No Churn' : 'Churn')
                                          : String(predictionResult.prediction))
                                        : 'N/A'}
                                    </p>
                                    {predictionResult.confidence && (
                                      <p className="text-sm text-muted-foreground mt-2">
                                        Confidence: {(predictionResult.confidence).toFixed(1)}%
                                      </p>
                                    )}
                                  </div>
                                  {predictionResult.probabilities && (
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      {predictionResult.probabilities.map((prob: number, idx: number) => (
                                        <div key={idx} className="bg-white p-2 rounded">
                                          <span className="font-medium">Class {idx}: </span>
                                          <span>{(prob).toFixed(1)}%</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}

                            <div className="flex space-x-2">
                              <Button 
                                onClick={handleInference} 
                                disabled={inferenceMutation.isPending}
                                className="flex-1"
                              >
                                {inferenceMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Predicting...
                                  </>
                                ) : (
                                  <>
                                    <Zap className="h-4 w-4 mr-2" />
                                    Make Prediction
                                  </>
                                )}
                    </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setInputData({})
                                  setPredictionResult(null)
                                }}
                              >
                                Clear
                    </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                  </>
                ) : (
                  <Button disabled size="sm" className="flex-1">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      {model.state === 'TRAINING' ? 'Training...' : 'Not Ready'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  )
}
