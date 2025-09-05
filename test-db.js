// 데이터베이스 연결 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://obmtqjrmyfiicfjjrwfz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibXRxanJteWZpaWNmampyd2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MjcyOTQsImV4cCI6MjA3MjUwMzI5NH0.btoTdUOsHl9uP9lmQPqIraiddgMUO547J2OM_9_wQC8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  try {
    console.log('🧪 데이터베이스 연결 테스트 중...');

    // 1. 게시판 테이블 확인
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('*');

    if (boardsError) {
      console.error('❌ 게시판 조회 실패:', boardsError);
    } else {
      console.log('✅ 게시판 조회 성공:', boards);
    }

    // 2. 게시글 테이블 확인 (빈 테이블이어야 함)
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*');

    if (postsError) {
      console.error('❌ 게시글 조회 실패:', postsError);
    } else {
      console.log('✅ 게시글 조회 성공 (총', posts.length, '개):', posts);
    }

    // 3. 구인구직 공고 테이블 확인 (빈 테이블이어야 함)
    const { data: jobs, error: jobsError } = await supabase
      .from('job_postings')
      .select('*');

    if (jobsError) {
      console.error('❌ 구인구직 공고 조회 실패:', jobsError);
    } else {
      console.log('✅ 구인구직 공고 조회 성공 (총', jobs.length, '개):', jobs);
    }

    console.log('🎉 데이터베이스 연결 테스트 완료!');

  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error);
  }
}

testDatabase();
