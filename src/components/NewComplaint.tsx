import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import {
  ArrowLeft,
  MapPin,
  Camera,
  Upload,
  User,
  FileText,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  RefreshCw,
} from "lucide-react";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import eeuLogo from "figma:asset/a7b96e6fbe59cc65b1f1fae75f58ca6158a2d650.png";

interface NewComplaintProps {
  onBack: () => void;
  onNavigate?: (view: string, data?: any) => void;
}

export function NewComplaint({
  onBack,
  onNavigate,
}: NewComplaintProps) {
  const [formData, setFormData] = useState({
    type: "",
    priority: "",
    title: "",
    description: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    serviceAccount: "",
    address: "",
    coordinates: { lat: "", lng: "" },
    affectedHouseholds: "",
    urgency: "",
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const complaintTypes = [
    {
      value: "power-outage",
      label: "Power Outage",
      icon: Zap,
      color: "text-red-600",
    },
    {
      value: "voltage-fluctuation",
      label: "Voltage Fluctuation",
      icon: AlertTriangle,
      color: "text-yellow-600",
    },
    {
      value: "billing-issue",
      label: "Billing Issue",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      value: "meter-problem",
      label: "Meter Problem",
      icon: Clock,
      color: "text-purple-600",
    },
    {
      value: "connection-request",
      label: "New Connection",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      value: "maintenance-request",
      label: "Maintenance Request",
      icon: User,
      color: "text-gray-600",
    },
  ];

  const priorityLevels = [
    {
      value: "critical",
      label: "Critical",
      color: "bg-red-100 text-red-800",
      description: "Life-threatening or widespread outage",
    },
    {
      value: "high",
      label: "High",
      color: "bg-orange-100 text-orange-800",
      description: "Multiple customers affected",
    },
    {
      value: "medium",
      label: "Medium",
      color: "bg-yellow-100 text-yellow-800",
      description: "Single customer, non-urgent",
    },
    {
      value: "low",
      label: "Low",
      color: "bg-green-100 text-green-800",
      description: "General inquiry or request",
    },
  ];

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (files) {
      setAttachments((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) =>
      prev.filter((_, i) => i !== index),
    );
  };

  const handleSubmit = () => {
    // Validate required fields
    if (
      !formData.type ||
      !formData.title ||
      !formData.description
    ) {
      alert("Please fill in all required fields");
      return;
    }

    // Submit complaint logic here
    console.log("Submitting complaint:", formData, attachments);
    alert(
      "Complaint submitted successfully! Reference: EEU-2024-" +
        Math.random().toString(36).substr(2, 6).toUpperCase(),
    );
    onBack();
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          formData.type &&
          formData.priority &&
          formData.title &&
          formData.description
        );
      case 2:
        return (
          formData.customerName &&
          formData.customerPhone &&
          formData.serviceAccount
        );
      case 3:
        return formData.address;
      default:
        return true;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* EEU Header */}
      <Card className="bg-gradient-to-r from-orange-50 to-green-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <img
              src={eeuLogo}
              alt="EEU Logo"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h3 className="font-medium text-gray-900">
                Ethiopian Electric Utility
              </h3>
              <p className="text-sm text-gray-600">
                Submit a new service complaint
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaint Type */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Complaint Type <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {complaintTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.value}
                className={`cursor-pointer transition-all ${
                  formData.type === type.value
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() =>
                  updateFormData("type", type.value)
                }
              >
                <CardContent className="p-3 text-center">
                  <Icon
                    className={`w-6 h-6 ${type.color} mx-auto mb-2`}
                  />
                  <p className="text-sm font-medium">
                    {type.label}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Priority Level */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Priority Level <span className="text-red-500">*</span>
        </Label>
        <div className="space-y-2">
          {priorityLevels.map((priority) => (
            <Card
              key={priority.value}
              className={`cursor-pointer transition-all ${
                formData.priority === priority.value
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() =>
                updateFormData("priority", priority.value)
              }
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${priority.color}`}
                    >
                      {priority.label}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {priority.description}
                    </p>
                  </div>
                  {formData.priority === priority.value && (
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <Label
          htmlFor="title"
          className="text-sm font-medium text-gray-700"
        >
          Complaint Title{" "}
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Brief description of the issue"
          value={formData.title}
          onChange={(e) =>
            updateFormData("title", e.target.value)
          }
          className="mt-1"
        />
      </div>

      {/* Description */}
      <div>
        <Label
          htmlFor="description"
          className="text-sm font-medium text-gray-700"
        >
          Detailed Description{" "}
          <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Provide detailed information about the issue, including when it started, what you've observed, and any relevant circumstances..."
          value={formData.description}
          onChange={(e) =>
            updateFormData("description", e.target.value)
          }
          className="mt-1 min-h-[100px]"
        />
        <p className="text-xs text-gray-500 mt-1">
          Be specific to help our technicians understand and
          resolve the issue quickly
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Customer Information Header */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <User className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">
                Customer Information
              </h3>
              <p className="text-sm text-blue-700">
                Please provide your contact details
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Name */}
      <div>
        <Label
          htmlFor="customerName"
          className="text-sm font-medium text-gray-700"
        >
          Full Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="customerName"
          placeholder="Enter your full name"
          value={formData.customerName}
          onChange={(e) =>
            updateFormData("customerName", e.target.value)
          }
          className="mt-1"
        />
      </div>

      {/* Phone Number */}
      <div>
        <Label
          htmlFor="customerPhone"
          className="text-sm font-medium text-gray-700"
        >
          Phone Number <span className="text-red-500">*</span>
        </Label>
        <div className="relative mt-1">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="customerPhone"
            placeholder="+251911234567"
            value={formData.customerPhone}
            onChange={(e) =>
              updateFormData("customerPhone", e.target.value)
            }
            className="pl-10"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <Label
          htmlFor="customerEmail"
          className="text-sm font-medium text-gray-700"
        >
          Email Address
        </Label>
        <div className="relative mt-1">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="customerEmail"
            type="email"
            placeholder="your.email@example.com"
            value={formData.customerEmail}
            onChange={(e) =>
              updateFormData("customerEmail", e.target.value)
            }
            className="pl-10"
          />
        </div>
      </div>

      {/* Service Account Number */}
      <div>
        <Label
          htmlFor="serviceAccount"
          className="text-sm font-medium text-gray-700"
        >
          EEU Service Account Number{" "}
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="serviceAccount"
          placeholder="EEU-ACC-XXXXXX"
          value={formData.serviceAccount}
          onChange={(e) =>
            updateFormData("serviceAccount", e.target.value)
          }
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Found on your electricity bill or meter reading card
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Location Header */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <MapPin className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-medium text-green-900">
                Location Information
              </h3>
              <p className="text-sm text-green-700">
                Help us locate the issue precisely
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <div>
        <Label
          htmlFor="address"
          className="text-sm font-medium text-gray-700"
        >
          Complete Address{" "}
          <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="address"
          placeholder="House number, street name, kebele, woreda, city..."
          value={formData.address}
          onChange={(e) =>
            updateFormData("address", e.target.value)
          }
          className="mt-1"
        />
      </div>

      {/* GPS Coordinates */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          GPS Coordinates (Optional)
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Latitude"
            value={formData.coordinates.lat}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                coordinates: {
                  ...prev.coordinates,
                  lat: e.target.value,
                },
              }))
            }
          />
          <Input
            placeholder="Longitude"
            value={formData.coordinates.lng}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                coordinates: {
                  ...prev.coordinates,
                  lng: e.target.value,
                },
              }))
            }
          />
        </div>
        <Button
          variant="outline"
          className="w-full mt-2 border-green-500 text-green-700 hover:bg-green-50"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Use Current Location
        </Button>
      </div>

      {/* Affected Households */}
      {formData.type === "power-outage" && (
        <div>
          <Label
            htmlFor="affectedHouseholds"
            className="text-sm font-medium text-gray-700"
          >
            Estimated Affected Households
          </Label>
          <Select
            value={formData.affectedHouseholds}
            onValueChange={(value) =>
              updateFormData("affectedHouseholds", value)
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">
                Only my household
              </SelectItem>
              <SelectItem value="2-5">
                2-5 households
              </SelectItem>
              <SelectItem value="6-20">
                6-20 households
              </SelectItem>
              <SelectItem value="21-50">
                21-50 households
              </SelectItem>
              <SelectItem value="50+">
                More than 50 households
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Photo Attachments */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Photo Evidence (Optional)
        </Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Take photos of the issue
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <Button
            variant="outline"
            onClick={() =>
              document.getElementById("file-upload")?.click()
            }
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Photos
          </Button>
        </div>

        {attachments.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Attached Photos ({attachments.length})
            </p>
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm truncate">
                    {file.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      {/* Review Header */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-orange-600" />
            <div>
              <h3 className="font-medium text-orange-900">
                Review & Submit
              </h3>
              <p className="text-sm text-orange-700">
                Please review your complaint details
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaint Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Complaint Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">
              TYPE & PRIORITY
            </label>
            <p className="font-medium">
              {
                complaintTypes.find(
                  (t) => t.value === formData.type,
                )?.label
              }{" "}
              - {formData.priority} priority
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">
              TITLE
            </label>
            <p className="font-medium">{formData.title}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">
              DESCRIPTION
            </label>
            <p className="text-sm text-gray-700">
              {formData.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Customer Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>Name:</strong> {formData.customerName}
          </div>
          <div>
            <strong>Phone:</strong> {formData.customerPhone}
          </div>
          {formData.customerEmail && (
            <div>
              <strong>Email:</strong> {formData.customerEmail}
            </div>
          )}
          <div>
            <strong>Account:</strong> {formData.serviceAccount}
          </div>
        </CardContent>
      </Card>

      {/* Location Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Location</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>{formData.address}</p>
          {formData.coordinates.lat &&
            formData.coordinates.lng && (
              <p className="text-gray-600 mt-1">
                Coordinates: {formData.coordinates.lat},{" "}
                {formData.coordinates.lng}
              </p>
            )}
          {formData.affectedHouseholds && (
            <p className="text-red-600 mt-1">
              Affected households: {formData.affectedHouseholds}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Attachments Summary */}
      {attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Attachments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {attachments.length} photo(s) attached
            </p>
          </CardContent>
        </Card>
      )}

      {/* Important Notice */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">
                Important Notice
              </h4>
              <p className="text-sm text-yellow-800 mt-1">
                By submitting this complaint, you confirm that
                the information provided is accurate. EEU will
                respond within 24 hours for high priority issues
                and within 72 hours for standard complaints.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              New Complaint
            </h1>
            <p className="text-sm text-gray-600">
              Step {currentStep} of 4
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>

      {/* Step Content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            className="flex-1"
          >
            Previous
          </Button>
        )}

        {currentStep < 4 ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!isStepValid(currentStep)}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
          >
            Submit Complaint
          </Button>
        )}
      </div>
    </div>
  );
}