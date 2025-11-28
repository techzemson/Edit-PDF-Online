export enum AnalysisStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface ChartDataItem {
  name: string;
  value: number;
  fill?: string;
}

export interface PdfAnalysis {
  summary: string;
  fullText: string;
  sentimentScore: number; // 0 to 100
  sentimentLabel: string;
  keywords: ChartDataItem[];
  topics: ChartDataItem[];
  entityCount: number;
  readingTimeMin: number;
}

export enum ToolAction {
  // Basics
  SUMMARIZE = 'Summarize',
  FIX_GRAMMAR = 'Fix Grammar',
  SIMPLIFY = 'Simplify',
  
  // Translation
  TRANSLATE_ES = 'Translate (Spanish)',
  TRANSLATE_FR = 'Translate (French)',
  TRANSLATE_DE = 'Translate (German)',
  TRANSLATE_ZH = 'Translate (Chinese)',

  // Editing & Writing
  EXPAND = 'Expand Text',
  SHORTEN = 'Shorten Text',
  MAKE_PROFESSIONAL = 'Make Professional',
  MAKE_CASUAL = 'Make Casual',
  MAKE_ACADEMIC = 'Make Academic',
  MAKE_PERSUASIVE = 'Make Persuasive',
  DRAFT_REPLY = 'Draft Reply Email',
  CRITIQUE = 'Critique Content',
  
  // Extraction & Data
  EXTRACT_EMAILS = 'Extract Emails',
  EXTRACT_DATES = 'Extract Dates',
  EXTRACT_URLS = 'Extract URLs',
  EXTRACT_PHONE = 'Extract Phone #',
  CONVERT_TO_TABLE = 'Convert to Table',
  
  // Structure & Format
  ACTION_ITEMS = 'Action Items',
  RISK_ASSESSMENT = 'Risk Assessment',
  GENERATE_QUIZ = 'Generate Quiz',
  GENERATE_FAQS = 'Generate FAQs',
  BULLET_POINTS = 'Convert to Bullets',
  FIX_PUNCTUATION = 'Fix Punctuation',
  FORMAT_HTML = 'Format as HTML',
  EXPLAIN_TERMS = 'Explain Terms',

  // Clean Up & Security
  REMOVE_WATERMARK = 'Remove Watermark Text',
  REDACT_PII = 'Redact Sensitive Info'
}

export interface FileData {
  name: string;
  size: number;
  type: string;
  base64: string;
}

export interface PageSetup {
  watermark: string;
  header: string;
  footer: string;
  showPageNumbers: boolean;
}