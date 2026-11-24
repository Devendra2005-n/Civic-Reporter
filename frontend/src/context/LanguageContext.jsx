import { createContext, useContext, useState, useEffect, useRef } from 'react';

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
    nav_portal: 'Citizen Portal',
    nav_notifications: 'Notifications',
    nav_no_notif: 'No new notifications',

    // Stepper & Submit
    step_upload: 'Upload',
    step_analyze: 'Analyze',
    step_submit: 'Submit',
    submit_upload_sub: 'Upload a photo, and our AI will document the rest.',

    // Dashboard Header & Stats
    dash_title: 'Civic Issue Dashboard',
    dash_subtitle: 'Real-time municipal complaints tracked and resolved across wards.',
    dash_welcome: 'Welcome back,',
    dash_welcome_sub: "Let's make your community a better, cleaner, and safer place.",
    dash_create_report: 'Create Report',
    dash_report_card_title: 'Report a Civic Issue',
    dash_report_card_desc: 'Spotted a pothole, open garbage dump, broken streetlight, or drainage issue? Help improve your city by reporting it.',
    dash_report_now: 'Report Now',
    dash_stat_total: 'Total Complaints',
    dash_stat_review: 'Under Review',
    dash_stat_progress: 'In Progress',
    dash_stat_resolved: 'Resolved',
    dash_stat_high: 'High Priority',
    dash_high_notice: 'High Priority issue(s) require urgent attention from city municipal engineers.',
    dash_filter_high_btn: 'Filter High Priority',

    // Breakdown & Ward Desk
    dash_breakdown_title: 'Issue Breakdown',
    dash_cat_roads: 'Roads & Potholes',
    dash_cat_streetlights: 'Streetlights',
    dash_cat_waste: 'Waste & Sanitation',
    dash_cat_water: 'Water & Drainage',
    dash_ward_desk_title: 'Municipal Ward Desk',
    dash_ward_active: 'Active',
    dash_ward_desk_desc: 'Direct municipal routing is active. Standard high-priority resolution turnaround is under 48 hours.',
    dash_helpline: 'Civic Helpline:',
    dash_emergency: 'Emergency Services:',
    dash_file_grievance: 'File a New Grievance',

    // Map & Tabs
    dash_map_title: 'Live Ward Map',
    dash_map_desc: 'Real-time geographical distribution of civic grievances and department works.',
    dash_map_hint: 'Click any pin on the map to preview report details.',
    dash_tab_all: 'All City Complaints',
    dash_tab_my: 'My Complaints',
    dash_filter_label: 'Filter:',
    dash_filter_all: 'All',
    dash_filter_high: 'High',
    dash_filter_medium: 'Medium',
    dash_filter_resolved: 'Resolved',
    dash_showing: 'showing',
    dash_complaints: 'complaints',
    dash_no_complaints: 'No complaints found in this category.',

    // Edit & Delete Modals
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
    card_status_rejected: 'Rejected',
    card_edit: 'Edit',
    card_pdf: 'PDF',
    card_delete: 'Delete',
    card_add_issue: 'Add Issue',
    card_loc_avail: 'Location details available',

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
    details_no_letter: 'No formal petition text recorded.',

    // StatusTracker
    track_submitted: 'Submitted',
    track_review: 'Under Review',
    track_progress: 'In Progress',
    track_resolved: 'Resolved',

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

    // Home Stats, Categories & Workflows
    home_stat_resolved: 'Issues Resolved',
    home_stat_resolved_sub: 'Across 65+ municipal wards',
    home_stat_rate: 'Resolution Rate',
    home_stat_rate_sub: 'Within 7 business days',
    home_stat_resp: 'Avg. First Response',
    home_stat_resp_sub: 'Direct municipal intake',
    home_stat_pet: 'Automated Petitions',
    home_stat_pet_sub: 'Formal local language letters',
    cat_roads_potholes: 'Roads & Potholes',
    cat_roads_desc: 'Potholes, broken asphalt, uneven road surfaces, missing manhole covers.',
    cat_waste_sanitation: 'Waste & Sanitation',
    cat_waste_desc: 'Overflowing dumpsters, public littering, uncollected residential waste.',
    cat_streetlights_poles: 'Streetlights & Poles',
    cat_streetlights_desc: 'Dark road stretches, blinking lamps, hazardous exposed electrical cables.',
    cat_water_pipelines: 'Water & Pipelines',
    cat_water_desc: 'Burst supply mains, low pressure, contaminated municipal drinking water.',
    cat_drainage_sewage: 'Drainage & Sewage',
    cat_drainage_desc: 'Blocked storm gutters, stagnant rainwater, overflowing sewer lines.',
    cat_public_hazards: 'Public Hazards',
    cat_public_desc: 'Illegal encroachments, damaged footpaths, fallen branches, safety hazards.',
    wf_step1_title: 'Snap & Instant Detection',
    wf_step1_desc: 'Take a quick photo of the issue. Our integrated vision model instantly classifies the defect category, extracts verified GPS coordinates, and assigns severity.',
    wf_step1_badge: 'Vision AI & EXIF Verification',
    wf_step2_title: 'Automated Authority Routing',
    wf_step2_desc: 'Our engine identifies the jurisdictional body—Gram Panchayat, Municipal Council, or Corporation—and auto-generates a standardized formal petition in 13 languages.',
    wf_step2_badge: 'Auto Legal Letter Generator',
    wf_step3_title: 'Transparent Public Tracking',
    wf_step3_desc: 'Follow the progress in real time with an open audit timeline. Fellow citizens can upvote urgent reports, and authorities submit before/after photographic proof of resolution.',
    wf_step3_badge: 'Verified Before & After Closure'
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
    nav_portal: 'नागरिक पोर्टल',
    nav_notifications: 'सूचना',
    nav_no_notif: 'नवीन सूचना नाहीत',

    // Stepper & Submit
    step_upload: 'फोटो अपलोड',
    step_analyze: 'तपासणी',
    step_submit: 'तक्रार सादर',
    submit_upload_sub: 'समस्येचा फोटो अपलोड करा, उर्वरित काम आमचे एआय करेल.',

    // Dashboard Header & Stats
    dash_title: 'नागरी तक्रार डॅशबोर्ड',
    dash_subtitle: 'प्रभागनिहाय नागरी तक्रारींचा थेट मागोवा आणि जलद निवारण.',
    dash_welcome: 'स्वागत आहे,',
    dash_welcome_sub: 'आपला परिसर अधिक स्वच्छ, सुरक्षित व सुंदर बनवूया.',
    dash_create_report: 'तक्रार नोंदवा',
    dash_report_card_title: 'नागरी समस्येची तक्रार करा',
    dash_report_card_desc: 'रस्त्यावरील खड्डा, कचरा साचणे, बंद पथदिवा किंवा सांडपाण्याची समस्या आढळली? फोटो काढून त्वरित तक्रार नोंदवा.',
    dash_report_now: 'आत्ताच नोंदवा',
    dash_stat_total: 'एकूण तक्रारी',
    dash_stat_review: 'पुनरावलोकनात',
    dash_stat_progress: 'प्रगतीपथावर',
    dash_stat_resolved: 'निवारण झाले',
    dash_stat_high: 'तात्काळ प्राधान्य',
    dash_high_notice: 'तात्काळ प्राधान्य समस्यांवर महापालिका अभियंत्यांनी त्वरित लक्ष देणे आवश्यक आहे.',
    dash_filter_high_btn: 'तात्काळ समस्या फिल्टर करा',

    // Breakdown & Ward Desk
    dash_breakdown_title: 'समस्यांचे वर्गीकरण',
    dash_cat_roads: 'रस्ते व खड्डे',
    dash_cat_streetlights: 'पथदिवे',
    dash_cat_waste: 'कचरा व स्वच्छता',
    dash_cat_water: 'पाणी व सांडपाणी',
    dash_ward_desk_title: 'महापालिका प्रभाग कक्ष',
    dash_ward_active: 'सक्रिय',
    dash_ward_desk_desc: 'थेट महापालिका संपर्क सक्रिय आहे. तात्काळ तक्रारींचे निवारण ४८ तासांच्या आत केले जाते.',
    dash_helpline: 'नागरी हेल्पलाइन:',
    dash_emergency: 'आपत्कालीन सेवा:',
    dash_file_grievance: 'नवीन तक्रार नोंदवा',

    // Map & Tabs
    dash_map_title: 'थेट प्रभाग नकाशा',
    dash_map_desc: 'नागरी समस्या आणि महापालिका कामांचे थेट नकाशावरील भौगोलिक वितरण.',
    dash_map_hint: 'तपशील पाहण्यासाठी नकाशावरील कोणत्याही पिनवर क्लिक करा.',
    dash_tab_all: 'शहरातील सर्व तक्रारी',
    dash_tab_my: 'माझ्या तक्रारी',
    dash_filter_label: 'फिल्टर:',
    dash_filter_all: 'सर्व',
    dash_filter_high: 'तात्काळ',
    dash_filter_medium: 'मध्यम',
    dash_filter_resolved: 'निवारण झाले',
    dash_showing: 'दाखवत आहे',
    dash_complaints: 'तक्रारी',
    dash_no_complaints: 'या श्रेणीत कोणतीही तक्रार आढळली नाही.',

    // Edit & Delete Modals
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
    card_status_rejected: 'नाकारली',
    card_edit: 'संपादित',
    card_pdf: 'PDF',
    card_delete: 'हटवा',
    card_add_issue: 'अपडेट जोडा',
    card_loc_avail: 'स्थान तपशील उपलब्ध',

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
    details_no_letter: 'कोणताही अधिकृत अर्ज उपलब्ध नाही.',

    // StatusTracker
    track_submitted: 'नोंदवली',
    track_review: 'पुनरावलोकन',
    track_progress: 'प्रगतीपथावर',
    track_resolved: 'निवारण झाले',

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

    // Home Stats, Categories & Workflows
    home_stat_resolved: 'सोडवलेल्या समस्या',
    home_stat_resolved_sub: '६५+ प्रभाग क्षेत्रात',
    home_stat_rate: 'निवारण दर',
    home_stat_rate_sub: '७ कार्यालयीन दिवसांत',
    home_stat_resp: 'सरासरी पहिला प्रतिसाद',
    home_stat_resp_sub: 'थेट महापालिका संपर्क',
    home_stat_pet: 'स्वयंचलित कायदेशीर अर्ज',
    home_stat_pet_sub: 'स्थानिक भाषेतील अधिकृत अर्ज',
    cat_roads_potholes: 'रस्ते व खड्डे',
    cat_roads_desc: 'खड्डे, उखडलेला डांबर, खडबडीत रस्ते आणि उघडी मॅनहोल झाकणे.',
    cat_waste_sanitation: 'कचरा व स्वच्छता',
    cat_waste_desc: 'कचऱ्याचे ढीग, उघड्यावरील कचरा आणि न उचललेला घरगुती कचरा.',
    cat_streetlights_poles: 'पथदिवे व खांब',
    cat_streetlights_desc: 'अंधारे रस्ते, लुकलुकणारे पथदिवे आणि उघड्या धोकादायक वीज तारा.',
    cat_water_pipelines: 'पाणी व जलवाहिन्या',
    cat_water_desc: 'फुटलेली मुख्य जलवाहिनी, कमी पाण्याचा दाब आणि दूषित पिण्याचे पाणी.',
    cat_drainage_sewage: 'सांडपाणी व गटारे',
    cat_drainage_desc: 'तुंबलेली गटारे, साचलेले पावसाचे पाणी आणि ओव्हरफ्लो होणाऱ्या सांडपाणी वाहिन्या.',
    cat_public_hazards: 'सार्वजनिक धोके',
    cat_public_desc: 'अनधिकृत अतिक्रमणे, तुटलेले पदपथ, पडलेल्या झाडांच्या फांद्या आणि सुरक्षिततेचे धोके.',
    wf_step1_title: 'फोटो आणि त्वरित ओळख',
    wf_step1_desc: 'समस्येचा एक फोटो काढा. आमचे एआय मॉडेल त्वरित समस्येचा प्रकार ठरवते, जीपीएस स्थान मिळवते आणि तीव्रता निश्चित करते.',
    wf_step1_badge: 'व्हिजन एआय व जीपीएस पडताळणी',
    wf_step2_title: 'स्वयंचलित महापालिका मार्गक्रमण',
    wf_step2_desc: 'आमची प्रणाली संबंधित स्थानिक संस्था—ग्रामपंचायत, नगरपरिषद किंवा महानगरपालिका—ओळखते आणि १३ भाषांमध्ये अधिकृत अर्ज तयार करते.',
    wf_step2_badge: 'स्वयंचलित कायदेशीर अर्ज जनरेटर',
    wf_step3_title: 'पारदर्शक सार्वजनिक मागोवा',
    wf_step3_desc: 'खुली ऑडिट टाइमलाइनसह कामाच्या प्रगतीचा थेट मागोवा घ्या. नागरिक त्वरित कामासाठी पाठिंबा देऊ शकतात आणि अधिकारी कामाचे पुरावे सादर करतात.',
    wf_step3_badge: 'दुरुस्तीपूर्वी व नंतरचे पुरावे'
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
    nav_portal: 'नागरिक पोर्टल',
    nav_notifications: 'सूचनाएं',
    nav_no_notif: 'कोई नई सूचना नहीं',

    // Stepper & Submit
    step_upload: 'फोटो अपलोड',
    step_analyze: 'विश्लेषण',
    step_submit: 'शिकायत दर्ज',
    submit_upload_sub: 'समस्या का फोटो अपलोड करें, बाकी काम हमारा एआई करेगा।',

    // Dashboard Header & Stats
    dash_title: 'नागरिक शिकायत डैशबोर्ड',
    dash_subtitle: 'वार्ड-वार नागरिक शिकायतों की लाइव ट्रैकिंग और त्वरित समाधान।',
    dash_welcome: 'स्वागत है,',
    dash_welcome_sub: 'आइए अपने समुदाय को स्वच्छ, सुरक्षित और बेहतर बनाएं।',
    dash_create_report: 'शिकायत दर्ज करें',
    dash_report_card_title: 'नागरिक समस्या दर्ज करें',
    dash_report_card_desc: 'सड़क का गड्ढा, कचरे का ढेर, खराब स्ट्रीट लाइट या जल निकासी की समस्या देखी? फोटो अपलोड कर तुरंत शिकायत दर्ज करें।',
    dash_report_now: 'अभी दर्ज करें',
    dash_stat_total: 'कुल शिकायतें',
    dash_stat_review: 'समीक्षा में',
    dash_stat_progress: 'प्रगति पर',
    dash_stat_resolved: 'समाधान हुआ',
    dash_stat_high: 'उच्च प्राथमिकता',
    dash_high_notice: 'उच्च प्राथमिकता समस्याओं पर नगर निगम इंजीनियरों द्वारा तत्काल कार्रवाई आवश्यक है।',
    dash_filter_high_btn: 'उच्च प्राथमिकता समस्याएं देखें',

    // Breakdown & Ward Desk
    dash_breakdown_title: 'समस्याओं का विवरण',
    dash_cat_roads: 'सड़कें और गड्ढे',
    dash_cat_streetlights: 'स्ट्रीट लाइट',
    dash_cat_waste: 'कचरा और सफाई',
    dash_cat_water: 'पानी और जल निकासी',
    dash_ward_desk_title: 'नगर निगम वार्ड डेस्क',
    dash_ward_active: 'सक्रिय',
    dash_ward_desk_desc: 'सीधा नगर निगम रूटिंग सक्रिय है। उच्च प्राथमिकता शिकायतों का समाधान ४८ घंटे के भीतर होता है।',
    dash_helpline: 'नागरिक हेल्पलाइन:',
    dash_emergency: 'आपातकालीन सेवाएं:',
    dash_file_grievance: 'नई शिकायत दर्ज करें',

    // Map & Tabs
    dash_map_title: 'लाइव वार्ड मानचित्र',
    dash_map_desc: 'नागरिक समस्याओं और नगरपालिका कार्यों का लाइव भौगोलिक वितरण।',
    dash_map_hint: 'विवरण देखने के लिए मानचित्र पर किसी भी पिन पर क्लिक करें।',
    dash_tab_all: 'शहर की सभी शिकायतें',
    dash_tab_my: 'मेरी शिकायतें',
    dash_filter_label: 'फिल्टर:',
    dash_filter_all: 'सभी',
    dash_filter_high: 'अति आवश्यक',
    dash_filter_medium: 'मध्यम',
    dash_filter_resolved: 'समाधान हुआ',
    dash_showing: 'प्रदर्शित',
    dash_complaints: 'शिकायतें',
    dash_no_complaints: 'इस श्रेणी में कोई शिकायत नहीं मिली।',

    // Edit & Delete Modals
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
    card_status_rejected: 'अस्वीकृत',
    card_edit: 'संपादित करें',
    card_pdf: 'PDF',
    card_delete: 'हटाएं',
    card_add_issue: 'अपडेट जोड़ें',
    card_loc_avail: 'स्थान विवरण उपलब्ध',

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
    details_no_letter: 'कोई औपचारिक याचिका उपलब्ध नहीं है।',

    // StatusTracker
    track_submitted: 'दर्ज हुई',
    track_review: 'समीक्षा',
    track_progress: 'प्रगति पर',
    track_resolved: 'समाधान हुआ',

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

    // Home Stats, Categories & Workflows
    home_stat_resolved: 'हल की गई समस्याएं',
    home_stat_resolved_sub: '६५+ नगर निगम वार्डों में',
    home_stat_rate: 'समाधान दर',
    home_stat_rate_sub: '७ कार्य दिवसों में',
    home_stat_resp: 'औसत प्रथम प्रतिक्रिया',
    home_stat_resp_sub: 'सीधा नगर निगम संपर्क',
    home_stat_pet: 'स्वचालित कानूनी याचिकाएं',
    home_stat_pet_sub: 'स्थानीय भाषा में औपचारिक पत्र',
    cat_roads_potholes: 'सड़कें और गड्ढे',
    cat_roads_desc: 'सड़क के गड्ढे, उखड़ा डामर, असमतल सड़कें और खुले मैनहोल।',
    cat_waste_sanitation: 'कचरा और सफाई',
    cat_waste_desc: 'कचरे के ढेर, सार्वजनिक स्थानों पर गंदगी और न उठाया गया कचरा।',
    cat_streetlights_poles: 'स्ट्रीट लाइट व खंभे',
    cat_streetlights_desc: 'अंधेरी सड़कें, खराब लाइटें और खतरनाक खुली बिजली की तारें।',
    cat_water_pipelines: 'पानी और पाइपलाइन',
    cat_water_desc: 'टूटी हुई मुख्य पाइपलाइन, कम दबाव और दूषित पेयजल।',
    cat_drainage_sewage: 'नाली और सीवेज',
    cat_drainage_desc: 'अवरुद्ध नालियां, रुका हुआ बारिश का पानी और बहता गंदा पानी।',
    cat_public_hazards: 'सार्वजनिक खतरे',
    cat_public_desc: 'अवैध अतिक्रमण, टूटे फुटपाथ, गिरी शाखाएं और सुरक्षा खतरे।',
    wf_step1_title: 'फोटो और तत्काल पहचान',
    wf_step1_desc: 'समस्या का फोटो खींचें। हमारा एआई मॉडल तुरंत समस्या की पहचान करता है, जीपीएस स्थान दर्ज करता है और गंभीरता तय करता है।',
    wf_step1_badge: 'विज़न एआई और जीपीएस सत्यापन',
    wf_step2_title: 'स्वचालित नगर निगम रूटिंग',
    wf_step2_desc: 'हमारा सिस्टम संबंधित स्थानीय निकाय—ग्राम पंचायत, नगर पालिका या नगर निगम—की पहचान कर १३ भाषाओं में कानूनी याचिका तैयार करता है।',
    wf_step2_badge: 'स्वचालित कानूनी पत्र जनरेटर',
    wf_step3_title: 'पारदर्शी सार्वजनिक ट्रैकिंग',
    wf_step3_desc: 'खुली ऑडिट टाइमलाइन के साथ कार्य प्रगति को लाइव देखें। नागरिक महत्वपूर्ण समस्याओं का समर्थन कर सकते हैं और अधिकारी समाधान के प्रमाण अपलोड करते हैं।',
    wf_step3_badge: 'समाधान से पहले और बाद के प्रमाण'
  }
};

// ============================================================================
// COMPREHENSIVE PHRASE & TEXT DICTIONARY FOR INSTANT IN-MEMORY DOM TRANSLATION
// ============================================================================
const PHRASE_DICTIONARY = {
  mr: {
    // Exact Titles & Headings
    'Civic Issue Dashboard': 'नागरी तक्रार डॅशबोर्ड',
    'Issue Breakdown': 'समस्यांचे वर्गीकरण',
    'Municipal Ward Desk': 'महापालिका प्रभाग कक्ष',
    'Live Ward Map': 'थेट प्रभाग नकाशा',
    'All City Complaints': 'शहरातील सर्व तक्रारी',
    'My Complaints': 'माझ्या तक्रारी',
    'Report a Civic Issue': 'नागरी समस्येची तक्रार करा',
    'Create Report': 'तक्रार नोंदवा',
    'Report Now': 'आत्ताच नोंदवा',
    'Report an Issue': 'तक्रार नोंदवा',
    'View Public Dashboard': 'सार्वजनिक डॅशबोर्ड पहा',
    'View Live Citizen Dashboard': 'थेट नागरिक डॅशबोर्ड पहा',
    'Live Issue Feed': 'थेट तक्रार फीड',
    'Official Municipal Route': 'अधिकृत महापालिका मार्ग',
    'Auto-drafted RTI petition': 'स्वयंचलित माहिती अधिकार मसुदा',
    'SELECT LIVE INCIDENT VIDEO:': 'थेट घटनेचा व्हिडिओ निवडा:',
    'LIVE MUNICIPAL INCIDENT CONSOLE': 'थेट महापालिका नियंत्रण कक्ष',
    'Certified Real-Time Feed': 'प्रमाणित थेट फीड',
    'Live Municipal Console Preview': 'थेट महापालिका नियंत्रण कक्ष पूर्वावलोकन',
    'Civic Incident Processing in Action': 'नागरी समस्या प्रक्रिया थेट कारवाईत',
    'System Live • All Wards Active': 'प्रणाली थेट सुरू • सर्व प्रभाग सक्रिय',
    'Vision Model Confidence': 'व्हिजन मॉडेल अचूकता',
    'Auto-Classified': 'स्वयंचलित वर्गीकृत',
    'Assigned Authority': 'नियुक्त प्राधिकरण',
    'Community Validation': 'नागरिक प्रमाणीकरण',
    'Est. Completion:': 'अपेक्षित पूर्णता वेळ:',
    'Within 24 Hours': '२४ तासांच्या आत',
    'Seamless Workflow': 'सुलभ कार्यपद्धती',
    'How Civic Reporter Resolves Grievances': 'सिविक रिपोर्टर तक्रारींचे निवारण कसे करते?',
    'Supported Problem Types': 'तक्रार नोंदवता येणारे प्रकार',
    'What Can You Report?': 'तुम्ही कोणती तक्रार नोंदवू शकता?',
    'Report an unlisted issue': 'इतर समस्या नोंदवा',
    'Engineered For Accuracy': 'अचूकतेसाठी विशेष निर्मिती',
    'Built on Modern Civic Technology': 'आधुनिक नागरी तंत्रज्ञानावर आधारित',
    'Automated Defect Recognition': 'स्वयंचलित दोष ओळख',
    'Computer Vision & Anti-Spam Classification': 'कॉम्प्युटर व्हिजन आणि स्पॅम प्रतिबंधक वर्गीकरण',
    'Detection Accuracy': 'ओळख अचूकता',
    'Inference Time': 'प्रक्रिया वेळ',
    'Spam Rejection': 'स्पॅम नकार',
    'Geospatial Intelligence': 'भू-स्थानिक बुद्धिमत्ता',
    'Precise GPS & Ward Mapping': 'अचूक जीपीएस आणि प्रभाग मॅपिंग',
    'Legal Compliance': 'कायदेशीर पूर्तता',
    'Formal Letter Generator': 'अधिकृत अर्ज जनरेटर',
    'Democratic Oversight': 'लोकशाही नियंत्रण',
    'Community Upvotes & Citizen Reputation': 'नागरिकांचे पाठबळ व सहभाग',
    'Get Involved Today': 'आजच सहभागी व्हा',
    "Your City Needs Your Eyes. Let's Fix It Together.": 'तुमच्या शहराला तुमच्या जागरूकतेची गरज आहे. एकत्र मिळून बदल घडवूया.',
    'Report an Issue Now': 'आत्ताच तक्रार नोंदवा',
    'Smart Public Grievance Platform': 'स्मार्ट सार्वजनिक तक्रार निवारण मंच',
    'Citizen Portal': 'नागरिक पोर्टल',
    'Track Complaints': 'तक्रारींचा मागोवा घ्या',
    'Authority Login': 'प्रशासक लॉगिन',

    // Statuses & Severities
    'Submitted': 'नोंदवली',
    'Under Review': 'पुनरावलोकनात',
    'In Progress': 'प्रगतीपथावर',
    'Resolved': 'निवारण झाले',
    'Rejected': 'नाकारली',
    'High Priority': 'तात्काळ प्राधान्य',
    'High': 'तात्काळ',
    'Medium': 'मध्यम',
    'Low': 'कमी',

    // Categories
    'pothole': 'रस्त्यावरील खड्डा',
    'Pothole': 'रस्त्यावरील खड्डा',
    'POTHOLE': 'खड्डा',
    'garbage': 'कचरा व स्वच्छता',
    'Garbage': 'कचरा व स्वच्छता',
    'GARBAGE': 'कचरा',
    'streetlight': 'बंद पथदिवा',
    'Streetlight': 'बंद पथदिवा',
    'STREETLIGHT': 'पथदिवा',
    'broken streetlight': 'खराब पथदिवा',
    'water': 'पाणी गळती',
    'Water Leakage': 'पाणी गळती',
    'drainage': 'सांडपाणी वाहिनी',
    'Drainage': 'सांडपाणी वाहिनी',
    'Roads & Potholes': 'रस्ते व खड्डे',
    'Streetlights': 'पथदिवे',
    'Waste & Sanitation': 'कचरा व स्वच्छता',
    'Water & Drainage': 'पाणी व सांडपाणी',

    // Details page specific
    'FORMAL COMPLAINT LETTER': 'अधिकृत तक्रार अर्ज',
    'Formal Complaint Letter': 'अधिकृत तक्रार अर्ज',
    'Download PDF': 'PDF डाउनलोड करा',
    'Download Petition PDF': 'तक्रार अर्ज PDF डाउनलोड करा',
    'Support this issue': 'या समस्येला पाठिंबा द्या',
    'Support this Civic Issue': 'या नागरी समस्येला पाठिंबा द्या',
    'Upvotes help flag issues to authorities faster.': 'नागरिकांच्या पाठिंब्यामुळे समस्या अधिकाऱ्यांपर्यंत वेगाने पोहोचते.',
    'Did you solve this?': 'तुम्ही ही समस्या सोडवली का?',
    'If you or the community fixed this issue, claim credit as a Community Hero!': 'जर तुम्ही किंवा नागरिकांनी मिळून ही समस्या सोडवली असेल, तर नोंद करा!',
    'If you or the community fixed this, claim credit as a Community Hero!': 'जर तुम्ही किंवा नागरिकांनी मिळून ही समस्या सोडवली असेल, तर नोंद करा!',
    'I Solved This!': 'मी हे सोडवले!',
    'Resolution Lifecycle': 'तक्रार निवारण प्रक्रिया',
    'Municipal Ward & Routing Desk': 'महापालिका प्रभाग कक्ष व संपर्क',
    'Click to Enlarge': 'मोठे करून पहा',
    'Before': 'आधीची स्थिती',
    'After (Resolved) ✨': 'निवारणानंतर (दुरुस्त) ✨',
    'After': 'निवारणानंतर',
    'Authority': 'प्राधिकरण',
    'Department': 'विभाग',
    'Location:': 'स्थान:',
    'Date:': 'दिनांक:',
    'Time:': 'वेळ:',
    'To,': 'प्रति,',
    'The Municipal Commissioner,': 'मा. महानगरपालिका आयुक्त,',
    'Municipal Corporation': 'महानगरपालिका',
    'District': 'जिल्हा',
    'Subject: Urgent complaint regarding': 'विषय: तातडीची तक्रार बाबत',
    'Respected Sir/Madam,': 'आदरणीय महोदय / महोदया,',
    'Thank you for your prompt action.': 'त्वरित कारवाईबद्दल धन्यवाद.',
    'Yours faithfully,': 'आपला / आपली नम्र,',

    // Card Actions
    'Edit': 'संपादित',
    'PDF': 'PDF',
    'Delete': 'हटवा',
    'Add Issue': 'अपडेट जोडा',
    'Total': 'एकूण',
    'Active': 'सक्रिय',
    'Civic Helpline:': 'नागरी हेल्पलाइन:',
    'Emergency Services:': 'आपत्कालीन सेवा:',
    'File a New Grievance': 'नवीन तक्रार नोंदवा',
    'Click any pin on the map to preview report details.': 'तपशील पाहण्यासाठी नकाशावरील कोणत्याही पिनवर क्लिक करा.',
    'Filter:': 'फिल्टर:',
    'All': 'सर्व',
    'showing': 'दाखवत आहे',
    'complaints': 'तक्रारी',
    'No complaints found in this category.': 'या श्रेणीत कोणतीही तक्रार आढळली नाही.',
    'Location details available': 'स्थान तपशील उपलब्ध',
    'Direct municipal routing is active. Standard high-priority resolution turnaround is under 48 hours.': 'थेट महापालिका संपर्क सक्रिय आहे. तात्काळ तक्रारींचे निवारण ४८ तासांच्या आत केले जाते.',

    // Common Sentences & Paragraphs
    'Spotted a pothole, open garbage dump, broken streetlight, or drainage issue? Help improve your city by reporting it.': 'रस्त्यावरील खड्डा, कचरा साचणे, बंद पथदिवा किंवा सांडपाण्याची समस्या आढळली? फोटो काढून तक्रार नोंदवा.',
    'Citizen reported issue requiring department inspection and action.': 'नागरिकाने नोंदवलेली समस्या, ज्यावर महापालिकेची प्रत्यक्ष तपासणी आणि कारवाई सुरू आहे.',
    '100% Free · Open Civic Platform · Secure & Privacy-First': '१००% विनामूल्य · खुला नागरी मंच · सुरक्षित व गोपनीयता-प्रथम',

    // Home Page Features & Bento Grid
    'Verified Citizens': 'प्रमाणित नागरिक',
    'Issues Resolved': 'सोडवलेल्या समस्या',
    'Avg. Turnaround': 'सरासरी वेळ',
    'Jurisdictions': 'प्रशासकीय क्षेत्रे',
    'Active city reporters': 'सक्रिय नागरिक तक्रारदार',
    '96.4% success rate': '९६.४% निवारण दर',
    'From report to fix': 'तक्रारीपासून दुरुस्तीपर्यंत',
    'Corporations & councils': 'महानगरपालिका व परिषदा',
    'Capture & Instant AI Verification': 'फोटो आणि त्वरित एआय तपासणी',
    'Automated Authority Routing': 'स्वयंचलित महापालिका मार्गक्रमण',
    'Transparent Public Tracking': 'पारदर्शक सार्वजनिक मागोवा',
    'Vision AI & EXIF Verification': 'व्हिजन एआय व जीपीएस पडताळणी',
    'Auto Legal Letter Generator': 'स्वयंचलित कायदेशीर अर्ज जनरेटर',
    'Verified Before & After Closure': 'दुरुस्तीपूर्वी व नंतरचे पुरावे',
    'Road Hazards': 'रस्त्यावरील धोके',
    'Sanitation & Dumps': 'स्वच्छता व कचरा',
    'Streetlighting': 'पथदिवे',
    'Water & Sewers': 'पाणीपुरवठा व सांडपाणी',
    'Traffic Signals': 'रहदारी दिवे व चिन्हे',
    'Parks & Trees': 'उद्याने व धोकादायक झाडे',
    'AI Vision Model Supported': 'एआय व्हिजन मॉडेल सक्षम',
    'Over 5,000 active citizens participating this month': 'या महिन्यात ५,०००+ सक्रिय नागरिकांचा सहभाग',
    'For life-threatening emergencies, please dial emergency services immediately (112 / 100).': 'तातडीच्या आपत्कालीन मदतीसाठी कृपया लगेच डायल करा (११२ / १००).',

    // Submit Page
    'Upload Damage Photo': 'समस्येचा फोटो अपलोड करा',
    'AI Detection & Category': 'एआय तपासणी व समस्येचा प्रकार',
    'Location & Authority': 'स्थान व संबंधित प्राधिकरण',
    'Formal Petition & Submit': 'अधिकृत अर्ज व सादरीकरण',
    'Take Photo or Upload': 'फोटो काढा किंवा अपलोड करा',
    'Drag & drop your photo here, or browse': 'येथे फोटो ड्रॅग आणि ड्रॉप करा, किंवा निवडा',
    'AI Vision Detection': 'एआय व्हिजन तपासणी',
    'Analyzing image with custom Vision AI...': 'एआय व्हिजनद्वारे प्रतिमेची तपासणी सुरू आहे...',
    'Problem Category': 'समस्येचा प्रकार',
    'Severity Level': 'गंभीरता पातळी',
    'Description': 'तपशीलवार वर्णन',
    'Location Details': 'स्थानाचा तपशील',
    'Detecting Location...': 'स्थान शोधत आहे...',
    'Authority Type': 'प्राधिकरणाचा प्रकार',
    'Generate Legal Grievance': 'कायदेशीर तक्रार अर्ज तयार करा',
    'Submit Grievance': 'तक्रार सादर करा',
    'Submitting...': 'तक्रार नोंदवत आहे...',
    'Success! Your civic grievance has been submitted.': 'यशस्वी! तुमची नागरी तक्रार नोंदवली गेली आहे.'
  },

  hi: {
    // Exact Titles & Headings
    'Civic Issue Dashboard': 'नागरिक शिकायत डैशबोर्ड',
    'Issue Breakdown': 'समस्याओं का विवरण',
    'Municipal Ward Desk': 'नगर निगम वार्ड डेस्क',
    'Live Ward Map': 'लाइव वार्ड मानचित्र',
    'All City Complaints': 'शहर की सभी शिकायतें',
    'My Complaints': 'मेरी शिकायतें',
    'Report a Civic Issue': 'नागरिक समस्या दर्ज करें',
    'Create Report': 'शिकायत दर्ज करें',
    'Report Now': 'अभी दर्ज करें',
    'Report an Issue': 'समस्या दर्ज करें',
    'View Public Dashboard': 'सार्वजनिक डैशबोर्ड देखें',
    'View Live Citizen Dashboard': 'लाइव नागरिक डैशबोर्ड देखें',
    'Live Issue Feed': 'लाइव समस्या फीड',
    'Official Municipal Route': 'आधिकारिक नगर पालिका मार्ग',
    'Auto-drafted RTI petition': 'स्वचालित आरटीआई याचिका',
    'SELECT LIVE INCIDENT VIDEO:': 'लाइव घटना वीडियो चुनें:',
    'LIVE MUNICIPAL INCIDENT CONSOLE': 'लाइव नगर निगम नियंत्रण कक्ष',
    'Certified Real-Time Feed': 'प्रमाणित लाइव फीड',
    'Live Municipal Console Preview': 'लाइव नगर निगम कंसोल पूर्वावलोकन',
    'Civic Incident Processing in Action': 'नागरिक समस्या निवारण प्रक्रिया',
    'System Live • All Wards Active': 'सिस्टम लाइव • सभी वार्ड सक्रिय',
    'Vision Model Confidence': 'विज़न मॉडल सटीकता',
    'Auto-Classified': 'स्वचालित वर्गीकृत',
    'Assigned Authority': 'नियुक्त प्राधिकरण',
    'Community Validation': 'सामुदायिक सत्यापन',
    'Est. Completion:': 'अनुमानित समय:',
    'Within 24 Hours': '२४ घंटे के भीतर',
    'Seamless Workflow': 'सहज कार्यप्रणाली',
    'How Civic Reporter Resolves Grievances': 'सिविक रिपोर्टर शिकायतों का समाधान कैसे करता है?',
    'Supported Problem Types': 'शिकायत दर्ज करने योग्य प्रकार',
    'What Can You Report?': 'आप क्या रिपोर्ट कर सकते हैं?',
    'Report an unlisted issue': 'अन्य समस्या दर्ज करें',
    'Engineered For Accuracy': 'सटीकता के लिए निर्मित',
    'Built on Modern Civic Technology': 'आधुनिक नागरिक तकनीक पर आधारित',
    'Automated Defect Recognition': 'स्वचालित दोष पहचान',
    'Computer Vision & Anti-Spam Classification': 'कंप्यूटर विज़न और स्पैम रोकथाम वर्गीकरण',
    'Detection Accuracy': 'पहचान सटीकता',
    'Inference Time': 'प्रसंस्करण समय',
    'Spam Rejection': 'स्पैम अस्वीकृति',
    'Geospatial Intelligence': 'भू-स्थानिक बुद्धिमत्ता',
    'Precise GPS & Ward Mapping': 'सटीक जीपीएस और वार्ड मैपिंग',
    'Legal Compliance': 'कानूनी अनुपालन',
    'Formal Letter Generator': 'औपचारिक पत्र जनरेटर',
    'Democratic Oversight': 'लोकतांत्रिक निगरानी',
    'Community Upvotes & Citizen Reputation': 'सामुदायिक समर्थन और प्रतिष्ठा',
    'Get Involved Today': 'आज ही जुड़ें',
    "Your City Needs Your Eyes. Let's Fix It Together.": 'आपके शहर को आपकी सतर्कता की जरूरत है। मिलकर समाधान करें।',
    'Report an Issue Now': 'अभी शिकायत दर्ज करें',
    'Smart Public Grievance Platform': 'स्मार्ट सार्वजनिक शिकायत निवारण मंच',
    'Citizen Portal': 'नागरिक पोर्टल',
    'Track Complaints': 'शिकायतों को ट्रैक करें',
    'Authority Login': 'प्राधिकरण लॉगिन',

    // Statuses & Severities
    'Submitted': 'दर्ज हुई',
    'Under Review': 'समीक्षा में',
    'In Progress': 'प्रगति पर',
    'Resolved': 'समाधान हुआ',
    'Rejected': 'अस्वीकृत',
    'High Priority': 'उच्च प्राथमिकता',
    'High': 'अति आवश्यक',
    'Medium': 'मध्यम',
    'Low': 'सामान्य',

    // Categories
    'pothole': 'सड़क का गड्ढा',
    'Pothole': 'सड़क का गड्ढा',
    'POTHOLE': 'गड्ढा',
    'garbage': 'कचरा व गंदगी',
    'Garbage': 'कचरा व गंदगी',
    'GARBAGE': 'कचरा',
    'streetlight': 'खराब स्ट्रीट लाइट',
    'Streetlight': 'खराब स्ट्रीट लाइट',
    'STREETLIGHT': 'स्ट्रीट लाइट',
    'broken streetlight': 'खराब स्ट्रीट लाइट',
    'water': 'पानी का रिसाव',
    'Water Leakage': 'पानी का रिसाव',
    'drainage': 'नाली अवरोध',
    'Drainage': 'नाली अवरोध',
    'Roads & Potholes': 'सड़कें और गड्ढे',
    'Streetlights': 'स्ट्रीट लाइट',
    'Waste & Sanitation': 'कचरा और सफाई',
    'Water & Drainage': 'पानी और जल निकासी',

    // Details page specific
    'FORMAL COMPLAINT LETTER': 'औपचारिक शिकायत पत्र',
    'Formal Complaint Letter': 'औपचारिक शिकायत पत्र',
    'Download PDF': 'PDF डाउनलोड करें',
    'Download Petition PDF': 'याचिका PDF डाउनलोड करें',
    'Support this issue': 'इस समस्या का समर्थन करें',
    'Support this Civic Issue': 'इस नागरिक समस्या का समर्थन करें',
    'Upvotes help flag issues to authorities faster.': 'नागरिकों के समर्थन से समस्या अधिकारियों तक तेजी से पहुँचती है।',
    'Did you solve this?': 'क्या आपने इसे हल किया?',
    'If you or the community fixed this issue, claim credit as a Community Hero!': 'यदि आपने या नागरिकों ने मिलकर इसे ठीक किया, तो कम्युनिटी हीरो के रूप में श्रेय लें!',
    'If you or the community fixed this, claim credit as a Community Hero!': 'यदि आपने या नागरिकों ने मिलकर इसे ठीक किया, तो कम्युनिटी हीरो के रूप में श्रेय लें!',
    'I Solved This!': 'मैंने इसे हल किया!',
    'Resolution Lifecycle': 'समाधान जीवनचक्र',
    'Municipal Ward & Routing Desk': 'नगर निगम वार्ड डेस्क व संपर्क',
    'Click to Enlarge': 'बड़ा करके देखें',
    'Before': 'पहले की स्थिति',
    'After (Resolved) ✨': 'समाधान के बाद ✨',
    'After': 'समाधान के बाद',
    'Authority': 'प्राधिकरण',
    'Department': 'विभाग',
    'Location:': 'स्थान:',
    'Date:': 'दिनांक:',
    'Time:': 'समय:',
    'To,': 'सेवा में,',
    'The Municipal Commissioner,': 'माननीय नगर आयुक्त,',
    'Municipal Corporation': 'नगर निगम',
    'District': 'जिला',
    'Subject: Urgent complaint regarding': 'विषय: अति आवश्यक शिकायत बाबत',
    'Respected Sir/Madam,': 'आदरणीय महोदय / महोदया,',
    'Thank you for your prompt action.': 'शीघ्र कार्रवाई के लिए धन्यवाद।',
    'Yours faithfully,': 'भवदीय,',

    // Card Actions
    'Edit': 'संपादित करें',
    'PDF': 'PDF',
    'Delete': 'हटाएं',
    'Add Issue': 'अपडेट जोड़ें',
    'Total': 'कुल',
    'Active': 'सक्रिय',
    'Civic Helpline:': 'नागरिक हेल्पलाइन:',
    'Emergency Services:': 'आपातकालीन सेवाएं:',
    'File a New Grievance': 'नई शिकायत दर्ज करें',
    'Click any pin on the map to preview report details.': 'विवरण देखने के लिए मानचित्र पर किसी भी पिन पर क्लिक करें।',
    'Filter:': 'फिल्टर:',
    'All': 'सभी',
    'showing': 'प्रदर्शित',
    'complaints': 'शिकायतें',
    'No complaints found in this category.': 'इस श्रेणी में कोई शिकायत नहीं मिली।',
    'Location details available': 'स्थान विवरण उपलब्ध',
    'Direct municipal routing is active. Standard high-priority resolution turnaround is under 48 hours.': 'सीधा नगर निगम रूटिंग सक्रिय है। उच्च प्राथमिकता शिकायतों का समाधान ४८ घंटे के भीतर होता है।',

    // Common Sentences & Paragraphs
    'Spotted a pothole, open garbage dump, broken streetlight, or drainage issue? Help improve your city by reporting it.': 'सड़क का गड्ढा, कचरा, खराब स्ट्रीट लाइट या जल निकासी की समस्या देखी? फोटो अपलोड कर शिकायत दर्ज करें।',
    'Citizen reported issue requiring department inspection and action.': 'नागरिक द्वारा दर्ज की गई समस्या, जिस पर नगर निगम की टीम द्वारा कार्रवाई की जा रही है।',
    '100% Free · Open Civic Platform · Secure & Privacy-First': '१००% निःशुल्क · खुला नागरिक मंच · सुरक्षित व गोपनीयता-सर्वोपरि',

    // Home Page Features & Bento Grid
    'Verified Citizens': 'सत्यापित नागरिक',
    'Issues Resolved': 'हल की गई समस्याएं',
    'Avg. Turnaround': 'औसत समय',
    'Jurisdictions': 'नगर निकाय क्षेत्र',
    'Active city reporters': 'सक्रिय नागरिक शिकायतकर्ता',
    '96.4% success rate': '९६.४% समाधान दर',
    'From report to fix': 'शिकायत से समाधान तक',
    'Corporations & councils': 'नगर निगम व परिषदें',
    'Capture & Instant AI Verification': 'फोटो और त्वरित एआई जांच',
    'Automated Authority Routing': 'स्वचालित नगर निगम रूटिंग',
    'Transparent Public Tracking': 'पारदर्शी सार्वजनिक ट्रैकिंग',
    'Vision AI & EXIF Verification': 'विज़न एआई और जीपीएस सत्यापन',
    'Auto Legal Letter Generator': 'स्वचालित कानूनी पत्र जनरेटर',
    'Verified Before & After Closure': 'समाधान से पहले और बाद के प्रमाण',
    'Road Hazards': 'सड़क के खतरे',
    'Sanitation & Dumps': 'सफाई और कचरा',
    'Streetlighting': 'स्ट्रीट लाइट',
    'Water & Sewers': 'जलापूर्ति और सीवर',
    'Traffic Signals': 'यातायात सिग्नल व संकेत',
    'Parks & Trees': 'पार्क और खतरनाक पेड़',
    'AI Vision Model Supported': 'एआई विज़न मॉडल सक्षम',
    'Over 5,000 active citizens participating this month': 'इस महीने ५,०००+ सक्रिय नागरिकों की भागीदारी',
    'For life-threatening emergencies, please dial emergency services immediately (112 / 100).': 'गंभीर आपात स्थिति के लिए कृपया तुरंत आपातकालीन सेवाओं (११२ / १००) पर कॉल करें।',

    // Submit Page
    'Upload Damage Photo': 'समस्या का फोटो अपलोड करें',
    'AI Detection & Category': 'एआई जांच और समस्या प्रकार',
    'Location & Authority': 'स्थान और संबंधित प्राधिकरण',
    'Formal Petition & Submit': 'औपचारिक याचिका और सबमिट',
    'Take Photo or Upload': 'फोटो खींचें या अपलोड करें',
    'Drag & drop your photo here, or browse': 'यहां फोटो खींचकर छोड़ें, या चुनें',
    'AI Vision Detection': 'एआई विज़न जांच',
    'Analyzing image with custom Vision AI...': 'एआई विज़न द्वारा फोटो का विश्लेषण किया जा रहा है...',
    'Problem Category': 'समस्या की श्रेणी',
    'Severity Level': 'गंभीरता स्तर',
    'Description': 'विस्तृत विवरण',
    'Location Details': 'स्थान का विवरण',
    'Detecting Location...': 'स्थान खोजा जा रहा है...',
    'Authority Type': 'प्राधिकरण का प्रकार',
    'Generate Legal Grievance': 'कानूनी शिकायत पत्र तैयार करें',
    'Submit Grievance': 'शिकायत दर्ज करें',
    'Submitting...': 'शिकायत दर्ज की जा रही है...',
    'Success! Your civic grievance has been submitted.': 'सफल! आपकी नागरिक शिकायत दर्ज कर ली गई है।'
  }
};

// Dynamic sentence patterns with capture groups
const REGEX_RULES = {
  mr: [
    {
      regex: /Detected\s+([a-zA-Z\s]+?)\s+with\s+(\d+)%\s+confidence\s+using\s+custom\s+trained\s+ML\s+model\.?/gi,
      replace: (match, defect, conf) => {
        const d = (defect || '').trim().toLowerCase();
        const defMr = d.includes('pothole') ? 'खड्डा' : d.includes('street') ? 'पथदिवा' : d.includes('garb') ? 'कचरा' : d.includes('water') ? 'पाणी गळती' : 'दोष';
        return `प्रशिक्षित एमएल मॉडेल वापरून ${conf}% अचूकतेसह ${defMr} ओळखला.`;
      }
    },
    {
      regex: /(\d+)\s+High Priority issue\(s\)\s+require urgent attention from city municipal engineers\.?/gi,
      replace: (match, count) => `${count} तात्काळ समस्यांवर महापालिका अभियंत्यांनी त्वरित लक्ष देणे आवश्यक आहे.`
    },
    {
      regex: /Reported\s+by\s+([a-zA-Z0-9\s_]+)/gi,
      replace: (match, name) => `${name} द्वारे नोंदवले गेले`
    },
    {
      regex: /Joined by\s+([\d,k+]+)\s+Active Citizens/gi,
      replace: (match, count) => `${count} सक्रिय नागरिकांचा सहभाग`
    },
    {
      regex: /(\d+)\s+Citizens Endorsed/gi,
      replace: (match, count) => `${count} नागरिकांचा पाठिंबा`
    }
  ],
  hi: [
    {
      regex: /Detected\s+([a-zA-Z\s]+?)\s+with\s+(\d+)%\s+confidence\s+using\s+custom\s+trained\s+ML\s+model\.?/gi,
      replace: (match, defect, conf) => {
        const d = (defect || '').trim().toLowerCase();
        const defHi = d.includes('pothole') ? 'सड़क का गड्ढा' : d.includes('street') ? 'स्ट्रीट लाइट' : d.includes('garb') ? 'कचरा' : d.includes('water') ? 'पानी का रिसाव' : 'दोष';
        return `कस्टम प्रशिक्षित एमएल मॉडल का उपयोग करके ${conf}% सटीकता के साथ ${defHi} पहचाना गया।`;
      }
    },
    {
      regex: /(\d+)\s+High Priority issue\(s\)\s+require urgent attention from city municipal engineers\.?/gi,
      replace: (match, count) => `${count} उच्च प्राथमिकता समस्याओं पर नगर निगम इंजीनियरों द्वारा तत्काल कार्रवाई आवश्यक है।`
    },
    {
      regex: /Reported\s+by\s+([a-zA-Z0-9\s_]+)/gi,
      replace: (match, name) => `${name} द्वारा दर्ज किया गया`
    },
    {
      regex: /Joined by\s+([\d,k+]+)\s+Active Citizens/gi,
      replace: (match, count) => `${count} सक्रिय नागरिकों का सहयोग`
    },
    {
      regex: /(\d+)\s+Citizens Endorsed/gi,
      replace: (match, count) => `${count} नागरिकों का समर्थन`
    }
  ]
};

// Pre-sort dictionary keys by length in descending order for optimal phrase matching
const SORTED_KEYS = {
  mr: Object.keys(PHRASE_DICTIONARY.mr).sort((a, b) => b.length - a.length),
  hi: Object.keys(PHRASE_DICTIONARY.hi).sort((a, b) => b.length - a.length),
};

// Global WeakMap to store pristine original English text for text nodes
const originalTextMap = new WeakMap();

// Guard flag to prevent MutationObserver recursive loops
let isTranslating = false;

// Translate a plain string with sub-phrase matching & regex rules
export const translateString = (str, lang) => {
  if (!str || typeof str !== 'string' || lang === 'en') return str;
  const dict = PHRASE_DICTIONARY[lang];
  if (!dict) return str;

  // 1. Run dynamic regex rules first
  let modified = str;
  const rules = REGEX_RULES[lang] || [];
  for (const rule of rules) {
    if (rule.regex.test(modified)) {
      rule.regex.lastIndex = 0;
      modified = modified.replace(rule.regex, rule.replace);
    }
  }

  // 2. Exact match check
  const trimmed = modified.trim();
  if (dict[trimmed]) {
    return modified.replace(trimmed, dict[trimmed]);
  }

  // 3. Sub-phrase scanning (longest phrases first)
  const keys = SORTED_KEYS[lang] || [];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (modified.includes(k)) {
      modified = modified.split(k).join(dict[k]);
    }
  }

  return modified;
};

// TreeWalker: Walk all text nodes inside root and translate or restore
const translateDomTree = (root, lang) => {
  if (!root || typeof window === 'undefined') return;

  isTranslating = true;
  try {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName.toLowerCase();
          if (tag === 'script' || tag === 'style' || tag === 'code' || tag === 'noscript') {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      const rawVal = currentNode.nodeValue;

      if (lang === 'en') {
        if (originalTextMap.has(currentNode)) {
          const orig = originalTextMap.get(currentNode);
          if (currentNode.nodeValue !== orig) {
            currentNode.nodeValue = orig;
          }
        }
      } else {
        // If not recorded yet, or if React rendered a new English string
        if (!originalTextMap.has(currentNode)) {
          originalTextMap.set(currentNode, rawVal);
        }
        const orig = originalTextMap.get(currentNode);
        const translated = translateString(orig, lang);
        if (translated !== currentNode.nodeValue) {
          currentNode.nodeValue = translated;
        }
      }

      currentNode = walker.nextNode();
    }

    // Also translate input placeholders
    const inputs = root.querySelectorAll ? root.querySelectorAll('input, textarea') : [];
    inputs.forEach((input) => {
      const placeholder = input.getAttribute('placeholder');
      if (placeholder) {
        if (!input.hasAttribute('data-orig-placeholder')) {
          input.setAttribute('data-orig-placeholder', placeholder);
        }
        const origP = input.getAttribute('data-orig-placeholder');
        if (lang === 'en') {
          input.setAttribute('placeholder', origP);
        } else {
          input.setAttribute('placeholder', translateString(origP, lang));
        }
      }
    });
  } catch (err) {
    console.warn('DOM translation pass warning:', err);
  } finally {
    isTranslating = false;
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('civic_lang') || 'en';
  });

  const observerRef = useRef(null);
  const rafRef = useRef(null);

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

  // Run DOM Deep Translation whenever currentLang changes
  useEffect(() => {
    const rootEl = document.getElementById('root') || document.body;
    translateDomTree(rootEl, currentLang);

    // Disconnect old observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Set up MutationObserver to translate any newly added elements or DOM updates instantly
    observerRef.current = new MutationObserver((mutations) => {
      if (isTranslating) return;

      let shouldTranslate = false;
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          shouldTranslate = true;
          break;
        }
        if (m.type === 'characterData') {
          shouldTranslate = true;
          break;
        }
      }

      if (shouldTranslate && currentLang !== 'en') {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          translateDomTree(rootEl, currentLang);
        });
      }
    });

    observerRef.current.observe(rootEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [currentLang]);

  const activeLanguage = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ currentLang, changeLanguage, activeLanguage, languages: LANGUAGES, t, translateString }}>
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
