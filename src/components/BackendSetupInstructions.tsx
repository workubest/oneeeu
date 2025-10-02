import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Code,
  Server,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { apiService } from '../services/api';

interface BackendSetupInstructionsProps {
  onClose?: () => void;
}

export function BackendSetupInstructions({ onClose }: BackendSetupInstructionsProps = {}) {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [testResult, setTestResult] = useState<string>('');

  const scriptUrl = 'https://script.google.com/home/start';
  const deployUrl = 'https://script.google.com/macros/s/AKfycbzbYwGgvpzd4EdbjGmaJnT0VusWwN2efaQug6HOCX5iM-u9sJ2iPmOkuaLyBX3roIcg/exec';

  const testConnection = async () => {
    setTesting(true);
    setTestResult('');
    
    try {
      const response = await apiService.healthCheck();
      if (response.success) {
        setConnectionStatus('connected');
        setTestResult(`✅ Backend connected successfully! Mode: ${response.data?.mode || 'live'}`);
      } else {
        setConnectionStatus('disconnected');
        setTestResult(`❌ Backend responded but with error: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      setTestResult(`❌ Connection failed: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-orange-500" />
            Backend Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The app is currently running in <strong>Demo Mode</strong> due to backend connectivity issues. 
              Data changes are temporary and will reset on page refresh. To enable persistent data storage, 
              follow these steps to set up the Google Apps Script backend.
            </AlertDescription>
          </Alert>

          {/* Connection Tester */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-blue-900">Backend Connection Test</h4>
                  <Badge variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'disconnected' ? 'destructive' : 'secondary'}>
                    {connectionStatus === 'connected' && <><Wifi className="w-3 h-3 mr-1" />Connected</>}
                    {connectionStatus === 'disconnected' && <><WifiOff className="w-3 h-3 mr-1" />Disconnected</>}
                    {connectionStatus === 'unknown' && <>Unknown</>}
                  </Badge>
                </div>
                
                <p className="text-sm text-blue-800">
                  Test the connection to your Google Apps Script backend.
                </p>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={testConnection}
                    disabled={testing}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Wifi className="w-4 h-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>
                
                {testResult && (
                  <div className="text-sm p-2 bg-white rounded border border-blue-200">
                    {testResult}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Step 1: Create Google Apps Script</h3>
              <p className="text-sm text-gray-600 mb-2">
                Go to Google Apps Script and create a new project
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(scriptUrl, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Google Apps Script
              </Button>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Step 2: Copy Backend Code</h3>
              <p className="text-sm text-gray-600 mb-2">
                Copy the comprehensive Google Apps Script backend code (Version 3.2.2) and paste it into your project
              </p>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Backend code features:</span>
                </div>
                <ul className="text-gray-700 space-y-1">
                  <li>• User authentication & session management</li>
                  <li>• CRUD operations for users & complaints</li>
                  <li>• Dashboard metrics & analytics</li>
                  <li>• Role-based access control</li>
                  <li>• JSONP support for cross-origin requests</li>
                  <li>• Comprehensive error handling</li>
                </ul>
              </div>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Step 3: Configure Script Properties</h3>
              <p className="text-sm text-gray-600 mb-2">
                Set up the script properties (optional - backend will auto-create if not set):
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• SHEET_ID: Your Google Sheets ID for data storage</li>
                <li>• DRIVE_FOLDER_ID: Folder for file attachments</li>
                <li>• JWT_SECRET: Custom JWT secret key</li>
                <li>• API_KEY: Custom API key for authentication</li>
              </ul>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Step 4: Deploy as Web App</h3>
              <p className="text-sm text-gray-600 mb-2">
                Deploy your script as a web app with these settings:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Execute as: Me (your Google account)</li>
                <li>• Who has access: Anyone (for public access)</li>
                <li>• Version: New deployment</li>
                <li>• Copy the web app URL</li>
              </ul>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Step 5: Update API Configuration</h3>
              <p className="text-sm text-gray-600 mb-2">
                Update the BASE_URL in /services/api.ts with your web app deployment URL
              </p>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Replace this URL with your deployment URL:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(deployUrl)}
                    className="h-6 px-2"
                  >
                    {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <code className="text-gray-800 break-all">{deployUrl}</code>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Step 6: Test & Initialize Data</h3>
              <p className="text-sm text-gray-600 mb-2">
                Test your deployment by accessing the web app URL. The backend will automatically create 
                required spreadsheet tables. Optionally, run the seed function to add test data.
              </p>
              <div className="bg-green-50 p-2 rounded text-xs">
                <strong>Auto-Setup:</strong> The backend automatically creates tables and handles missing sheets.
              </div>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Accounts:</strong> admin@eeu.gov.et/admin2025, staff.addis@eeu.gov.et/staffAddis2025, 
              customer@eeu.gov.et/cust2025, manager.addis@eeu.gov.et/mgrAddis2025
            </AlertDescription>
          </Alert>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Backend API Features:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
              <div>• JWT-based authentication</div>
              <div>• Session management</div>
              <div>• User CRUD operations</div>
              <div>• Complaint management</div>
              <div>• Dashboard analytics</div>
              <div>• Notification system</div>
              <div>• Role-based permissions</div>
              <div>• Automatic fallback handling</div>
            </div>
          </div>

          {onClose && (
            <div className="flex justify-end pt-4">
              <Button onClick={onClose} className="bg-orange-500 hover:bg-orange-600 text-white">
                Got it, thanks!
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}