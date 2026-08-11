export const FIELD_LABELS: Record<string, string> = {
  bookUrl: '书籍链接',
  chapterUrl: '章节链接',
  tocUrl: '目录链接',
  nextTocUrl: '下一页目录链接',
  nextContentUrl: '下一页内容链接',
  coverUrl: '封面图片',
  author: '作者',
  intro: '简介',
  kind: '分类',
  lastChapter: '最新章节',
  updateTime: '更新时间',
  wordCount: '字数',
  searchUrl: '搜索链接',
  method: '请求方式',
  postBody: 'POST 请求体',
  charset: '字符编码',
  header: '请求头'
};

export function getFieldLabel(key: string): string {
  return FIELD_LABELS[key] || key;
}
