"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Upload, FileText, CheckCircle, AlertCircle, Table, Eye, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

interface CSVRow {
  [key: string]: string
}

export default function UploadDataset() {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter()
  const {mutate: upload, isPending: uploadPending} = trpc.upload.useMutation()
  const {mutate: train, isPending: trainPending} = trpc.train.useMutation()
  const { toast } = useToast()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile)
        parseCSV(droppedFile)
      } else {
        alert("Please upload a CSV file")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile)
        parseCSV(selectedFile)
      } else {
        alert("Please upload a CSV file")
      }
    }
  }

  const handleBrowseClick = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.click()
    }
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n')
        
        if (lines.length < 2) {
          toast({
            title: "Invalid CSV",
            description: "CSV file must contain at least a header row and one data row.",
            variant: "destructive",
          })
          return
        }
        
        const csvHeaders = lines[0].split(',').map(header => header.trim().replace(/"/g, ''))
        setHeaders(csvHeaders)
        
        const rows: CSVRow[] = []
        for (let i = 1; i < Math.min(lines.length, 11); i++) { // First 10 rows + header
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''))
            const row: CSVRow = {}
            csvHeaders.forEach((header, index) => {
              row[header] = values[index] || ''
            })
            rows.push(row)
          }
        }
        setCsvData(rows)
        setShowPreview(true)
      } catch (error) {
        console.error('Error parsing CSV:', error)
        toast({
          title: "CSV Parse Error",
          description: "Failed to parse CSV file. Please check the file format.",
          variant: "destructive",
        })
      }
    }
    reader.onerror = () => {
      toast({
        title: "File Read Error",
        description: "Failed to read the CSV file.",
        variant: "destructive",
      })
    }
    reader.readAsText(file)
  }

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024 // 100MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 100MB.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)
      
      const base64 = await readFileAsBase64(file)
      upload({base64}, {
        onSuccess: (result) => {
          setUploadProgress(100)
          toast({
            title: "Upload Successful",
            description: "Your CSV file has been uploaded. Starting training...",
          })
          
          // Call train route with the dataset ID
          train(result.id, {
            onSuccess: (trainResult: { jobId: string }) => {
              toast({
                title: "Training Started",
                description: `Training job ${trainResult.jobId} has been initiated.`,
              })
              setTimeout(() => {
                router.push("/dashboard/loading")
              }, 1000)
            },
            onError: (error: any) => {
              console.error('Training failed:', error)
              toast({
                title: "Training Failed",
                description: error.message || "Failed to start training. Please try again.",
                variant: "destructive",
              })
              setUploading(false)
            }
          })
        },
        onError: (error) => {
          console.error('Upload failed:', error)
          toast({
            title: "Upload Failed",
            description: error.message || "Failed to upload file. Please try again.",
            variant: "destructive",
          })
          setUploading(false)
        }
      })
    } catch (error) {
      console.error('Error reading file:', error)
      toast({
        title: "File Error",
        description: "Failed to read the file. Please try again.",
        variant: "destructive",
      })
      setUploading(false)
    }
  }

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <SidebarTrigger />
        <h2 className="text-3xl font-bold tracking-tight">Upload Dataset</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 w-full">
        <Card>
          <CardHeader>
            <CardTitle>CSV Dataset Upload</CardTitle>
            <CardDescription>Upload your CSV dataset to start training a new model</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>CSV Dataset File</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    dragActive
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : file
                        ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                        : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={handleBrowseClick}
                >
                  {file ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        <Table className="h-4 w-4" />
                        <span className="text-xs text-muted-foreground">
                          {csvData.length} rows preview available
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-sm font-medium">Drag and drop your CSV file here, or click to browse</p>
                      <p className="text-xs text-muted-foreground">Only CSV files are supported</p>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                    id="file-upload"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleBrowseClick}
                    className="mt-2"
                  >
                    Browse Files
                  </Button>
                </div>
              </div>

              {uploading || uploadPending || trainPending ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Uploading... {uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <Button type="submit" className="w-full" disabled={!file}>
                  Upload & Start Training
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Guidelines</CardTitle>
            <CardDescription>Follow these guidelines for best results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">File Format</p>
                <p className="text-xs text-muted-foreground">Only CSV files are supported</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Data Quality</p>
                <p className="text-xs text-muted-foreground">Ensure your CSV is clean and properly formatted</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Size Limit</p>
                <p className="text-xs text-muted-foreground">Maximum file size is 100MB</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Table className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Preview</p>
                <p className="text-xs text-muted-foreground">First 10 rows will be shown for verification</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSV Preview Section */}
      {showPreview && csvData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <CardTitle>CSV Preview (First 10 Rows)</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>
            </div>
            <CardDescription>
              Preview of your uploaded CSV file to verify the data structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <UITable>
                <TableHeader>
                  <TableRow>
                    {headers.map((header, index) => (
                      <TableHead key={index} className="font-medium">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.map((header, colIndex) => (
                        <TableCell key={colIndex} className="max-w-[200px] truncate">
                          {row[header] || ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </UITable>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {csvData.length} of {csvData.length} preview rows
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
