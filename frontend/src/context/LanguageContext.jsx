import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LanguageContext = createContext();

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', label: 'English' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', label: 'मराठी (Marathi)' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', label: 'हिंदी (Hindi)' }
];

export const translations = {
  en: {
    language: 'Language',
    home: 'Home',
    dashboard: 'Dashboard',
    report_issue: 'Report Issue',
    admin: 'Admin',
    login: 'Login',
    sign_up: 'Sign Up',
    logout: 'Logout',
    all_complaints: 'All City Complaints',
    my_complaints: 'My Complaints',
    filter_all: 'All',
    filter_high: 'High',
    filter_medium: 'Medium',
    filter_resolved: 'Resolved',
    resolved: 'Resolved',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    under_review: 'Under Review',
    high_priority: 'High Priority',
    view_details: 'View Details',
    edit: 'Edit',
    delete: 'Delete',
    download_pdf: 'Download PDF',
    support_issue: 'Support this issue',
    supported: 'Supported',
    support: 'Support',
    back: 'Back',
    save_changes: 'Save Changes',
    cancel: 'Cancel',
    confirm_delete: 'Delete Permanently',
    claim_resolution: 'I Solved This!'
  },
  mr: {
    language: 'भाषा',
    home: 'मुख्यपृष्ठ',
    dashboard: 'डॅशबोर्ड',
    report_issue: 'तक्रार नोंदवा',
    admin: 'प्रशासक',
    login: 'लॉगिन',
    sign_up: 'नोंदणी करा',
    logout: 'बाहेर पडा',
    all_complaints: 'शहरातील सर्व तक्रारी',
    my_complaints: 'माझ्या तक्रारी',
    filter_all: 'सर्व',
    filter_high: 'तात्काळ',
    filter_medium: 'मध्यम',
    filter_resolved: 'निराकरण झाले',
    resolved: 'निराकरण झाले',
    in_progress: 'प्रगतीपथावर',
    submitted: 'नोंदवली',
    under_review: 'पुनरावलोकनात',
    high_priority: 'उच्च प्राधान्य',
    view_details: 'तपशील पहा',
    edit: 'संपादित करा',
    delete: 'हटवा',
    download_pdf: 'PDF डाउनलोड करा',
    support_issue: 'या समस्येला पाठिंबा द्या',
    supported: 'पाठिंबा दिला',
    support: 'पाठिंबा',
    back: 'मागे जा',
    save_changes: 'बदल जतन करा',
    cancel: 'रद्द करा',
    confirm_delete: 'कायमचे हटवा',
    claim_resolution: 'मी हे सोडवले!'
  },
  hi: {
    language: 'भाषा',
    home: 'होम',
    dashboard: 'डैशबोर्ड',
    report_issue: 'समस्या दर्ज करें',
    admin: 'व्यवस्थापक',
    login: 'लॉगिन',
    sign_up: 'साइन अप',
    logout: 'लॉगआउट',
    all_complaints: 'शहर की सभी शिकायतें',
    my_complaints: 'मेरी शिकायतें',
    filter_all: 'सभी',
    filter_high: 'अति आवश्यक',
    filter_medium: 'मध्यम',
    filter_resolved: 'समाधान हुआ',
    resolved: 'समाधान हुआ',
    in_progress: 'कार्य प्रगति पर',
    submitted: 'दर्ज हुई',
    under_review: 'समीक्षा में',
    high_priority: 'उच्च प्राथमिकता',
    view_details: 'विवरण देखें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    download_pdf: 'PDF डाउनलोड करें',
    support_issue: 'इस समस्या का समर्थन करें',
    supported: 'समर्थित',
    support: 'समर्थन दें',
    back: 'वापस जाएं',
    save_changes: 'बदलाव सहेजें',
    cancel: 'रद्द करें',
    confirm_delete: 'हमेशा के लिए हटाएं',
    claim_resolution: 'मैंने यह हल किया!'
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('civic_lang') || 'en';
  });

  const applyGoogleTranslate = useCallback((langCode) => {
    const hostname = window.location.hostname;
    
    // Set googtrans cookie for domain & root
    if (langCode === 'en') {
      document.cookie = 'googtrans=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = `googtrans=; Path=/; Domain=${hostname}; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      document.cookie = 'googtrans=/en/en; Path=/;';
    } else {
      document.cookie = `googtrans=/en/${langCode}; Path=/;`;
      document.cookie = `googtrans=/en/${langCode}; Path=/; Domain=${hostname};`;
    }

    // Attempt triggering Google Translate Select Combo
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
    }
  }, []);

  // Sync with Google Translate on mount if saved language is not English
  useEffect(() => {
    const saved = localStorage.getItem('civic_lang');
    if (saved && saved !== 'en') {
      applyGoogleTranslate(saved);
      // Retry in case Google Translate widget initializes after React mount
      const timer = setTimeout(() => {
        applyGoogleTranslate(saved);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [applyGoogleTranslate]);

  const changeLanguage = (langCode) => {
    if (langCode === currentLang) return;
    setCurrentLang(langCode);
    localStorage.setItem('civic_lang', langCode);

    applyGoogleTranslate(langCode);

    // If Google Translate combo is ready, trigger it; otherwise reload to apply cookie globally
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
    } else {
      setTimeout(() => {
        const retrySelect = document.querySelector('.goog-te-combo');
        if (retrySelect) {
          retrySelect.value = langCode;
          retrySelect.dispatchEvent(new Event('change'));
        } else {
          window.location.reload();
        }
      }, 300);
    }
  };

  const t = (key) => {
    const langDict = translations[currentLang] || translations.en;
    return langDict[key] || translations.en[key] || key;
  };

  const activeLanguage = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ currentLang, changeLanguage, activeLanguage, languages: LANGUAGES, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
