import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' }
];

export const translations = {
  en: {
    // Nav
    nav_home: 'Home',
    nav_dashboard: 'Dashboard',
    nav_report: 'Report Issue',
    nav_admin: 'Admin',
    nav_login: 'Login',
    nav_signup: 'Sign Up',
    nav_logout: 'Logout',
    nav_language: 'Language',
    nav_select_lang: 'Select Language',
    nav_citizen: 'Citizen',

    // Home Hero
    hero_badge_intake: 'AI-Powered Municipal Intake Engine',
    hero_badge_dispatch: 'Real-Time Ward Dispatch',
    hero_title_1: 'Report Civic Issues.',
    hero_title_2: 'See Action in Hours.',
    hero_subtitle: 'Empowering citizens and city departments with automated photo analysis, verified GPS location boundaries, and legal grievance drafting for road hazards, sanitation, and utilities.',
    hero_cta_report: 'Report an Issue',
    hero_cta_dashboard: 'View Public Dashboard',
    hero_citizens_count: 'Joined by 8,000+ Active Citizens',
    hero_free_text: '100% Free · Direct municipal accountability',
    live_feed: 'Live Issue Feed',
    ward: 'Ward',
    status_pothole_detected: 'Pothole Detection',
    status_road_paved: 'Road Paved',
    status_ward_cleaned: 'Cleaned',
    status_resolved_24h: 'Resolved in 24h',
    legal_route: 'Official Municipal Route',
    legal_route_sub: 'Auto-drafted RTI petition',
    select_incident: 'SELECT LIVE INCIDENT VIDEO:',
    cat_roads: 'Roads',
    cat_sanitation: 'Sanitation',
    cat_streetlights: 'Streetlights',
    cat_drainage: 'Drainage',
    live_console_title: 'LIVE MUNICIPAL INCIDENT CONSOLE',
    live_console_badge: 'Certified Real-Time Feed',
    live_console_desc: 'Streaming incoming citizen reports with automated damage classification, geospatial GIS boundary validation, and real-time municipal routing.',

    // Dashboard
    dash_title: 'Civic Issue Dashboard',
    dash_subtitle: 'Real-time municipal complaints tracked and resolved across wards.',
    dash_stat_total: 'Total Complaints',
    dash_stat_review: 'Under Review',
    dash_stat_progress: 'In Progress',
    dash_stat_resolved: 'Resolved',
    dash_stat_high: 'High Priority',
    dash_breakdown_title: 'Issue Breakdown',
    dash_ward_desk_title: 'Municipal Ward Desk',
    dash_ward_desk_desc: 'Direct municipal routing is active. Standard high-priority resolution turnaround is under 48 hours.',
    dash_helpline: 'Civic Helpline:',
    dash_emergency: 'Emergency Services:',
    dash_file_grievance: 'File a New Grievance',
    dash_map_title: 'Live Ward Map',
    dash_map_desc: 'Real-time geographical distribution of civic grievances and department works.',
    dash_tab_all: 'All City Complaints',
    dash_tab_my: 'My Complaints',
    dash_filter_label: 'Filter:',
    dash_filter_all: 'All',
    dash_filter_high: 'High',
    dash_filter_medium: 'Medium',
    dash_filter_resolved: 'Resolved',
    dash_showing: 'showing',
    dash_no_complaints: 'No complaints found in this category.',
    dash_edit_title: 'Edit Complaint',
    dash_issue_title: 'Issue Title / Defect Type',
    dash_description: 'Description',
    dash_delete_title: 'Delete Complaint',
    dash_delete_confirm: 'Are you sure you want to remove this complaint? It will be permanently removed from the city dashboard.',
    dash_keep: 'Keep Complaint',
    dash_delete_perm: 'Delete Permanently',
    dash_save: 'Save Changes',
    dash_cancel: 'Cancel',

    // Card
    card_pothole: 'Pothole',
    card_garbage: 'Garbage',
    card_streetlight: 'Streetlight',
    card_water: 'Water Leakage',
    card_drainage: 'Drainage',
    card_status_submitted: 'Submitted',
    card_status_review: 'Under Review',
    card_status_progress: 'In Progress',
    card_status_resolved: 'Resolved',
    card_edit: 'Edit',
    card_pdf: 'PDF',
    card_delete: 'Delete',
    card_add_issue: 'Add Issue',

    // Details Page
    details_back: 'Back',
    details_priority: 'Priority',
    details_download_pdf: 'Download Petition PDF',
    details_before: 'Before',
    details_after: 'After (Resolved) ✨',
    details_enlarge: 'Click to Enlarge',
    details_ward_desk: 'Municipal Ward & Routing Desk',
    details_authority: 'Authority',
    details_department: 'Department',
    details_location: 'Location:',
    details_support_title: 'Support this Civic Issue',
    details_support_desc: 'Upvotes flag issues to municipal officers with higher priority.',
    details_support_active: 'You supported this issue! Upvotes prioritize ward action.',
    details_supported: 'Supported',
    details_support_btn: 'Support',
    details_hero_title: 'Solved by Community Hero',
    details_hero_sub: 'resolved this issue for the community!',
    details_hero_auth: 'Resolved by Municipal Authority',
    details_hero_auth_desc: 'This issue was officially inspected and resolved by municipal teams.',
    details_did_you_solve: 'Did you solve this?',
    details_did_you_solve_desc: 'If you or the community fixed this, claim credit as a Community Hero!',
    details_claim_btn: 'I Solved This!',
    details_lifecycle: 'Resolution Lifecycle',
    details_letter_title: 'Formal Complaint Letter',
    details_translated_title: 'Translated Regional Version',
    details_citizen_updates: 'Citizen Activity & Updates',

    // StatusTracker
    track_submitted: 'Submitted',
    track_review: 'Under Review',
    track_progress: 'In Progress',
    track_resolved: 'Resolved'
  },

  mr: {
    // Nav
    nav_home: 'मुख्यपृष्ठ',
    nav_dashboard: 'डॅशबोर्ड',
    nav_report: 'तक्रार नोंदवा',
    nav_admin: 'प्रशासक',
    nav_login: 'लॉगिन',
    nav_signup: 'नोंदणी करा',
    nav_logout: 'बाहेर पडा',
    nav_language: 'भाषा',
    nav_select_lang: 'भाषा निवडा',
    nav_citizen: 'नागरिक',

    // Home Hero
    hero_badge_intake: 'एआय-सक्षम नगरपालिका प्रणाली',
    hero_badge_dispatch: 'थेट प्रभाग डिस्पॅच',
    hero_title_1: 'नागरी समस्यांची तक्रार करा.',
    hero_title_2: 'तासांत कारवाई पहा.',
    hero_subtitle: 'रस्त्यांचे खड्डे, स्वच्छता आणि वीज-पाणी यांसारख्या समस्यांसाठी स्वयंचलित फोटो विश्लेषण, जीपीएस स्थान आणि कायदेशीर तक्रार मसुद्यासह नागरिक आणि महापालिकेला सक्षम बनवत आहे.',
    hero_cta_report: 'तक्रार नोंदवा',
    hero_cta_dashboard: 'सार्वजनिक डॅशबोर्ड पहा',
    hero_citizens_count: '८,०००+ सक्रिय नागरिकांचा सहभाग',
    hero_free_text: '१००% मोफत · थेट महापालिका उत्तरदायित्व',
    live_feed: 'थेट तक्रार फीड',
    ward: 'प्रभाग',
    status_pothole_detected: 'खड्डा ओळखला (९८.४%)',
    status_road_paved: 'रस्ता डांबरीकरण पूर्ण',
    status_ward_cleaned: 'प्रभाग ०८ स्वच्छता पूर्ण',
    status_resolved_24h: '२४ तासांत निवारण',
    legal_route: 'अधिकृत महापालिका मार्ग',
    legal_route_sub: 'स्वयंचलित माहिती अधिकार मसुदा',
    select_incident: 'थेट घटनेचा व्हिडिओ निवडा:',
    cat_roads: 'रस्ते',
    cat_sanitation: 'स्वच्छता',
    cat_streetlights: 'पथदिवे',
    cat_drainage: 'सांडपाणी',
    live_console_title: 'थेट महापालिका नियंत्रण कक्ष',
    live_console_badge: 'प्रमाणित थेट फीड',
    live_console_desc: 'स्वयंचलित नुकसान वर्गीकरण, जीआयएस सीमा प्रमाणीकरण आणि थेट महापालिका मार्गासह नागरिकांच्या तक्रारींचे थेट प्रवाह.',

    // Dashboard
    dash_title: 'नागरी तक्रार डॅशबोर्ड',
    dash_subtitle: 'प्रभागनिहाय नागरी तक्रारींचा थेट मागोवा आणि निवारण.',
    dash_stat_total: 'एकूण तक्रारी',
    dash_stat_review: 'पुनरावलोकनात',
    dash_stat_progress: 'प्रगतीपथावर',
    dash_stat_resolved: 'निवारण झाले',
    dash_stat_high: 'तात्काळ प्राधान्य',
    dash_breakdown_title: 'समस्यांचे वर्गीकरण',
    dash_ward_desk_title: 'महापालिका प्रभाग कक्ष',
    dash_ward_desk_desc: 'थेट महापालिका संपर्क सक्रिय आहे. तात्काळ तक्रारींचे निवारण ४८ तासांच्या आत केले जाते.',
    dash_helpline: 'नागरी हेल्पलाइन:',
    dash_emergency: 'आपत्कालीन सेवा:',
    dash_file_grievance: 'नवीन तक्रार नोंदवा',
    dash_map_title: 'थेट प्रभाग नकाशा',
    dash_map_desc: 'नागरी समस्या आणि महापालिका कामांचे थेट नकाशावरील भौगोलिक वितरण.',
    dash_tab_all: 'शहरातील सर्व तक्रारी',
    dash_tab_my: 'माझ्या तक्रारी',
    dash_filter_label: 'फिल्टर:',
    dash_filter_all: 'सर्व',
    dash_filter_high: 'तात्काळ',
    dash_filter_medium: 'मध्यम',
    dash_filter_resolved: 'निवारण झाले',
    dash_showing: 'दाखवत आहे',
    dash_no_complaints: 'या श्रेणीत कोणतीही तक्रार आढळली नाही.',
    dash_edit_title: 'तक्रार संपादित करा',
    dash_issue_title: 'समस्येचे नाव / दोष प्रकार',
    dash_description: 'तपशीलवार वर्णन',
    dash_delete_title: 'तक्रार हटवा',
    dash_delete_confirm: 'तुम्हाला ही तक्रार कायमची काढून टाकायची आहे का? ही डॅशबोर्डवरून कायमची हटवली जाईल.',
    dash_keep: 'तक्रार ठेवा',
    dash_delete_perm: 'कायमचे हटवा',
    dash_save: 'बदल जतन करा',
    dash_cancel: 'रद्द करा',

    // Card
    card_pothole: 'रस्त्यावरील खड्डा',
    card_garbage: 'कचरा व स्वच्छता',
    card_streetlight: 'बंद पथदिवा',
    card_water: 'पाणी गळती',
    card_drainage: 'सांडपाणी वाहिनी',
    card_status_submitted: 'नोंदवली',
    card_status_review: 'पुनरावलोकनात',
    card_status_progress: 'प्रगतीपथावर',
    card_status_resolved: 'निवारण झाले',
    card_edit: 'संपादित',
    card_pdf: 'PDF',
    card_delete: 'हटवा',
    card_add_issue: 'अपडेट जोडा',

    // Details Page
    details_back: 'मागे जा',
    details_priority: 'प्राधान्य',
    details_download_pdf: 'तक्रार अर्ज PDF डाउनलोड करा',
    details_before: 'आधीची स्थिती',
    details_after: 'निवारणानंतर (दुरुस्त) ✨',
    details_enlarge: 'मोठे करून पहा',
    details_ward_desk: 'महापालिका प्रभाग कक्ष व संपर्क',
    details_authority: 'प्राधिकरण',
    details_department: 'विभाग',
    details_location: 'स्थान:',
    details_support_title: 'या नागरी समस्येला पाठिंबा द्या',
    details_support_desc: 'नागरिकांच्या पाठिंब्यामुळे अधिकारी या समस्येला सर्वोच्च प्राधान्य देतात.',
    details_support_active: 'तुम्ही या समस्येला पाठिंबा दिला आहे!',
    details_supported: 'पाठिंबा दिला',
    details_support_btn: 'पाठिंबा द्या',
    details_hero_title: 'नागरिक वीराने सोडवले',
    details_hero_sub: 'यांनी ही समस्या समाजासाठी सोडवली!',
    details_hero_auth: 'महापालिकेने निवारण केले',
    details_hero_auth_desc: 'महापालिकेच्या संबंधित पथकाने प्रत्यक्ष पाहणी करून काम यशस्वीरीत्या पूर्ण केले.',
    details_did_you_solve: 'तुम्ही ही समस्या सोडवली का?',
    details_did_you_solve_desc: 'जर तुम्ही किंवा नागरिकांनी मिळून ही समस्या सोडवली असेल, तर नोंद करा!',
    details_claim_btn: 'मी हे सोडवले!',
    details_lifecycle: 'तक्रार निवारण प्रक्रिया',
    details_letter_title: 'अधिकृत तक्रार अर्ज (RTI याचिका)',
    details_translated_title: 'प्रादेशिक भाषांतरित आवृत्ती',
    details_citizen_updates: 'नागरिकांचे ताजे अपडेट्स',

    // StatusTracker
    track_submitted: 'नोंदवली',
    track_review: 'पुनरावलोकन',
    track_progress: 'प्रगतीपथावर',
    track_resolved: 'निवारण झाले'
  },

  hi: {
    // Nav
    nav_home: 'होम',
    nav_dashboard: 'डैशबोर्ड',
    nav_report: 'समस्या दर्ज करें',
    nav_admin: 'प्रशासक',
    nav_login: 'लॉगिन',
    nav_signup: 'साइन अप',
    nav_logout: 'लॉगआउट',
    nav_language: 'भाषा',
    nav_select_lang: 'भाषा चुनें',
    nav_citizen: 'नागरिक',

    // Home Hero
    hero_badge_intake: 'एआई-संचालित नगरपालिका प्रणाली',
    hero_badge_dispatch: 'रीयल-टाइम वार्ड डिस्पैच',
    hero_title_1: 'नागरिक समस्याओं की शिकायत दर्ज करें।',
    hero_title_2: 'घंटों में समाधान देखें।',
    hero_subtitle: 'सड़क के गड्ढे, स्वच्छता और बिजली जैसी समस्याओं के लिए स्वचालित फोटो विश्लेषण, सत्यापित जीपीएस स्थान और कानूनी शिकायत मसौदे के साथ नागरिकों और नगर निगम को सशक्त बनाना।',
    hero_cta_report: 'समस्या दर्ज करें',
    hero_cta_dashboard: 'सार्वजनिक डैशबोर्ड देखें',
    hero_citizens_count: '८,०००+ सक्रिय नागरिकों द्वारा उपयोग',
    hero_free_text: '१००% निःशुल्क · सीधा नगर निगम उत्तरदायित्व',
    live_feed: 'लाइव समस्या फीड',
    ward: 'वार्ड',
    status_pothole_detected: 'गड्ढा पहचाना गया (९८.४%)',
    status_road_paved: 'सड़क निर्माण पूरा',
    status_ward_cleaned: 'वार्ड ०८ सफाई पूरी',
    status_resolved_24h: '२४ घंटे में समाधान',
    legal_route: 'आधिकारिक नगर पालिका मार्ग',
    legal_route_sub: 'स्वचालित आरटीआई याचिका',
    select_incident: 'लाइव घटना वीडियो चुनें:',
    cat_roads: 'सड़कें',
    cat_sanitation: 'सफाई',
    cat_streetlights: 'स्ट्रीट लाइट',
    cat_drainage: 'जल निकासी',
    live_console_title: 'लाइव नगर निगम नियंत्रण कक्ष',
    live_console_badge: 'प्रमाणित लाइव फीड',
    live_console_desc: 'स्वचालित क्षति वर्गीकरण, जीआईएस सीमा सत्यापन और लाइव नगरपालिका रूटिंग के साथ नागरिक शिकायतों का सीधा प्रसारण।',

    // Dashboard
    dash_title: 'नागरिक शिकायत डैशबोर्ड',
    dash_subtitle: 'वार्ड-वार नागरिक शिकायतों की लाइव ट्रैकिंग और समाधान।',
    dash_stat_total: 'कुल शिकायतें',
    dash_stat_review: 'समीक्षा में',
    dash_stat_progress: 'प्रगति पर',
    dash_stat_resolved: 'समाधान हुआ',
    dash_stat_high: 'उच्च प्राथमिकता',
    dash_breakdown_title: 'समस्याओं का विवरण',
    dash_ward_desk_title: 'नगर निगम वार्ड डेस्क',
    dash_ward_desk_desc: 'सीधा नगर निगम रूटिंग सक्रिय है। उच्च प्राथमिकता शिकायतों का समाधान ४८ घंटे के भीतर होता है।',
    dash_helpline: 'नागरिक हेल्पलाइन:',
    dash_emergency: 'आपातकालीन सेवाएं:',
    dash_file_grievance: 'नई शिकायत दर्ज करें',
    dash_map_title: 'लाइव वार्ड मानचित्र',
    dash_map_desc: 'नागरिक समस्याओं और नगरपालिका कार्यों का लाइव भौगोलिक वितरण।',
    dash_tab_all: 'शहर की सभी शिकायतें',
    dash_tab_my: 'मेरी शिकायतें',
    dash_filter_label: 'फिल्टर:',
    dash_filter_all: 'सभी',
    dash_filter_high: 'अति आवश्यक',
    dash_filter_medium: 'मध्यम',
    dash_filter_resolved: 'समाधान हुआ',
    dash_showing: 'प्रदर्शित',
    dash_no_complaints: 'इस श्रेणी में कोई शिकायत नहीं मिली।',
    dash_edit_title: 'शिकायत संपादित करें',
    dash_issue_title: 'समस्या का शीर्षक / दोष प्रकार',
    dash_description: 'विस्तृत विवरण',
    dash_delete_title: 'शिकायत हटाएं',
    dash_delete_confirm: 'क्या आप वाकई इस शिकायत को हटाना चाहते हैं? यह डैशबोर्ड से हमेशा के लिए हटा दी जाएगी।',
    dash_keep: 'शिकायत रखें',
    dash_delete_perm: 'हमेशा के लिए हटाएं',
    dash_save: 'बदलाव सहेजें',
    dash_cancel: 'रद्द करें',

    // Card
    card_pothole: 'सड़क का गड्ढा',
    card_garbage: 'कचरा व गंदगी',
    card_streetlight: 'खराब स्ट्रीट लाइट',
    card_water: 'पानी का रिसाव',
    card_drainage: 'नाली अवरोध',
    card_status_submitted: 'दर्ज हुई',
    card_status_review: 'समीक्षा में',
    card_status_progress: 'प्रगति पर',
    card_status_resolved: 'समाधान हुआ',
    card_edit: 'संपादित करें',
    card_pdf: 'PDF',
    card_delete: 'हटाएं',
    card_add_issue: 'अपडेट जोड़ें',

    // Details Page
    details_back: 'वापस जाएं',
    details_priority: 'प्राथमिकता',
    details_download_pdf: 'याचिका PDF डाउनलोड करें',
    details_before: 'पहले की स्थिति',
    details_after: 'समाधान के बाद ✨',
    details_enlarge: 'बड़ा करके देखें',
    details_ward_desk: 'नगर निगम वार्ड डेस्क व संपर्क',
    details_authority: 'प्राधिकरण',
    details_department: 'विभाग',
    details_location: 'स्थान:',
    details_support_title: 'इस नागरिक समस्या का समर्थन करें',
    details_support_desc: 'नागरिकों के समर्थन से अधिकारी इस समस्या को उच्च प्राथमिकता पर हल करते हैं।',
    details_support_active: 'आपने इस समस्या का समर्थन किया है!',
    details_supported: 'समर्थित',
    details_support_btn: 'समर्थन दें',
    details_hero_title: 'कम्युनिटी हीरो द्वारा हल किया गया',
    details_hero_sub: 'ने समुदाय के लिए इस समस्या का समाधान किया!',
    details_hero_auth: 'नगर निगम द्वारा समाधान किया गया',
    details_hero_auth_desc: 'नगर निगम की टीम द्वारा मौके पर निरीक्षण कर कार्य सफलतापूर्वक पूरा किया गया।',
    details_did_you_solve: 'क्या आपने इसे हल किया?',
    details_did_you_solve_desc: 'यदि आपने या नागरिकों ने मिलकर इसे ठीक किया, तो कम्युनिटी हीरो के रूप में श्रेय लें!',
    details_claim_btn: 'मैंने इसे हल किया!',
    details_lifecycle: 'समाधान जीवनचक्र',
    details_letter_title: 'औपचारिक शिकायत पत्र (RTI याचिका)',
    details_translated_title: 'क्षेत्रीय अनुवाद',
    details_citizen_updates: 'नागरिक गतिविधि व अपडेट्स',

    // StatusTracker
    track_submitted: 'दर्ज हुई',
    track_review: 'समीक्षा',
    track_progress: 'प्रगति पर',
    track_resolved: 'समाधान हुआ'
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('civic_lang') || 'en';
  });

  const changeLanguage = (langCode) => {
    if (langCode === currentLang) return;
    setCurrentLang(langCode);
    localStorage.setItem('civic_lang', langCode);
  };

  const t = (key, fallback = '') => {
    const langDict = translations[currentLang] || translations.en;
    if (langDict && langDict[key]) return langDict[key];
    if (translations.en && translations.en[key]) return translations.en[key];
    return fallback || key;
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
