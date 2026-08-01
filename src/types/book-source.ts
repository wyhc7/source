export interface BookSource {
  bookSourceName: string;
  bookSourceUrl: string;
  bookSourceType: 0 | 1 | 2 | 3 | 4;
  bookSourceGroup: string;
  category: string;
  ruleSearch: SearchRule;
  ruleBookInfo: FieldRule[];
  ruleToc: FieldRule[];
  ruleContent: FieldRule[];
  ruleExplore: string;
  login: LoginConfig;
  header: string;
  weight: number;
  lastUpdateTime: number;
  sourceRemark: string;
}

export interface SearchRule {
  searchUrl: string;
  method: 'GET' | 'POST';
  postBody?: string;
  charset?: string;
  header?: string;
}

export interface FieldRule {
  name: string;
  rule: string;
  webView?: boolean;
}

export interface LoginConfig {
  url: string;
  username: string;
  password: string;
  cookies?: string;
}

export interface CategoryNode {
  name: string;
  children: Map<string, CategoryNode>;
}