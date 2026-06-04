// 커밋 메시지 컨벤션 — 백엔드 repo(market-risk-radar)와 동일
// 형식: <type>: <한글 설명>  (Conventional Commits 간소화형, scope 생략)
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 백엔드 컨벤션에 맞춘 type 집합
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'refactor', 'chore', 'hotfix'],
    ],
    // 한글·영문 혼용 설명을 허용하기 위해 case 규칙 비활성화
    'subject-case': [0],
    // 본문/푸터 한 줄 길이 제한 비활성화 (Co-Authored-By, PR 푸터 등)
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};

export default config;
