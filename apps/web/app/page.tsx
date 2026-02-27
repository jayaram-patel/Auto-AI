import { LoginForm } from "@/components/login-form";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Auto AI</h1>
          <p className="text-gray-600">Generate AI Models from your data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <div>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
