import { useState, useEffect, useCallback, createContext, useContext } from 'react';

export type Language = 'en' | 'am';

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

interface LanguageState {
  currentLanguage: Language;
  isLoading: boolean;
  error: string | null;
  translations: TranslationDictionary;
  availableLanguages: { code: Language; name: string; nativeName: string }[];
}

interface UseLanguageReturn extends LanguageState {
  setLanguage: (language: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string, format?: 'short' | 'long' | 'time') => string;
  formatNumber: (number: number, format?: 'currency' | 'percent' | 'decimal') => string;
  isRTL: boolean;
  getDirection: () => 'ltr' | 'rtl';
}

const LANGUAGE_STORAGE_KEY = 'eeu_language_preference';

// Default translations
const defaultTranslations: Record<Language, TranslationDictionary> = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      update: 'Update',
      search: 'Search',
      filter: 'Filter',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
      yes: 'Yes',
      no: 'No',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      refresh: 'Refresh',
      user: 'User'
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      username: 'Username',
      password: 'Password',
      email: 'Email',
      forgotPassword: 'Forgot Password?',
      loginError: 'Invalid credentials',
      loginSuccess: 'Login successful',
      loading: 'Authenticating...'
    },
    dashboard: {
      title: 'Dashboard',
      totalComplaints: 'Total Complaints',
      activeComplaints: 'Active Complaints',
      resolvedComplaints: 'Resolved Complaints',
      averageResolutionTime: 'Average Resolution Time',
      recentActivity: 'Recent Activity',
      systemStatus: 'System Status',
      quickActions: 'Quick Actions'
    },
    complaints: {
      title: 'Complaints',
      newComplaint: 'New Complaint',
      complaintDetails: 'Complaint Details',
      complaintId: 'Complaint ID',
      customerName: 'Customer Name',
      subject: 'Subject',
      description: 'Description',
      status: 'Status',
      priority: 'Priority',
      assignedTo: 'Assigned To',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      category: 'Category',
      subcategory: 'Subcategory',
      resolution: 'Resolution',
      feedback: 'Feedback',
      attachments: 'Attachments'
    },
    users: {
      title: 'Users',
      newUser: 'New User',
      userDetails: 'User Details',
      name: 'Name',
      role: 'Role',
      department: 'Department',
      phone: 'Phone',
      status: 'Status',
      lastLogin: 'Last Login',
      permissions: 'Permissions'
    },
    outages: {
      title: 'Outages',
      newOutage: 'New Outage',
      outageDetails: 'Outage Details',
      location: 'Location',
      affectedCustomers: 'Affected Customers',
      estimatedRestoration: 'Estimated Restoration',
      cause: 'Cause',
      severity: 'Severity',
      region: 'Region'
    },
    settings: {
      title: 'Settings',
      profile: 'Profile',
      notifications: 'Notifications',
      security: 'Security',
      privacy: 'Privacy',
      language: 'Language',
      theme: 'Theme',
      backend: 'Backend Configuration',
      about: 'About'
    },
    categories: {
      powerOutage: 'Power Outage',
      billingIssue: 'Billing Issue',
      serviceRequest: 'Service Request',
      technical: 'Technical Issue',
      maintenance: 'Maintenance',
      other: 'Other'
    },
    status: {
      open: 'Open',
      inProgress: 'In Progress',
      pending: 'Pending',
      resolved: 'Resolved',
      closed: 'Closed',
      cancelled: 'Cancelled'
    },
    priority: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent',
      critical: 'Critical'
    },
    notifications: {
      syncComplete: 'Sync Completed',
      syncCompleteMessage: 'Successfully synced {{count}} items',
      syncError: 'Sync Error',
      syncErrorMessage: 'Failed to sync {{count}} items'
    },
    offline: {
      banner: 'You are offline',
      pendingActions: 'pending actions',
      pending: 'pending',
      mode: 'Offline Mode'
    }
  },
  am: {
    common: {
      save: 'አስቀምጥ',
      cancel: 'ሰርዝ',
      delete: 'ሰርዝ',
      edit: 'አርም',
      create: 'ፍጠር',
      update: 'ዘምን',
      search: 'ፈልግ',
      filter: 'አጣራ',
      loading: 'በመጫን ላይ...',
      error: 'ስህተት',
      success: 'ተሳክቷል',
      warning: 'ማስጠንቀቂያ',
      info: 'መረጃ',
      yes: 'አዎ',
      no: 'አይ',
      back: 'ተመለስ',
      next: 'ቀጣይ',
      previous: 'ቀዳሚ',
      close: 'ዝጋ',
      refresh: 'አድስ',
      user: 'ተጠቃሚ'
    },
    auth: {
      login: 'ግባ',
      logout: 'ውጣ',
      username: 'የተጠቃሚ ስም',
      password: 'የይለፍ ቃል',
      email: 'ኢሜል',
      forgotPassword: 'የይለፍ ቃልዎን ረስተዋል?',
      loginError: 'የተሳሳተ መረጃ',
      loginSuccess: 'በተሳካ ሁኔታ ገብተዋል',
      loading: 'በመግባት ላይ...'
    },
    dashboard: {
      title: 'ዳሽቦርድ',
      totalComplaints: 'ጠቅላላ ቅሬታዎች',
      activeComplaints: 'እንቅስቃሴ ያላቸው ቅሬታዎች',
      resolvedComplaints: 'የተፈቱ ቅሬታዎች',
      averageResolutionTime: 'አማካይ የመፍትሄ ጊዜ',
      recentActivity: 'የቅርብ ጊዜ እንቅስቃሴ',
      systemStatus: 'የስርዓት ሁኔታ',
      quickActions: 'ፈጣን እርምጃዎች'
    },
    complaints: {
      title: 'ቅሬታዎች',
      newComplaint: 'አዲስ ቅሬታ',
      complaintDetails: 'የቅሬታ ዝርዝር',
      complaintId: 'የቅሬታ መለያ',
      customerName: 'የተጠቃሚ ስም',
      subject: 'ርዕሰ ጉዳይ',
      description: 'መግለጫ',
      status: 'ሁኔታ',
      priority: 'ቅድሚያ',
      assignedTo: 'የተመደበለት',
      createdAt: 'የተፈጠረበት ጊዜ',
      updatedAt: 'የተዘመነበት ጊዜ',
      category: 'ምድብ',
      subcategory: 'ንዑስ ምድብ',
      resolution: 'መፍትሄ',
      feedback: 'ግብረ መልስ',
      attachments: 'አባሪዎች'
    },
    users: {
      title: 'ተጠቃሚዎች',
      newUser: 'አዲስ ተጠቃሚ',
      userDetails: 'የተጠቃሚ ዝርዝር',
      name: 'ስም',
      role: 'ሚና',
      department: 'ክፍል',
      phone: 'ስልክ',
      status: 'ሁኔታ',
      lastLogin: 'የመጨረሻ መግቢያ',
      permissions: 'ፈቃዶች'
    },
    outages: {
      title: 'የመብራት መቆራረጥ',
      newOutage: 'አዲስ መቆራረጥ',
      outageDetails: 'የመቆራረጥ ዝርዝር',
      location: 'አካባቢ',
      affectedCustomers: 'ተጎጂ ተጠቃሚዎች',
      estimatedRestoration: 'የሚጠበቅ የመልሶ ማገኛ ጊዜ',
      cause: 'ምክንያት',
      severity: 'ክብደት',
      region: 'ክልል'
    },
    settings: {
      title: 'ቅንብሮች',
      profile: 'መገለጫ',
      notifications: 'ማሳወቂያዎች',
      security: 'ደህንነት',
      privacy: 'ግላዊነት',
      language: 'ቋንቋ',
      theme: 'ገጽታ',
      backend: 'የኋላ ክፍል ማዋቀር',
      about: 'ስለ'
    },
    categories: {
      powerOutage: 'የመብራት መቆራረጥ',
      billingIssue: 'የክፍያ ችግር',
      serviceRequest: 'የአገልግሎት ጥያቄ',
      technical: 'ቴክኒካል ችግር',
      maintenance: 'ጥገና',
      other: 'ሌላ'
    },
    status: {
      open: 'ክፍት',
      inProgress: 'በሂደት ላይ',
      pending: 'በመጠባበቅ ላይ',
      resolved: 'ተፈቷል',
      closed: 'ተዘግቷል',
      cancelled: 'ተሰርዟል'
    },
    priority: {
      low: 'ዝቅተኛ',
      medium: 'መካከለኛ',
      high: 'ከፍተኛ',
      urgent: 'አስቸኳይ',
      critical: 'ወሳኝ'
    },
    notifications: {
      syncComplete: 'ማመሳሰል ተጠናቅቋል',
      syncCompleteMessage: '{{count}} ንጥሎች በተሳካ ሁኔታ ተመሳስለዋል',
      syncError: 'የማመሳሰል ስህተት',
      syncErrorMessage: '{{count}} ንጥሎች ማመሳሰል አልተሳካም'
    },
    offline: {
      banner: 'ከመስመር ውጭ ነዎት',
      pendingActions: 'በመጠባበቅ ላይ ያሉ እርምጃዎች',
      pending: 'በመጠባበቅ ላይ',
      mode: 'ከመስመር ውጭ ሁኔታ'
    }
  }
};

export function useLanguage(): UseLanguageReturn {
  const [state, setState] = useState<LanguageState>({
    currentLanguage: 'en',
    isLoading: false,
    error: null,
    translations: defaultTranslations.en,
    availableLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' }
    ]
  });

  // Initialize language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
    if (savedLanguage && ['en', 'am'].includes(savedLanguage)) {
      setState(prev => ({
        ...prev,
        currentLanguage: savedLanguage,
        translations: defaultTranslations[savedLanguage]
      }));
    }
  }, []);

  const setLanguage = useCallback(async (language: Language) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate loading time for potential remote translations
      await new Promise(resolve => setTimeout(resolve, 100));

      setState(prev => ({
        ...prev,
        currentLanguage: language,
        translations: defaultTranslations[language],
        isLoading: false
      }));

      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      
      // Update document direction and language
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'am' ? 'ltr' : 'ltr'; // Amharic uses LTR
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load language'
      }));
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = state.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = defaultTranslations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return `[${key}]`; // Return key if no translation found
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return `[${key}]`;
    }

    // Replace parameters in the translation
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  }, [state.translations]);

  const formatDate = useCallback((
    date: Date | string, 
    format: 'short' | 'long' | 'time' = 'short'
  ): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const locale = state.currentLanguage === 'am' ? 'am-ET' : 'en-US';
    
    const options: Intl.DateTimeFormatOptions = {
      short: { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      },
      long: { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      },
      time: { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      }
    }[format];

    try {
      return new Intl.DateTimeFormat(locale, options).format(dateObj);
    } catch (error) {
      // Fallback to simple format
      return dateObj.toLocaleDateString();
    }
  }, [state.currentLanguage]);

  const formatNumber = useCallback((
    number: number, 
    format: 'currency' | 'percent' | 'decimal' = 'decimal'
  ): string => {
    const locale = state.currentLanguage === 'am' ? 'am-ET' : 'en-US';
    
    const options: Intl.NumberFormatOptions = {
      currency: { 
        style: 'currency', 
        currency: 'ETB' // Ethiopian Birr
      },
      percent: { 
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      },
      decimal: { 
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    }[format];

    try {
      return new Intl.NumberFormat(locale, options).format(number);
    } catch (error) {
      // Fallback to simple format
      return number.toString();
    }
  }, [state.currentLanguage]);

  const isRTL = state.currentLanguage === 'ar'; // Add if Arabic support is needed
  const getDirection = useCallback(() => isRTL ? 'rtl' : 'ltr', [isRTL]);

  return {
    ...state,
    setLanguage,
    t,
    formatDate,
    formatNumber,
    isRTL,
    getDirection
  };
}

// Language Context for provider pattern
export const LanguageContext = createContext<UseLanguageReturn | null>(null);

export function useLanguageContext(): UseLanguageReturn {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
}