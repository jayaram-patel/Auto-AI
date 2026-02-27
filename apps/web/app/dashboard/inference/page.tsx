"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Zap, Brain, TrendingUp, AlertCircle, Clock, BarChart3, History, Filter, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

interface PredictionOutput {
  prediction: any
  confidence?: number
  probabilities?: number[]
  input_features?: Record<string, any>
  model_path?: string
}

interface InferenceRecord {
  id: string
  modelId: string
  input: Record<string, any>
  output: PredictionOutput
  createdAt: Date
}

export default function InferencePage() {
  const [selectedModel, setSelectedModel] = useState("")
  const [prediction, setPrediction] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("inference")
  const [inputData, setInputData] = useState<Record<string, any>>({})
  
  const { toast } = useToast()

  // Fetch user models
  const { data: models = [], isLoading: modelsLoading } = trpc.models.useQuery()
  
  // Fetch inference history
  const { data: inferenceHistory, refetch: refetchHistory, error: inferenceHistoryError } = trpc.inferenceHistory.useQuery({
    limit: 10,
    offset: 0,
  });

  // Inference mutation
  //@ts-ignore
  const inferenceMutation = trpc.inference.useMutation({
    onSuccess: (result) => {
      setPrediction(result.output)
      setLoading(false)
      toast({
        title: "Prediction Complete",
        description: "Your model has successfully made a prediction.",
      })
      refetchHistory()
    },
    onError: (error) => {
      setLoading(false)
      toast({
        title: "Prediction Failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Get selected model details
  const selectedModelData = models.find((m: any) => m.id === selectedModel)

  const handleInputChange = (key: string, value: any) => {
    setInputData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModel || !inputData || Object.keys(inputData).length === 0) {
      toast({
        title: "Missing Data",
        description: "Please select a model and provide input data.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    
    inferenceMutation.mutate({
      modelId: selectedModel,
      input: inputData,
    })
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if(inferenceHistoryError) {
    return <div>Error: {inferenceHistoryError.message}</div>
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Model Inference</h2>
            <p className="text-muted-foreground">Make predictions and view inference history</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Total Inferences: {inferenceHistory?.total || 0}</span>
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inference" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Make Inference</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>Inference History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inference" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Model Selection Card */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>Select Model</span>
                </CardTitle>
                <CardDescription>Choose from your trained models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {modelsLoading ? (
                  <div className="text-center py-4">
                    <Brain className="h-8 w-8 mx-auto mb-2 animate-pulse text-muted-foreground" />
                    <p className="text-muted-foreground">Loading models...</p>
                  </div>
                ) : models.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/70" />
                    <p>No trained models found</p>
                    <p className="text-sm">Train a model first to start making predictions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(models as any[]).filter((m: any) => m.state === 'READY').map((model: any) => (
                      <div
                        key={model.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedModel === model.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => {
                          setSelectedModel(model.id)
                          setInputData({}) // Reset input data when changing models
                          setPrediction(null) // Clear previous prediction
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{model.name || `Model ${model.id.slice(0, 8)}`}</h4>
                            <div className="flex items-center flex-wrap gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {model.modelType || 'ML Model'}
                              </Badge>
                              {model.accuracy && (
                                <Badge variant="outline" className="text-xs">
                                  {(model.accuracy).toFixed(1)}% accuracy
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Brain className={`h-5 w-5 ${selectedModel === model.id ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Input Form Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Input Parameters</CardTitle>
                <CardDescription>Provide the required data for prediction</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedModelData ? (
                  <form onSubmit={handlePredict} className="space-y-6">
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground mb-4">
                        <p>Model: <span className="font-medium">{selectedModelData.name || `Model ${selectedModelData.id.slice(0, 8)}`}</span></p>
                        {selectedModelData.modelType && (
                          <p className="mt-1">Type: <span className="font-medium">{selectedModelData.modelType}</span></p>
                        )}
                        {selectedModelData.description && (
                          <p className="mt-1">{selectedModelData.description}</p>
                        )}
                        {selectedModelData.thoughts && (
                          <Accordion type="single" collapsible className="mt-3">
                            <AccordionItem value="thoughts" className="border rounded-lg bg-muted/50">
                              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                <span className="font-medium text-foreground text-sm">Thoughts</span>
                              </AccordionTrigger>
                              <AccordionContent className="px-3 pb-3">
                                <p className="text-xs leading-relaxed text-muted-foreground">{selectedModelData.thoughts}</p>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </div>
                      
                      {/* Dynamic input fields based on model inputs */}
                      {selectedModelData && selectedModelData.inputs && Array.isArray(selectedModelData.inputs) && selectedModelData.inputs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(selectedModelData.inputs as any[]).map((inputField: any, index: number) => {
                            const fieldName = typeof inputField === 'string' ? inputField : inputField.name || `field_${index}`;
                            const fieldType = typeof inputField === 'object' ? inputField.type : 'text';
                            
                            return (
                              <div key={fieldName} className="space-y-2">
                                <Label htmlFor={fieldName} className="capitalize">
                                  {fieldName.replace(/[_-]/g, ' ')}
                                </Label>
                                {fieldType === 'select' && inputField.options ? (
                                  <Select onValueChange={(value) => handleInputChange(fieldName, value)}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {inputField.options.map((option: string) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    id={fieldName}
                                    type={fieldType === 'number' ? 'number' : 'text'}
                                    placeholder={`Enter ${fieldName.replace(/[_-]/g, ' ')}`}
                                    value={inputData[fieldName] || ''}
                                    onChange={(e) => handleInputChange(fieldName, fieldType === 'number' ? Number(e.target.value) : e.target.value)}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        // Fallback: JSON input when model schema is not available
                        <div className="space-y-4">
                          <Alert className="border-amber-500/50 bg-amber-500/10">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-700">
                              Model input schema not available. Please provide input data as JSON.
                            </AlertDescription>
                          </Alert>
                          <div className="space-y-2">
                            <Label htmlFor="jsonInput">Input Data (JSON Format)</Label>
                            <textarea
                              id="jsonInput"
                              className="w-full h-64 p-3 rounded-lg border border-border bg-background text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder={`{\n  "feature1": 123,\n  "feature2": 456,\n  "feature3": "value"\n}`}
                              value={Object.keys(inputData).length > 0 ? JSON.stringify(inputData, null, 2) : ''}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  setInputData(parsed);
                                } catch (err) {
                                  // Allow typing invalid JSON, only update when valid
                                }
                              }}
                            />
                            <p className="text-xs text-muted-foreground">
                              Enter your model features as a JSON object. Example: {`{"age": 25, "income": 50000}`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={!selectedModel || loading}>
                      {loading ? (
                        <>
                          <Brain className="h-4 w-4 mr-2 animate-spin" />
                          Predicting...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Make Prediction
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/70" />
                    <p>Select a model to start making predictions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Prediction Result */}
          {prediction && (
            <Card className="border-border bg-gradient-to-br from-card via-background to-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Prediction Result</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">Results from your selected model</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-8 bg-background/50 rounded-lg border border-border shadow-xl">
                  <p className="text-4xl font-bold text-primary">
                    {prediction.prediction !== undefined ? String(prediction.prediction) : 'N/A'}
                  </p>
                  {prediction.confidence && (
                    <p className="text-lg text-muted-foreground mt-2">
                      Confidence: {(prediction.confidence).toFixed(1)}%
                    </p>
                  )}
                  {prediction.probabilities && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Class Probabilities:</p>
                      <div className="flex justify-center space-x-4">
                        {prediction.probabilities.map((prob: number, index: number) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground/90">Class {index}: </span>
                            <span>{(prob).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3 text-foreground/90">Input Features</h4>
                    <div className="space-y-2">
                      {Object.entries(prediction.input_features || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-mono text-muted-foreground">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 text-foreground/90">Model Info</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Prediction: <span className="text-muted-foreground">{typeof prediction.prediction === 'number' ? 
                        `Class ${prediction.prediction}` : 
                        String(prediction.prediction)}</span></p>
                      {prediction.confidence && (
                        <p>• Confidence: <span className="text-muted-foreground">{(prediction.confidence).toFixed(1)}%</span></p>
                      )}
                      <p>• Model: <span className="text-muted-foreground">{selectedModelData?.name || 'ML Model'}</span></p>
                      {selectedModelData?.modelType && (
                        <p>• Type: <span className="text-muted-foreground">{selectedModelData.modelType}</span></p>
                      )}
                    </div>
                  </div>
                </div>

                <Alert className="border-border bg-muted/50">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-muted-foreground">
                    This prediction is based on the trained model and should be used as guidance alongside domain
                    expertise. Consider the confidence level when making decisions.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <History className="h-5 w-5 text-primary" />
                    <span>Inference History</span>
                  </CardTitle>
                  <CardDescription>Track all your model predictions and results</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search inferences..." className="pl-10 w-64" />
                  </div>
                  <Select>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Models</SelectItem>
                      <SelectItem value="churn">Churn Predictor</SelectItem>
                      <SelectItem value="sales">Sales Forecaster</SelectItem>
                      <SelectItem value="sentiment">Sentiment Analyzer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inferenceHistory?.inferences && inferenceHistory.inferences.length > 0 ? (
                  inferenceHistory.inferences.map((inference: any) => (
                    <div
                      key={inference.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-foreground">
                              Model {inference.modelId.slice(0, 8)}
                            </h4>
                            <Badge className="bg-green-500/10 text-green-500">
                              completed
                            </Badge>
                            {(inference.output as any)?.confidence && (
                              <Badge variant="outline" className="text-xs">
                                {((inference.output as any).confidence).toFixed(1)}% confidence
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                            <div>
                              <span className="font-medium">Input:</span>
                              <div className="mt-1 space-y-1">
                                {Object.entries(inference.input as Record<string, any>).slice(0, 3).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="capitalize">{key.replace(/[_-]/g, ' ')}:</span>
                                    <span className="font-mono">{String(value)}</span>
                                  </div>
                                ))}
                                {Object.keys(inference.input as Record<string, any>).length > 3 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{Object.keys(inference.input as Record<string, any>).length - 3} more...
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Result:</span>
                              <p className="mt-1 font-semibold text-lg text-primary">
                                {(inference.output as any)?.prediction !== undefined ? 
                                  (typeof (inference.output as any).prediction === 'number' ?
                                    `Class ${(inference.output as any).prediction}` :
                                    String((inference.output as any).prediction)
                                  ) : 'N/A'
                                }
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Timestamp:</span>
                              <p className="mt-1">{formatTimestamp(inference.createdAt.toString())}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs">
                            {new Date(inference.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/70" />
                    <p>No inference history found</p>
                    <p className="text-sm">Start making predictions to see them here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
