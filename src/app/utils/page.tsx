import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Zap, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UtilsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          파일 유틸리티
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
          AI 기반으로 문서를 처리하고, 작업 효율을 높여보세요
        </p>
      </div>

      {/* 유틸리티 카드들 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-500" />
              Word 문서 교정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              맞춤법, 띄어쓰기, 문장 다듬기를 AI로 자동 교정
            </p>
            <Button variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Word 파일 업로드
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-green-500" />
              Excel 데이터 정규화
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              표준어 사전을 활용한 데이터 일괄 정규화
            </p>
            <Button variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Excel 파일 업로드
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-500" />
              PDF 문서 처리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              PDF 텍스트 추출, 병합, 분할, 변환
            </p>
            <Button variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              PDF 파일 업로드
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 작업 히스토리 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6" />
            최근 작업
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              아직 처리한 파일이 없습니다. 위의 도구를 사용해보세요!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 개발 중 안내 */}
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20 mt-6">
        <CardContent className="pt-6">
          <div className="text-center">
            <Zap className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">
              AI 유틸리티 기능 개발 중
            </h3>
            <p className="text-purple-700 dark:text-purple-300">
              OpenAI GPT API와 파일 처리 라이브러리들을 통합하여
              강력한 문서 처리 도구를 만들고 있습니다.
              곧 AI 기반 교정 기능을 만나보실 수 있습니다!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
