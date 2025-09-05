// 게시글 작성 및 조회 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://obmtqjrmyfiicfjjrwfz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibXRxanJteWZpaWNmampyd2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MjcyOTQsImV4cCI6MjA3MjUwMzI5NH0.btoTdUOsHl9uP9lmQPqIraiddgMUO547J2OM_9_wQC8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPostCRUD() {
  try {
    console.log('🧪 게시글 CRUD 기능 테스트 중...');

    // 1. 익명 게시판 ID 가져오기
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id')
      .eq('type', 'anonymous')
      .single();

    if (boardError) {
      console.error('❌ 게시판 조회 실패:', boardError);
      return;
    }

    console.log('✅ 익명 게시판 ID:', board.id);

    // 2. 테스트 게시글 작성 (익명)
    const testPost = {
      board_id: board.id,
      author_id: '00000000-0000-0000-0000-000000000000', // 테스트용 UUID
      is_anonymous: true,
      title: '테스트 게시글입니다',
      body: '안녕하세요! 편집자 커뮤니티에 오신 것을 환영합니다. 이 게시글은 데이터베이스 연결 테스트를 위한 것입니다.'
    };

    const { data: newPost, error: insertError } = await supabase
      .from('posts')
      .insert(testPost)
      .select()
      .single();

    if (insertError) {
      console.error('❌ 게시글 작성 실패:', insertError);
    } else {
      console.log('✅ 게시글 작성 성공:', newPost);
    }

    // 3. 게시글 목록 조회
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        body,
        is_anonymous,
        created_at,
        boards (
          name,
          type
        )
      `)
      .eq('board_id', board.id)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('❌ 게시글 목록 조회 실패:', postsError);
    } else {
      console.log('✅ 게시글 목록 조회 성공 (총', posts.length, '개):');
      posts.forEach((post, index) => {
        console.log(`  ${index + 1}. ${post.title} (${post.is_anonymous ? '익명' : '실명'})`);
      });
    }

    console.log('🎉 게시글 CRUD 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testPostCRUD();
